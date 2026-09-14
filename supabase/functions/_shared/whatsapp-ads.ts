import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface CommandContext {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseServiceKey: string
  internalSecret: string
  waToken: string
  waPhoneId: string
  fromPhone: string
}

// Tetos de seguranca por comando ORCAMENTO isolado (nao soma campanhas ativas
// ao mesmo tempo -- ver limitacao sabida em docs/marketing-whatsapp-comandos.md,
// item 5). Valores = o que a Adriana manda por PIX toda segunda pra cobrir a
// semana inteira em cada plataforma.
const META_BUDGET_CAP = 600
const GOOGLE_BUDGET_CAP = 200

export interface AnuncioInfo {
  id: string
  name: string
  status: string
  tipo: string
}

export interface CampaignInfo {
  id: string
  name: string
  status: string
  daily_budget: number | null
  platform: 'meta' | 'google'
  // Formato do criativo (Meta) ou tipo de campanha (Google) -- rotulo pronto
  // pra exibir, ver mapeamento em fetchAllCampaigns. Testado ao vivo em
  // 13/09/2026 pros dois (Meta confirmado certo pela Adriana).
  tipo: string
  // Anuncios individuais dentro da campanha (13/09/2026) -- LISTAR mostra
  // esse nivel, nao so a campanha.
  ads: AnuncioInfo[]
}

// Rotulo em pt-BR pro tipo de campanha do Google Ads (campo documentado,
// testado ao vivo em 13/09/2026).
const TIPOS_GOOGLE: Record<string, string> = {
  SEARCH: 'Pesquisa',
  DISPLAY: 'Display',
  VIDEO: 'Vídeo',
  SHOPPING: 'Shopping',
  PERFORMANCE_MAX: 'Performance Max',
  DEMAND_GEN: 'Demand Gen',
  MULTI_CHANNEL: 'Multicanal',
  LOCAL: 'Local',
  SMART: 'Smart',
}

export type MatchResult =
  | { type: 'match'; campaign: CampaignInfo }
  | { type: 'none' }
  | { type: 'ambiguous'; candidates: CampaignInfo[] }

function metaUrl(ctx: CommandContext): string {
  return `${ctx.supabaseUrl}/functions/v1/ads-agent`
}

function googleUrl(ctx: CommandContext): string {
  return `${ctx.supabaseUrl}/functions/v1/google-ads-agent`
}

async function callAgent(
  url: string,
  body: Record<string, unknown>,
  ctx: CommandContext,
): Promise<{ ok: boolean; data: any }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ads-agent/google-ads-agent tem verify_jwt=true (feitas pro painel
        // admin, chamado com login de usuario) -- sem Authorization com JWT
        // valido, a propria borda do Supabase barra com 401 antes do codigo
        // da function rodar (achado 12/09/2026: nenhum log, nem erro, so
        // silencio -- nao e o app que rejeita, e o gateway). A chave de
        // servico satisfaz o gateway; x-internal-secret continua sendo o
        // que de fato autoriza a acao dentro da function.
        Authorization: `Bearer ${ctx.supabaseServiceKey}`,
        'x-internal-secret': ctx.internalSecret,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.error) return { ok: false, data }
    return { ok: true, data }
  } catch (e) {
    return { ok: false, data: { error: String(e) } }
  }
}

