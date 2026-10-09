import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

// FIPE do estoque, Fase 1 (09/10/2026). Roda todo dia (cron 07h Brasilia):
//   1) consulta /references (1 chamada) e descobre o mes mais recente da FIPE;
//   2) olha os veiculos disponiveis que ainda nao tem valor 'ok' desse mes;
//   3) se nao ha nenhum, termina sem gravar nada;
//   4) senao busca o valor do mes atual e do anterior na API gratuita (v2),
//      grava em `fipe_valores_veiculo` e avisa a Adriana por WhatsApp.
// NAO altera `veiculos` (ver docs/tabela-fipe.md: Mercado Livre/Webmotors leem valor_fipe).
// Variacao acima de 15% contra o mes anterior, ano ambiguo ou codigo nao encontrado
// vira situacao 'revisar' -- nunca chuta valor.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const API = 'https://fipe.parallelum.com.br/api/v2'
const LIMITE_VARIACAO = 0.15
const ORCAMENTO_MS = 110_000 // o cron espera ate 150s; parar antes e deixar 'parcial'
const PAUSA_MS = 800 // a API recomenda 50-60 req/min
const REVISAR_DE_NOVO_APOS_DIAS = 7

type Referencia = { code: string; month: string }
type ItemFipe = { code: string; name: string }
type PrecoFipe = { price: string; model: string; fuel: string; codeFipe: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const normalizar = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const precoParaNumero = (preco: string) =>
  Number(preco.replace(/[^\d,]/g, '').replace(',', '.')) || 0

const brl = (n: number | null) =>
  n == null ? '-' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

class ClienteFipe {
  chamadas = 0
  tokenInvalido = false
  private usarToken: boolean
  private token: string

  constructor() {
    this.token = Deno.env.get('FIPE_API_TOKEN') ?? ''
    this.usarToken = this.token.length > 0
  }

  async get<T>(caminho: string): Promise<{ status: number; data: T | null }> {
    if (this.chamadas > 0) await sleep(PAUSA_MS)
    this.chamadas++
    const headers: Record<string, string> = this.usarToken
      ? { 'X-Subscription-Token': this.token }
      : {}
    let res = await fetch(`${API}${caminho}`, { headers, signal: AbortSignal.timeout(15000) })
    if (res.status === 401 && this.usarToken) {
      // Token recusado: cai para o modo sem token (limite menor) e avisa no relatorio.
      this.usarToken = false
      this.tokenInvalido = true
      await res.arrayBuffer()
      this.chamadas++
      res = await fetch(`${API}${caminho}`, { signal: AbortSignal.timeout(15000) })
    }
    if (res.status === 429) throw new Error('Limite diário da API FIPE atingido (HTTP 429)')
    if (!res.ok) {
      await res.arrayBuffer()
      return { status: res.status, data: null }
    }
    return { status: res.status, data: (await res.json()) as T }
  }
}

async function enviarWhatsApp(supabase: any, texto: string): Promise<boolean> {
  const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')
  const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')
  if (!waToken || !waPhoneId) return false
  const { data: cfg } = await supabase
    .from('social_configuracoes')
    .select('whatsapp_number')
    .maybeSingle()
  const dono = cfg?.whatsapp_number || '5534999484285'
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: dono.replace(/\D/g, ''),
        type: 'text',
        text: { body: texto },
      }),
    })
    await res.arrayBuffer()
    return res.ok
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const fipe = new ClienteFipe()
  const inicio = Date.now()
  let referenciaAtual: Referencia | null = null

  const responder = (corpo: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    // 1) Mes mais recente
    const refs = await fipe.get<Referencia[]>('/references')
    if (!refs.data?.length) throw new Error(`FIPE /references HTTP ${refs.status}`)
    referenciaAtual = refs.data[0]
    const anterior = refs.data[1] ?? null

    // 2) Veiculos disponiveis que ainda precisam de valor neste mes
    const { data: veiculos, error: errVeic } = await supabase
      .from('veiculos')
      .select('id, placa, marca, modelo, ano_modelo, combustivel, codigo_fipe, info_personalizadas')
      .eq('status', 'disponivel')
    if (errVeic) throw errVeic

    const { data: jaTem, error: errJa } = await supabase
      .from('fipe_valores_veiculo')
      .select('veiculo_id, situacao, consultado_em')
      .eq('referencia_codigo', referenciaAtual.code)
    if (errJa) throw errJa

    const limiteRevisao = Date.now() - REVISAR_DE_NOVO_APOS_DIAS * 86_400_000
    const resolvidos = new Set(
      (jaTem ?? [])
        .filter(
          (r: any) => r.situacao === 'ok' || new Date(r.consultado_em).getTime() > limiteRevisao,
        )
        .map((r: any) => r.veiculo_id),
    )
    const pendentes = (veiculos ?? []).filter((v: any) => !resolvidos.has(v.id))

    // 3) Nada a fazer: termina sem gravar
    if (pendentes.length === 0) {
      return responder({ success: true, sem_novidade: true, referencia: referenciaAtual.month })
    }

    const { count: concluidasAntes } = await supabase
      .from('fipe_estoque_execucoes')
      .select('id', { count: 'exact', head: true })
      .eq('referencia_codigo', referenciaAtual.code)
      .eq('status', 'concluida')
    const mesNovo = (concluidasAntes ?? 0) === 0

    // 4) Busca e grava
    const linhas: Record<string, unknown>[] = []
    const revisar: { v: any; motivo: string }[] = []
    const anosPorCodigo = new Map<string, ItemFipe[] | null>()
    let ok = 0
    let processados = 0
    let estourouOrcamento = false

    for (const v of pendentes as any[]) {
      if (Date.now() - inicio > ORCAMENTO_MS) {
        estourouOrcamento = true
        break
      }
      processados++
      const codigo = String(v.codigo_fipe || v.info_personalizadas?.codigo_fipe || '').trim()
      const base = {
        veiculo_id: v.id,
        referencia_codigo: referenciaAtual.code,
        referencia_mes: referenciaAtual.month,
        codigo_fipe: codigo || 'sem-codigo',
        ano_modelo: v.ano_modelo ?? null,
        consultado_em: new Date().toISOString(),
      }
      const marcarRevisar = (motivo: string, extra: Record<string, unknown> = {}) => {
        linhas.push({ ...base, valor: null, situacao: 'revisar', motivo, ...extra })
        revisar.push({ v, motivo })
      }

      if (!/^\d{6}-\d$/.test(codigo) || !v.ano_modelo) {
        marcarRevisar('sem código FIPE válido ou sem ano do modelo no cadastro')
        continue
      }

      // Codigo do ano na FIPE (ex.: "2023-5" = 2023 Flex)
      if (!anosPorCodigo.has(codigo)) {
        const r = await fipe.get<ItemFipe[]>(`/cars/${codigo}/years`)
        anosPorCodigo.set(codigo, r.data)
      }
      const anos = anosPorCodigo.get(codigo)
      if (!anos) {
        marcarRevisar('código FIPE não encontrado na API')
        continue
      }
      let candidatos = anos.filter((a) => a.name.startsWith(String(v.ano_modelo)))
      if (candidatos.length > 1 && v.combustivel) {
        const comb = normalizar(v.combustivel)
        const filtrados = candidatos.filter((a) => normalizar(a.name).includes(comb))
        if (filtrados.length > 0) candidatos = filtrados
      }
      if (candidatos.length !== 1) {
        marcarRevisar(
          candidatos.length === 0
            ? `ano ${v.ano_modelo} não existe para este código na FIPE`
            : `ano ${v.ano_modelo} ambíguo na FIPE (${candidatos.map((c) => c.name).join(' / ')})`,
        )
        continue
      }
      const anoCodigo = candidatos[0].code

      const atual = await fipe.get<PrecoFipe>(
        `/cars/${codigo}/years/${anoCodigo}?reference=${referenciaAtual.code}`,
      )
      const valorAtual = atual.data ? precoParaNumero(atual.data.price) : 0
      if (!atual.data || valorAtual <= 0) {
        marcarRevisar(`FIPE sem valor para ${anoCodigo} em ${referenciaAtual.month}`, {
          ano_codigo: anoCodigo,
        })
        continue
      }

      // Mes anterior: serve de historico e de trava de variacao
      let valorAnterior = 0
      if (anterior) {
        const ant = await fipe.get<PrecoFipe>(
          `/cars/${codigo}/years/${anoCodigo}?reference=${anterior.code}`,
        )
        valorAnterior = ant.data ? precoParaNumero(ant.data.price) : 0
        if (valorAnterior > 0) {
          linhas.push({
            ...base,
            referencia_codigo: anterior.code,
            referencia_mes: anterior.month,
            valor: valorAnterior,
            ano_codigo: anoCodigo,
            combustivel: ant.data!.fuel,
            modelo_fipe: ant.data!.model,
            situacao: 'ok',
            motivo: null,
          })
        }
      }

      const variacao = valorAnterior > 0 ? (valorAtual - valorAnterior) / valorAnterior : 0
      const linhaAtual = {
        ...base,
        valor: valorAtual,
        ano_codigo: anoCodigo,
        combustivel: atual.data.fuel,
        modelo_fipe: atual.data.model,
      }
      if (Math.abs(variacao) > LIMITE_VARIACAO) {
        const motivo = `variação de ${(variacao * 100).toFixed(1).replace('.', ',')}% contra o mês anterior (${brl(valorAnterior)} → ${brl(valorAtual)})`
        linhas.push({ ...linhaAtual, situacao: 'revisar', motivo })
        revisar.push({ v, motivo })
      } else {
        linhas.push({ ...linhaAtual, situacao: 'ok', motivo: null })
        ok++
      }
    }

    if (linhas.length > 0) {
      const { error: errUp } = await supabase
        .from('fipe_valores_veiculo')
        .upsert(linhas, { onConflict: 'veiculo_id,referencia_codigo' })
      if (errUp) throw errUp
    }

    const status = estourouOrcamento ? 'parcial' : 'concluida'
    const fmtVeic = (v: any) =>
      `${v.marca} ${v.modelo} ${v.ano_modelo ?? ''} (${v.placa ?? 's/ placa'})`
    const listaRevisar = revisar
      .slice(0, 15)
      .map((r) => `• ${fmtVeic(r.v)}: ${r.motivo}`)
      .join('\n')

    // 5) Aviso (mes novo concluido, execucao parcial, token recusado ou veiculo para revisar em mes novo)
    const deveAvisar =
      (mesNovo && status === 'concluida') ||
      status === 'parcial' ||
      fipe.tokenInvalido ||
      (mesNovo && revisar.length > 0)
    let alertaEnviado = false
    if (deveAvisar) {
      const texto = `📊 *FIPE do estoque — ${referenciaAtual.month}*
${status === 'concluida' ? '✅ Processamento concluído' : '⚠️ Processamento PARCIAL (continua amanhã)'}
Veículos processados: ${processados} · valores confirmados: ${ok} · para revisar: ${revisar.length}
${revisar.length > 0 ? `\n*Para revisar:*\n${listaRevisar}\n` : ''}${fipe.tokenInvalido ? '\n⚠️ O token da FIPE foi recusado (HTTP 401). Usando o modo sem token; gere uma chave nova em fipe.api.br.\n' : ''}
Os valores ficam na tabela fipe_valores_veiculo. Nada foi alterado nos veículos.`
      alertaEnviado = await enviarWhatsApp(supabase, texto)
    }

    await supabase.from('fipe_estoque_execucoes').insert({
      referencia_codigo: referenciaAtual.code,
      referencia_mes: referenciaAtual.month,
      status,
      veiculos_processados: processados,
      veiculos_ok: ok,
      veiculos_revisar: revisar.length,
      chamadas_api: fipe.chamadas,
      token_invalido: fipe.tokenInvalido,
      alerta_enviado: alertaEnviado,
      detalhes: {
        mes_novo: mesNovo,
        revisar: revisar.map((r) => ({ placa: r.v.placa, motivo: r.motivo })),
      },
    })

    return responder({
      success: true,
      status,
      referencia: referenciaAtual.month,
      mes_novo: mesNovo,
      processados,
      ok,
      revisar: revisar.length,
      chamadas_api: fipe.chamadas,
      token_invalido: fipe.tokenInvalido,
      alerta_enviado: alertaEnviado,
    })
  } catch (err: any) {
    const mensagem = err?.message || String(err)
    console.error('Erro em fipe-atualizar-estoque:', mensagem)
    // No maximo 1 aviso de erro a cada 20h, para nao encher o WhatsApp.
    const { count: avisosRecentes } = await supabase
      .from('fipe_estoque_execucoes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'erro')
      .eq('alerta_enviado', true)
      .gt('executado_em', new Date(Date.now() - 20 * 3_600_000).toISOString())
    let alertaEnviado = false
    if ((avisosRecentes ?? 0) === 0) {
      alertaEnviado = await enviarWhatsApp(
        supabase,
        `⚠️ *FIPE do estoque*: a atualização falhou.\nErro: ${mensagem}\nTento de novo amanhã às 07h.`,
      )
    }
    await supabase.from('fipe_estoque_execucoes').insert({
      referencia_codigo: referenciaAtual?.code ?? null,
      referencia_mes: referenciaAtual?.month ?? null,
      status: 'erro',
      chamadas_api: fipe.chamadas,
      token_invalido: fipe.tokenInvalido,
      alerta_enviado: alertaEnviado,
      erro: mensagem,
    })
    return responder({ success: false, error: mensagem }, 500)
  }
})
