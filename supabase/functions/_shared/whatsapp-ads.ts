import { createClient } from 'jsr:@supabase/supabase-js@2'
import { VALIDADE_MINUTOS, type Preparo } from './whatsapp-confirmacao.ts'

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
  const nome = nomeCompleto
    .replace(ano, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
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
interface GrupoAnuncio {
  nomeLimpo: string
  linha: string
}

function agruparPorNomeItens(ads: AnuncioInfo[]): GrupoAnuncio[] {
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
    return { nomeLimpo: nome, linha: formatarItem(nome, juntarTipos(tipos)) }
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

export interface ItemLista {
  rotulo: string
  // Texto que o PAUSAR/ATIVAR ja sabe resolver (nome limpo do anuncio ou nome
  // da campanha) -- "pausar 2" vira "pausar <busca do item 2>".
  busca: string
}

const MAX_PAUSADOS_NA_LISTA = 10

// Lista numerada (3 lacunas do LISTAR fechadas em 31/10/2026): ativos E
// pausados (pra ATIVAR ter o que ativar) e numero em cada item (pra
// "PAUSAR 2"). Quem chama guarda `itens` como pedido pendente do tipo lista.
export async function handleListar(
  ctx: CommandContext,
  apenasPausados = false,
): Promise<{ texto: string; itens: ItemLista[] }> {
  const campaigns = await fetchAllCampaigns(ctx)
  if (campaigns.length === 0) {
    return {
      texto: '❌ Nenhuma campanha encontrada (ou erro ao consultar as duas plataformas).',
      itens: [],
    }
  }

  const itens: ItemLista[] = []
  const rotuloPlataforma = (c: CampaignInfo) => (c.platform === 'meta' ? 'Meta' : 'Google')
  const adicionar = (rotulo: string, busca: string): string => {
    itens.push({ rotulo, busca })
    return `  ${itens.length}. ${rotulo}`
  }

  // Abre cada campanha ate o nivel de anuncio (13/09/2026, pedido da Adriana
  // -- a campanha em si e so o "grupo" por objetivo de marketing, o anuncio
  // individual e onde o formato de verdade aparece).
  const ativas = campaigns.filter((c) => c.status === 'ACTIVE')
  const blocosAtivos = ativas.map((c) => {
    const anunciosAtivos = c.ads.filter((a) => a.status === 'ACTIVE')
    let linhas: string
    if (anunciosAtivos.length > 0) {
      linhas = agruparPorNomeItens(anunciosAtivos)
        .map((g) => adicionar(g.linha, g.nomeLimpo))
        .join('\n')
    } else if (c.platform === 'google') {
      linhas = adicionar(`${formatarCampanha(c)} — campanha inteira`, c.name)
    } else {
      linhas = '  (sem anúncio ativo dentro desta campanha)'
    }
    return `*${c.name}* (${rotuloPlataforma(c)})\n${linhas}`
  })

  // Pausados: anuncios pausados dentro de campanha ativa + campanhas pausadas.
  const linhasPausadas: string[] = []
  let omitidos = 0
  const limite = apenasPausados ? 30 : MAX_PAUSADOS_NA_LISTA
  const empurrarPausado = (rotulo: string, busca: string) => {
    if (linhasPausadas.length >= limite) {
      omitidos++
      return
    }
    linhasPausadas.push(adicionar(rotulo, busca))
  }
  for (const c of campaigns) {
    if (c.status === 'ACTIVE') {
      const pausados = c.ads.filter((a) => a.status === 'PAUSED')
      for (const g of agruparPorNomeItens(pausados))
        empurrarPausado(`${g.linha} — ${rotuloPlataforma(c)}`, g.nomeLimpo)
    } else if (c.status === 'PAUSED') {
      empurrarPausado(`${formatarCampanha(c)} — campanha inteira (${rotuloPlataforma(c)})`, c.name)
    }
  }

  const partes: string[] = []
  if (!apenasPausados) {
    partes.push(
      ativas.length === 0
        ? '📋 Nenhuma campanha ativa no momento.'
        : `📋 *Campanhas ativas (${ativas.length}):*\n\n${blocosAtivos.join('\n\n')}`,
    )
  }
  if (linhasPausadas.length > 0) {
    partes.push(
      `⏸️ *Pausados:*\n${linhasPausadas.join('\n')}${omitidos > 0 ? `\n  (+${omitidos} pausados não mostrados — mande LISTAR PAUSADOS)` : ''}`,
    )
  } else if (apenasPausados) {
    partes.push('⏸️ Nenhum anúncio ou campanha pausado no momento.')
  }

  const acoes =
    itens.length > 0
      ? 'Pra agir, responda com o número: *PAUSAR 2*, *ATIVAR 5*… (eu peço confirmação antes).\nPra mudar o valor por dia: *ORÇAMENTO [nome da campanha] [valor]*.'
      : 'Nada pra pausar ou ativar agora.'
  partes.push(`${acoes}\n\n*Outros:* GASTO — gasto vs. limite nas duas plataformas`)

  return { texto: partes.join('\n\n'), itens }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Le o estado REAL na Meta depois da acao (list_campaigns): id -> status.
// A Meta pode demorar alguns segundos pra refletir: ate 2 leituras, com
// espera antes de cada uma. Mapa vazio = nao deu pra ler (nao confirma nada).
async function lerStatusMeta(
  ctx: CommandContext,
  ids: string[],
  esperado: string,
): Promise<Map<string, string>> {
  let estado = new Map<string, string>()
  for (const espera of [3000, 4000]) {
    await sleep(espera)
    const campaigns = await fetchAllCampaigns(ctx)
    estado = new Map()
    for (const c of campaigns.filter((x) => x.platform === 'meta')) {
      estado.set(c.id, c.status)
      for (const a of c.ads) estado.set(a.id, a.status)
    }
    if (ids.every((id) => estado.get(id) === esperado)) break
  }
  return estado
}

// Erro cru do banco/API (em ingles) vai pro log; a usuaria recebe so a versao em portugues.
function erroSolicitacaoGoogle(data: unknown): string {
  console.error('whatsapp-ads: falha ao registrar solicitacao no Google', data)
  return '❌ Não consegui registrar a solicitação no Google. Nada foi alterado. Tente de novo ou peça pelo painel (Gestão de Anúncios).'
}

// PREPARA (nao altera nada): acha o alvo exato e devolve a pergunta SIM/NAO.
// A execucao so acontece em executarToggle, depois do "sim".
export async function prepararToggle(
  nome: string,
  novoStatus: 'ACTIVE' | 'PAUSED',
  ctx: CommandContext,
): Promise<Preparo> {
  const comando = novoStatus === 'PAUSED' ? 'PAUSAR' : 'ATIVAR'
  if (!nome)
    return {
      resposta: `❌ Use: ${comando} [nome do anúncio ou campanha] — ou o número da lista (LISTAR).`,
    }

  const campaigns = await fetchAllCampaigns(ctx)
  const emoji = novoStatus === 'PAUSED' ? '⏸️' : '▶️'
  const acaoVerbo = novoStatus === 'PAUSED' ? 'pause' : 'ative'
  const jaEsta = novoStatus === 'PAUSED' ? 'pausado' : 'ativo'

  // 1) Tenta primeiro no ANUNCIO individual da Meta (o carro, ex.: "Compass")
  // -- e o nivel que a Adriana realmente quer mexer na maioria das vezes.
  const adResult = findAdMatch(nome, flattenMetaAds(campaigns))
  if (adResult.type === 'ambiguous')
    return { resposta: listarOpcoesAnuncios(adResult.candidates, nome) }
  if (adResult.type === 'match') {
    const mudam = adResult.items.filter((a) => a.status !== novoStatus)
    if (mudam.length === 0) {
      return {
        resposta: `ℹ️ Nada a fazer: o anúncio *${adResult.items[0].name}* já está ${jaEsta} na Meta.`,
      }
    }
    const plural = mudam.length > 1
    const nomes = mudam.map((a) => `• ${a.name}`).join('\n')
    return {
      pedido: {
        comando,
        alvo: {
          plataforma: 'meta',
          modo: 'anuncios',
          novoStatus,
          itens: mudam.map((a) => ({ id: a.id, nome: a.name })),
        },
        resumo: `${comando} ${mudam.map((a) => a.name).join(', ')}`,
        pergunta: `${emoji} Quer realmente que eu ${acaoVerbo} ${plural ? 'estes anúncios' : 'o anúncio'} (Meta)?\n\n${nomes}\n\nResponda *SIM* ou *NÃO* (vale por ${VALIDADE_MINUTOS} minutos).`,
      },
    }
  }

  // 2) Nao achou entre os anuncios da Meta -- tenta como CAMPANHA (cobre
  // Google, que ainda so aceita pausar/ativar a campanha inteira, nao o
  // anuncio individual -- fila de solicitacao nao tem esse nivel ainda).
  const resolved = findCampaignMatch(nome, campaigns)
  if (resolved.type === 'none')
    return { resposta: `❌ Nenhum anúncio ou campanha encontrado com "${nome}".` }
  if (resolved.type === 'ambiguous') return { resposta: listarOpcoes(resolved.candidates, nome) }

  const campanha = resolved.campaign
  if (campanha.status === novoStatus) {
    return {
      resposta: `ℹ️ Nada a fazer: a campanha *${campanha.name}* já está ${jaEsta} (${campanha.platform === 'meta' ? 'Meta' : 'Google'}).`,
    }
  }

  const plataformaTexto = campanha.platform === 'meta' ? 'Meta' : 'Google'
  const aviso =
    campanha.platform === 'google'
      ? `\n\n⚠️ No Google eu só *registro a solicitação*; quem aprova é você, em Gestão de Anúncios.`
      : ''
  return {
    pedido: {
      comando,
      alvo: {
        plataforma: campanha.platform,
        modo: 'campanha',
        novoStatus,
        statusAtual: campanha.status,
        itens: [{ id: campanha.id, nome: campanha.name }],
      },
      resumo: `${comando} campanha ${campanha.name}`,
      pergunta: `${emoji} Quer realmente que eu ${acaoVerbo} a *campanha inteira* *${campanha.name}* (${plataformaTexto})?${aviso}\n\nResponda *SIM* ou *NÃO* (vale por ${VALIDADE_MINUTOS} minutos).`,
    },
  }
}

// EXECUTA o que foi mostrado na pergunta e CONFIRMA DE VERDADE: depois da
// acao le o estado real na Meta e compara com o pedido. "Pausado" so e dito
// se a Meta mostrou pausado; se so uma parte mudou, diz qual nao mudou.
export async function executarToggle(
  alvo: Record<string, any>,
  ctx: CommandContext,
): Promise<string> {
  const novoStatus = alvo.novoStatus as 'ACTIVE' | 'PAUSED'
  const itens = alvo.itens as { id: string; nome: string }[]
  const participio = novoStatus === 'PAUSED' ? 'pausado' : 'ativo'
  const acaoVerbo = novoStatus === 'PAUSED' ? 'pausar' : 'ativar'

  if (alvo.plataforma === 'google') {
    const campanha = itens[0]
    const res = await callAgent(
      googleUrl(ctx),
      {
        action: 'criar_solicitacao',
        params: {
          tipo_ajuste: 'status',
          campanha_id: campanha.id,
          campanha_nome: campanha.nome,
          valor_atual: alvo.statusAtual,
          valor_novo: { status: novoStatus },
          origem: 'agente_ia',
          descricao: `Solicitado via WhatsApp por ${ctx.fromPhone}`,
        },
      },
      ctx,
    )
    if (!res.ok) return erroSolicitacaoGoogle(res.data)
    return `📝 Solicitação registrada pra ${acaoVerbo} *${campanha.nome}* (Google).\n\n⚠️ Ainda NÃO foi ${novoStatus === 'PAUSED' ? 'pausada' : 'ativada'}: o Google exige aprovação em Gestão de Anúncios.`
  }

  const resultados = await Promise.all(
    itens.map((a) =>
      callAgent(
        metaUrl(ctx),
        {
          action: 'toggle_status',
          platform: 'meta',
          params: { campaign_id: a.id, new_status: novoStatus },
        },
        ctx,
      ),
    ),
  )
  const erroApi = resultados.find((r) => !r.ok)?.data?.error

  const estado = await lerStatusMeta(
    ctx,
    itens.map((a) => a.id),
    novoStatus,
  )
  const confirmados = itens.filter((a) => estado.get(a.id) === novoStatus)
  const naoConfirmados = itens.filter((a) => estado.get(a.id) !== novoStatus)

  if (naoConfirmados.length === 0) {
    const nomes = [...new Set(confirmados.map((a) => a.nome))].join(', ')
    return `✅ Confirmado: *${nomes}* ${confirmados.length > 1 ? 'estão' : 'está'} ${participio}${confirmados.length > 1 ? 's' : ''} na Meta. (Conferi o estado real depois de pedir.)`
  }

  const semLeitura = estado.size === 0
  const linhas = naoConfirmados
    .map((a) => `• ${a.nome} — Meta ainda mostra: ${estado.get(a.id) ?? 'não consegui ler'}`)
    .join('\n')
  const confirmadosTexto =
    confirmados.length > 0
      ? `\n\n✅ Confirmados ${participio}s:\n${confirmados.map((a) => `• ${a.nome}`).join('\n')}`
      : ''
  return `⚠️ ${semLeitura ? 'Pedi, mas não consegui reler a Meta pra confirmar' : 'Pedi, mas NÃO consegui confirmar tudo'}.${erroApi ? `\nErro da Meta: ${erroApi}` : ''}\n\n${linhas}${confirmadosTexto}\n\nPra tentar de novo, mande ${acaoVerbo.toUpperCase()} com o nome.`
}

function lerValor(texto: string): number {
  return parseFloat(texto.replace(/[^\d,.]/g, '').replace(',', '.'))
}

export async function prepararOrcamento(rest: string, ctx: CommandContext): Promise<Preparo> {
  const parts = rest.trim().split(/\s+/)
  if (parts.length < 2) return { resposta: '❌ Use: ORÇAMENTO [nome da campanha] [valor]' }

  const valorTexto = parts[parts.length - 1]
  const nome = parts.slice(0, -1).join(' ')
  const valor = lerValor(valorTexto)
  if (isNaN(valor) || valor <= 0)
    return { resposta: '❌ Valor inválido. Use: ORÇAMENTO [nome da campanha] [valor]' }

  const campaigns = await fetchAllCampaigns(ctx)
  const resolved = findCampaignMatch(nome, campaigns)
  if (resolved.type === 'none') {
    // Orcamento nao existe por anuncio individual na Meta, so por campanha
    // -- se o nome bater com um anuncio (carro), avisa isso em vez de só
    // dizer "não encontrado" (achado 13/09/2026, campanha "[AEG][VENDAS]..."
    // tem 25 carros dividindo o mesmo orçamento).
    const adResult = findAdMatch(nome, flattenMetaAds(campaigns))
    if (adResult.type === 'match' || adResult.type === 'ambiguous') {
      return {
        resposta: `❌ Orçamento não existe por anúncio individual na Meta, só por campanha (o grupo inteiro de anúncios). "${nome}" está dentro de uma campanha com vários outros carros — mudar o orçamento afetaria todos juntos.\n\nUse LISTAR pra ver o nome da campanha e mande ORÇAMENTO com o nome dela.`,
      }
    }
    return { resposta: `❌ Nenhuma campanha encontrada com "${nome}".` }
  }
  if (resolved.type === 'ambiguous') return { resposta: listarOpcoes(resolved.candidates, nome) }

  const campanha = resolved.campaign
  const plataformaTexto = campanha.platform === 'meta' ? 'Meta' : 'Google'
  const cap = campanha.platform === 'meta' ? META_BUDGET_CAP : GOOGLE_BUDGET_CAP
  if (valor > cap) {
    return {
      resposta: `❌ Orçamento de R$ ${valor.toFixed(2)} acima do teto de segurança (R$ ${cap.toFixed(2)}/dia em ${plataformaTexto}). Ajuste direto no painel se for intencional.`,
    }
  }
  if (campanha.daily_budget != null && Math.abs(campanha.daily_budget - valor) < 0.01) {
    return {
      resposta: `ℹ️ Nada a fazer: *${campanha.name}* (${plataformaTexto}) já está com R$ ${valor.toFixed(2)}/dia.`,
    }
  }

  const atualTexto =
    campanha.daily_budget != null
      ? `R$ ${campanha.daily_budget.toFixed(2)}`
      : 'valor atual não informado'
  const aviso =
    campanha.platform === 'google'
      ? `\n\n⚠️ No Google eu só *registro a solicitação*; quem aprova é você, em Gestão de Anúncios.`
      : ''
  return {
    pedido: {
      comando: 'ORCAMENTO',
      alvo: {
        plataforma: campanha.platform,
        id: campanha.id,
        nome: campanha.name,
        valorNovo: valor,
        valorAtual: campanha.daily_budget,
      },
      resumo: `ORÇAMENTO ${campanha.name} → R$ ${valor.toFixed(2)}`,
      pergunta: `💰 Quer realmente mudar o orçamento da campanha *${campanha.name}* (${plataformaTexto})?\n\nDe: ${atualTexto}/dia\nPara: R$ ${valor.toFixed(2)}/dia${aviso}\n\nResponda *SIM* ou *NÃO* (vale por ${VALIDADE_MINUTOS} minutos).`,
    },
  }
}

export async function executarOrcamento(
  alvo: Record<string, any>,
  ctx: CommandContext,
): Promise<string> {
  const valor = Number(alvo.valorNovo)

  if (alvo.plataforma === 'google') {
    const res = await callAgent(
      googleUrl(ctx),
      {
        action: 'criar_solicitacao',
        params: {
          tipo_ajuste: 'orcamento',
          campanha_id: alvo.id,
          campanha_nome: alvo.nome,
          valor_atual: alvo.valorAtual,
          valor_novo: { daily_budget: valor },
          origem: 'agente_ia',
          descricao: `Solicitado via WhatsApp por ${ctx.fromPhone}`,
        },
      },
      ctx,
    )
    if (!res.ok) return erroSolicitacaoGoogle(res.data)
    return `📝 Solicitação registrada: *${alvo.nome}* (Google) → R$ ${valor.toFixed(2)}/dia.\n\n⚠️ Ainda NÃO foi alterado: o Google exige aprovação em Gestão de Anúncios.`
  }

  const res = await callAgent(
    metaUrl(ctx),
    {
      action: 'update_budget',
      platform: 'meta',
      params: { campaign_id: alvo.id, new_budget: valor },
    },
    ctx,
  )
  if (!res.ok)
    return `❌ Erro ao atualizar orçamento de "${alvo.nome}": ${res.data?.error || 'falha na API da Meta'}`

  // Confirma de verdade: relê o orcamento diario da campanha.
  let lido: number | null = null
  for (const espera of [3000, 4000]) {
    await sleep(espera)
    const campaigns = await fetchAllCampaigns(ctx)
    lido = campaigns.find((c) => c.platform === 'meta' && c.id === alvo.id)?.daily_budget ?? null
    if (lido != null && Math.abs(lido - valor) < 0.01) break
  }
  if (lido != null && Math.abs(lido - valor) < 0.01) {
    return `✅ Confirmado: orçamento de *${alvo.nome}* (Meta) agora é R$ ${valor.toFixed(2)}/dia. (Conferi o valor real depois de pedir.)`
  }
  return `⚠️ Pedi a mudança, mas NÃO consegui confirmar: a Meta mostra ${lido != null ? `R$ ${lido.toFixed(2)}/dia` : 'valor ilegível'} (esperado R$ ${valor.toFixed(2)}/dia) em *${alvo.nome}*.\n\nConfira no painel da Meta.`
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
    linhas.push(
      `*Google:* R$ ${gasto.toFixed(2)} gasto de R$ ${limite.toFixed(2)} de limite aprovado`,
    )
  } else {
    linhas.push('*Google:* erro ao consultar')
  }

  return `💵 *Gasto atual:*\n\n${linhas.join('\n')}`
}