export async function fetchAllCampaigns(ctx: CommandContext): Promise<CampaignInfo[]> {
  const [meta, google] = await Promise.all([
    callAgent(metaUrl(ctx), { action: 'list_campaigns', platform: 'meta', params: {} }, ctx),
    callAgent(googleUrl(ctx), { action: 'list_campaigns', params: {} }, ctx),
  ])

  const metaCampaigns: CampaignInfo[] = meta.ok
    ? (meta.data.campaigns || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        daily_budget: c.daily_budget != null ? Number(c.daily_budget) / 100 : null,
        platform: 'meta' as const,
        tipo: c.ad_format || 'Desconhecido',
        ads: (c.ads || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          status: a.status,
          tipo: a.ad_format || 'Desconhecido',
        })),
      }))
    : []

  const googleCampaigns: CampaignInfo[] = google.ok
    ? (google.data.campaigns || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        daily_budget: c.daily_budget ?? null,
        platform: 'google' as const,
        tipo: TIPOS_GOOGLE[c.channel_type] || c.channel_type || 'Desconhecido',
        ads: (c.ads || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          status: a.status,
          tipo: a.ad_type || 'Desconhecido',
        })),
      }))
    : []

  return [...metaCampaigns, ...googleCampaigns]
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Casa o texto digitado ("hilux", "civic touring") contra o nome real da
// campanha (Meta + Google juntas). Por palavra, nao por trecho continuo --
// "civic touring" tem que bater com "Honda Civic 2023 Touring Prata" mesmo
// com "2023" no meio. Mesmo nome nas duas plataformas conta como 2+ matches
// (ambiguo), forcando especificar -- decisao ja fechada no plano.
export function findCampaignMatch(nome: string, campaigns: CampaignInfo[]): MatchResult {
  const termos = normalize(nome).split(/\s+/).filter(Boolean)
  if (termos.length === 0) return { type: 'none' }

  const candidatos = campaigns.filter((c) => {
    const nomeNormalizado = normalize(c.name)
    return termos.every((termo) => nomeNormalizado.includes(termo))
  })

  if (candidatos.length === 0) return { type: 'none' }
  if (candidatos.length === 1) return { type: 'match', campaign: candidatos[0] }
  return { type: 'ambiguous', candidates: candidatos }
}

// Padrao de exibicao pra qualquer resposta sobre anuncio de veiculo (pedido
// da Adriana, 13/09/2026): nome + ano (se tiver) + tipo de anuncio (formato
// do criativo na Meta, tipo de campanha no Google). Achado 13/09/2026: as
// campanhas reais da conta sao por OBJETIVO de marketing ("Captacao de
// leads", "Website_traffic"), nao uma por veiculo -- raramente tem ano no
// nome. So mostra o ano quando aparecer de verdade (4 digitos, 19xx/20xx),
// sem inventar "?" pra disfarcar que nao achou.
function formatarItem(nomeCompleto: string, tipo: string): string {
  const match = nomeCompleto.match(/\b(19|20)\d{2}\b/)
  if (!match) return `${nomeCompleto} (${tipo})`
  const ano = match[0]
  const nome = nomeCompleto.replace(ano, '').replace(/\s{2,}/g, ' ').trim()
  return `${nome} ${ano} (${tipo})`
}

function formatarCampanha(c: CampaignInfo): string {
  return formatarItem(c.name, c.tipo)
}

function listarOpcoes(candidates: CampaignInfo[], nome: string): string {
  if (candidates.length === 0) return `❌ Nenhuma campanha encontrada com "${nome}".`
  const linhas = candidates.map((c, i) => `${i + 1}. ${formatarCampanha(c)}`).join('\n')
  return `⚠️ Mais de uma campanha bate com "${nome}". Especifique melhor:\n\n${linhas}`
}

// Anuncio individual da Meta (nao da campanha) -- so Meta hoje, porque so o
// toggle_status da Meta aceita qualquer id de objeto (anuncio, ad set ou
// campanha). Google (aplicar_solicitacao) so muda status de CAMPANHA ainda,
// ver docs/marketing-whatsapp-comandos.md.
function flattenMetaAds(campaigns: CampaignInfo[]): AnuncioInfo[] {
  return campaigns.filter((c) => c.platform === 'meta').flatMap((c) => c.ads)
}

type AdMatchResult =
  | { type: 'match'; items: AnuncioInfo[] }
  | { type: 'none' }
  | { type: 'ambiguous'; candidates: AnuncioInfo[] }

// Pedido explicito da Adriana (13/09/2026): PAUSAR/ATIVAR agem em TODOS os
// anuncios do carro em questao de uma vez -- agrupa pelo mesmo "nome limpo"
// (sem marcador de formato/copia, ver limparNomeAnuncio) usado no LISTAR,
// nao so por nome identico. "Commander" bate com "Commander Estatico 2022"
// E "Commander Carrossel 2022" juntos; anos diferentes (unidades diferentes
// de estoque) continuam distintos e pedem especificar.
function findAdMatch(nome: string, ads: AnuncioInfo[]): AdMatchResult {
  const termos = normalize(nome).split(/\s+/).filter(Boolean)
  if (termos.length === 0) return { type: 'none' }

  const candidatos = ads.filter((a) => {
    const nomeNormalizado = normalize(a.name)
    return termos.every((termo) => nomeNormalizado.includes(termo))
  })

  if (candidatos.length === 0) return { type: 'none' }
  const chaves = new Set(candidatos.map((a) => normalize(limparNomeAnuncio(a.name) || a.name)))
  if (chaves.size === 1) return { type: 'match', items: candidatos }
  return { type: 'ambiguous', candidates: candidatos }
}

function listarOpcoesAnuncios(candidates: AnuncioInfo[], nome: string): string {
  const linhas = candidates.map((a, i) => `${i + 1}. ${formatarItem(a.name, a.tipo)}`).join('\n')
  return `⚠️ Mais de um anúncio bate com "${nome}". Especifique melhor:\n\n${linhas}`
}

function juntarTipos(tipos: string[]): string {
  const unicos = [...new Set(tipos)]
  if (unicos.length === 1) return unicos[0]
  if (unicos.length === 2) return `${unicos[0]} e ${unicos[1]}`
  return `${unicos.slice(0, -1).join(', ')} e ${unicos[unicos.length - 1]}`
}

// Achado 13/09/2026: o nome do anuncio muitas vezes embute o formato como
// texto ("AD01 - Commander Estático 2022" vs "AD01 - Commander Carrossel
// 2022 e "— Cópia" pra variacao de publico) -- pro mesmo carro, isso fazia
// virar 2+ linhas so por causa do texto, mesmo com a mesma marca/ano. Tira
// esses marcadores do nome antes de agrupar (a informacao deles ja aparece
// no tipo, entre parenteses). So por PALAVRA INTEIRA, pra nao cortar nome de
// carro de verdade que por acaso contenha essas letras.
function limparNomeAnuncio(nomeCompleto: string): string {
  let s = nomeCompleto
  s = s.replace(/^AD\d+\s*[-–—]?\s*/i, '')
  s = s.replace(/[-–—]\s*c[óo]pia\b/gi, '')
  s = s.replace(/\b(vd|carrossel|est[aá]tico|v[ií]deo|imagem)\b/gi, '')
  s = s.replace(/[-–—]/g, ' ')
  return s.replace(/\s{2,}/g, ' ').trim()
}

// Agrupa anuncios do MESMO carro (nome limpo igual, ver limparNomeAnuncio
// acima) numa linha so, juntando os tipos (ex.: "sw4 2023 (Vídeo e
// Carrossel)") em vez de repetir o nome uma vez por copia/formato.
function agruparPorNome(ads: AnuncioInfo[]): string[] {
  const ordem: string[] = []
  const grupos = new Map<string, { nome: string; tipos: string[] }>()
  for (const a of ads) {
    const nomeLimpo = limparNomeAnuncio(a.name) || a.name
    const chave = normalize(nomeLimpo)
    if (!grupos.has(chave)) {
      grupos.set(chave, { nome: nomeLimpo, tipos: [] })
      ordem.push(chave)
    }
    grupos.get(chave)!.tipos.push(a.tipo)
  }
  return ordem.map((chave) => {
    const { nome, tipos } = grupos.get(chave)!
    return formatarItem(nome, juntarTipos(tipos))
  })
}

export async function handleAnuncios(ctx: CommandContext): Promise<string> {
  const { data, error } = await ctx.supabase
    .from('ads_audit_logs')
    .select('plataforma, acao, status, detalhes, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) return '❌ Nenhum log de anúncios encontrado.'

  const byPlatform: Record<string, number> = {}
  data.forEach((log) => {
    const p = log.plataforma || 'unknown'
    byPlatform[p] = (byPlatform[p] || 0) + 1
  })

  const summary = Object.entries(byPlatform)
    .map(([platform, count]) => `• ${platform}: ${count} ações`)
    .join('\n')

  const recentActions = data
    .slice(0, 5)
    .map((l, i) => `${i + 1}. [${l.plataforma}] ${l.acao} - ${l.status || 'N/A'}`)
    .join('\n')

  return `📊 *Resumo de Anúncios:*\n\n${summary}\n\n*Ações Recentes:*\n${recentActions}`
}

export async function handleListar(ctx: CommandContext): Promise<string> {
  const campaigns = await fetchAllCampaigns(ctx)
  if (campaigns.length === 0) return '❌ Nenhuma campanha encontrada (ou erro ao consultar as duas plataformas).'

  const ativas = campaigns.filter((c) => c.status === 'ACTIVE')
  if (ativas.length === 0) return '📋 Nenhuma campanha ativa no momento.'

  // Abre cada campanha ate o nivel de anuncio (13/09/2026, pedido da Adriana
  // -- a campanha em si e so o "grupo" por objetivo de marketing, o anuncio
  // individual e onde o formato de verdade aparece).
  const blocos = ativas.map((c) => {
    const anunciosAtivos = c.ads.filter((a) => a.status === 'ACTIVE')
    const linhasAnuncio =
      anunciosAtivos.length > 0
        ? agruparPorNome(anunciosAtivos)
            .map((linha) => `  • ${linha}`)
            .join('\n')
        : '  (sem anúncio ativo dentro desta campanha)'
    return `*${c.name}* (${c.platform === 'meta' ? 'Meta' : 'Google'})\n${linhasAnuncio}`
  })

  return `📋 *Campanhas ativas (${ativas.length}):*\n\n${blocos.join('\n\n')}\n\nQuer *PAUSAR*, *ATIVAR* ou *ALTERAR* algum desses anúncios?\n\n*Comandos disponíveis:*\n• GASTO — ver gasto vs. limite nas duas plataformas\n• PAUSAR [nome] — pausar um anúncio ativo\n• ATIVAR [nome] — reativar um anúncio pausado\n• ORÇAMENTO [nome] [valor] — mudar o valor investido por dia`
}

async function handleToggleStatus(
  nome: string,
  novoStatus: 'ACTIVE' | 'PAUSED',
  ctx: CommandContext,
): Promise<string> {
  const comando = novoStatus === 'PAUSED' ? 'PAUSAR' : 'ATIVAR'
  if (!nome) return `❌ Use: ${comando} [nome do anúncio ou campanha]`

  const campaigns = await fetchAllCampaigns(ctx)
  const emoji = novoStatus === 'PAUSED' ? '⏸️' : '▶️'
  const acaoTexto = novoStatus === 'PAUSED' ? 'pausado' : 'ativado'
  const acaoVerbo = novoStatus === 'PAUSED' ? 'pausar' : 'ativar'

  // 1) Tenta primeiro no ANUNCIO individual da Meta (o carro, ex.: "Compass")
  // -- e o nivel que a Adriana realmente quer mexer na maioria das vezes.
  const adResult = findAdMatch(nome, flattenMetaAds(campaigns))
  if (adResult.type === 'ambiguous') return listarOpcoesAnuncios(adResult.candidates, nome)
  if (adResult.type === 'match') {
    const resultados = await Promise.all(
      adResult.items.map((a) =>
        callAgent(
          metaUrl(ctx),
          { action: 'toggle_status', platform: 'meta', params: { campaign_id: a.id, new_status: novoStatus } },
          ctx,
        ),
      ),
    )
    const falhas = resultados.filter((r) => !r.ok)
    if (falhas.length === resultados.length) {
      return `❌ Erro ao ${acaoVerbo} "${nome}": ${falhas[0]?.data?.error || 'falha na API da Meta'}`
    }
    const nomes = [...new Set(adResult.items.map((a) => a.name))].join(', ')
    const plural = adResult.items.length > 1 ? 's' : ''
    return `${emoji} Anúncio${plural} ${acaoTexto}${plural}:\n\n*${nomes}* (Meta)`
  }

  // 2) Nao achou entre os anuncios da Meta -- tenta como CAMPANHA (cobre
  // Google, que ainda so aceita pausar/ativar a campanha inteira, nao o
  // anuncio individual -- fila de solicitacao nao tem esse nivel ainda).
  const resolved = findCampaignMatch(nome, campaigns)
  if (resolved.type === 'none') return `❌ Nenhum anúncio ou campanha encontrado com "${nome}".`
  if (resolved.type === 'ambiguous') return listarOpcoes(resolved.candidates, nome)

  const campanha = resolved.campaign

  if (campanha.platform === 'meta') {
    const res = await callAgent(
      metaUrl(ctx),
      { action: 'toggle_status', platform: 'meta', params: { campaign_id: campanha.id, new_status: novoStatus } },
      ctx,
    )
    if (!res.ok) return `❌ Erro ao ${acaoVerbo} "${campanha.name}": ${res.data?.error || 'falha na API da Meta'}`
    return `${emoji} Campanha ${novoStatus === 'PAUSED' ? 'pausada' : 'ativada'}:\n\n*${campanha.name}* (Meta)`
  }

  // Google Ads ainda nao tem execucao direta de status/orcamento nesta
  // function (so a fila de solicitacoes) -- via WhatsApp a acao fica
  // registrada pendente, igual ja acontece hoje no painel admin pra Google.
  const res = await callAgent(
    googleUrl(ctx),
    {
      action: 'criar_solicitacao',
      params: {
        tipo_ajuste: 'status',
        campanha_id: campanha.id,
        campanha_nome: campanha.name,
        valor_atual: campanha.status,
        valor_novo: { status: novoStatus },
        origem: 'whatsapp',
        descricao: `Solicitado via WhatsApp por ${ctx.fromPhone}`,
      },
    },
    ctx,
  )
  if (!res.ok) return `❌ Erro ao registrar solicitação pro Google: ${res.data?.error || 'falha na API'}`
  return `📝 Google Ads ainda exige aprovação no painel.\n\nSolicitação registrada pra ${acaoVerbo} *${campanha.name}* (Google).\nAprove em Gestão de Anúncios.`
}

export async function handlePausar(nome: string, ctx: CommandContext): Promise<string> {
  return handleToggleStatus(nome, 'PAUSED', ctx)
}

export async function handleAtivar(nome: string, ctx: CommandContext): Promise<string> {
  return handleToggleStatus(nome, 'ACTIVE', ctx)
}

export async function handleOrcamento(rest: string, ctx: CommandContext): Promise<string> {
  const parts = rest.trim().split(/\s+/)
  if (parts.length < 2) return '❌ Use: ORÇAMENTO [nome da campanha] [valor]'

  const valorTexto = parts[parts.length - 1]
  const nome = parts.slice(0, -1).join(' ')
  const valor = parseFloat(valorTexto.replace(',', '.'))
  if (isNaN(valor)) return '❌ Valor inválido. Use: ORÇAMENTO [nome da campanha] [valor]'

  const campaigns = await fetchAllCampaigns(ctx)
  const resolved = findCampaignMatch(nome, campaigns)
  if (resolved.type === 'none') {
    // Orcamento nao existe por anuncio individual na Meta, so por campanha
    // -- se o nome bater com um anuncio (carro), avisa isso em vez de só
    // dizer "não encontrado" (achado 13/09/2026, campanha "[AEG][VENDAS]..."
    // tem 25 carros dividindo o mesmo orçamento).
    const adResult = findAdMatch(nome, flattenMetaAds(campaigns))
    if (adResult.type === 'match' || adResult.type === 'ambiguous') {
      return `❌ Orçamento não existe por anúncio individual na Meta, só por campanha (o grupo inteiro de anúncios). "${nome}" está dentro de uma campanha com vários outros carros — mudar o orçamento afetaria todos juntos.\n\nUse LISTAR pra ver o nome da campanha e mande ORÇAMENTO com o nome dela.`
    }
    return `❌ Nenhuma campanha encontrada com "${nome}".`
  }
  if (resolved.type === 'ambiguous') return listarOpcoes(resolved.candidates, nome)

  const campanha = resolved.campaign
  const cap = campanha.platform === 'meta' ? META_BUDGET_CAP : GOOGLE_BUDGET_CAP
  if (valor > cap) {
    return `❌ Orçamento de R$ ${valor.toFixed(2)} acima do teto de segurança (R$ ${cap.toFixed(2)}/dia em ${
      campanha.platform === 'meta' ? 'Meta' : 'Google'
    }). Ajuste direto no painel se for intencional.`
  }

  if (campanha.platform === 'meta') {
    const res = await callAgent(
      metaUrl(ctx),
      { action: 'update_budget', platform: 'meta', params: { campaign_id: campanha.id, new_budget: valor } },
      ctx,
    )
    if (!res.ok)
      return `❌ Erro ao atualizar orçamento de "${campanha.name}": ${res.data?.error || 'falha na API da Meta'}`
    return `💰 Orçamento atualizado:\n\nCampanha: *${campanha.name}* (Meta)\nNovo valor: R$ ${valor.toFixed(2)}/dia`
  }

  const res = await callAgent(
    googleUrl(ctx),
    {
      action: 'criar_solicitacao',
      params: {
        tipo_ajuste: 'orcamento',
        campanha_id: campanha.id,
        campanha_nome: campanha.name,
        valor_atual: campanha.daily_budget,
        valor_novo: { daily_budget: valor },
        origem: 'whatsapp',
        descricao: `Solicitado via WhatsApp por ${ctx.fromPhone}`,
      },
    },
    ctx,
  )
  if (!res.ok) return `❌ Erro ao registrar solicitação pro Google: ${res.data?.error || 'falha na API'}`
  return `📝 Google Ads ainda exige aprovação no painel.\n\nSolicitação registrada: *${campanha.name}* (Google) → R$ ${valor.toFixed(
    2,
  )}/dia.\nAprove em Gestão de Anúncios.`
}

export async function handleGasto(ctx: CommandContext): Promise<string> {
  const [meta, google] = await Promise.all([
    callAgent(metaUrl(ctx), { action: 'get_account_balance', platform: 'meta', params: {} }, ctx),
    callAgent(googleUrl(ctx), { action: 'get_account_balance', params: {} }, ctx),
  ])

  const linhas: string[] = []

  if (meta.ok) {
    const a = meta.data.account || {}
    const gasto = Number(a.amount_spent || 0) / 100
    const limite = Number(a.spend_cap || 0) / 100
    linhas.push(`*Meta:* R$ ${gasto.toFixed(2)} gasto de R$ ${limite.toFixed(2)} de limite`)
  } else {
    linhas.push('*Meta:* erro ao consultar')
  }

  if (google.ok) {
    const a = google.data.account || {}
    const gasto = Number(a.amount_spent || 0) / 100
    const limite = Number(a.spend_cap || 0) / 100
    linhas.push(`*Google:* R$ ${gasto.toFixed(2)} gasto de R$ ${limite.toFixed(2)} de limite aprovado`)
  } else {
    linhas.push('*Google:* erro ao consultar')
  }

  return `💵 *Gasto atual:*\n\n${linhas.join('\n')}`
}
