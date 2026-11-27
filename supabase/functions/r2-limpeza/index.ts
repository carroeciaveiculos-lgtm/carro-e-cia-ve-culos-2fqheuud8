import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from 'npm:@aws-sdk/client-s3@3'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'
import { getR2Bucket, getR2Client } from '../_shared/r2-storage.ts'

// 26/11/2026 (pedido e decisões da Adriana — MEMORY_WORK.MD, bloco de 26/11/2026).
// Limpa do R2 as fotos/vídeos de veículos vendidos, devolvidos ou excluídos, 30 dias depois,
// mantendo a capa do vendido/devolvido. A fila é preenchida pelo banco (migration r2_limpeza_fila).
//
// Modos (corpo JSON):
//   { }                         → processa a fila em ENSAIO: não apaga nada, só grava o que faria.
//   { executar: true }          → só apaga de verdade se o secret R2_LIMPEZA_ATIVA = 'true' (trava dupla).
//   { modo: 'inventario' }      → lista o bucket e compara com o banco (relatório, nunca apaga).
//   { modo: 'orfaos', executar?: true, limite?: 1-200 } → lixo antigo: arquivos sem uso no banco em pastas
//                                 de veículo vendido/devolvido/excluído vão para a lixeira (em lotes).
//   { modo: 'restaurar_capas', lixeira_dia: 'AAAA-MM-DD', executar?: true } → devolve a capa (pelo nome do
//                                 arquivo) a vendidos/devolvidos sem fotos na ficha.
// Apagar = copiar para lixeira/AAAA-MM-DD/<chave> e remover o original. A regra de expiração do R2
// em lixeira/ (30 dias) apaga de vez; até lá dá para recuperar.
// Chamada pelo cron diário com x-internal-secret (verify_jwt = false).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-secret',
}

const BASE = 'https://imagens.carroeciamotors.com.br/'
// Só fotos/vídeos de veículo. Documentos, contratos, notas e comprovantes nunca ficam nessas pastas.
const PREFIXOS_PERMITIDOS = ['media/', 'veiculos-fotos/']
const LOTE = 50

// Referências que NÃO protegem uma foto do próprio veículo (somem junto com ele).
const TABELAS_DO_PROPRIO_VEICULO = new Set([
  'veiculos',
  'veiculo_fotos_ia',
  'veiculo_criativos',
  'ad_copies',
  'social_esteira',
])
// Histórico/log: guardam cópia do que foi enviado, não usam a foto. Nunca protegem.
const TABELAS_HISTORICO = new Set([
  'sync_log',
  'logs_integracao',
  'estoque_publicacoes',
  'marketing_logs',
  'logs_ia',
  'wm_mapeamento_veiculos',
  'napista_mapeamento_veiculos',
  'veiculos_modelo_versao_backup_fase4',
  'media_assets', // biblioteca: a linha é removida junto com o arquivo
])
const POST_ENCERRADO = new Set(['publicado', 'erro', 'cancelado'])

type Ref = {
  url: string
  tabela: string
  coluna: string
  veiculo_id: string | null
  status_linha: string | null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function chaveDaUrl(url: string): string | null {
  if (!url.startsWith(BASE)) return null
  const bruta = url.slice(BASE.length).split('?')[0]
  try {
    return decodeURIComponent(bruta)
  } catch {
    return bruta
  }
}

// Por que esta URL não pode ser apagada (null = pode).
function motivoProtecao(url: string, veiculoId: string, refs: Ref[]): string | null {
  const chave = chaveDaUrl(url)
  if (!chave) return 'fora do R2'
  if (!PREFIXOS_PERMITIDOS.some((p) => chave.startsWith(p)))
    return `pasta não permitida (${chave.split('/')[0]})`
  for (const r of refs) {
    if (TABELAS_HISTORICO.has(r.tabela)) continue
    if (r.tabela === 'social_posts') {
      if (POST_ENCERRADO.has((r.status_linha || '').toLowerCase())) continue
      return `post ainda não publicado (${r.status_linha})`
    }
    if (TABELAS_DO_PROPRIO_VEICULO.has(r.tabela) && r.veiculo_id === veiculoId) continue
    return `usada em ${r.tabela}.${r.coluna}${r.veiculo_id && r.veiculo_id !== veiculoId ? ' de outro veículo' : ''}`
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const corpo = await req.json().catch(() => ({}))
  const real = corpo?.executar === true && Deno.env.get('R2_LIMPEZA_ATIVA') === 'true'

  try {
    // Tudo num JSON só: a API corta respostas em linhas em 1000, e uma lista cortada faria uma foto em uso
    // parecer livre para apagar.
    const { data: refsJson, error: refsErr } = await supabase.rpc('r2_referencias_urls_json')
    if (refsErr) throw new Error(`r2_referencias_urls_json: ${refsErr.message}`)
    if (!Array.isArray(refsJson)) throw new Error('r2_referencias_urls_json não devolveu lista')
    const refsData = refsJson as Ref[]
    const refsPorUrl = new Map<string, Ref[]>()
    for (const r of refsData) {
      const lista = refsPorUrl.get(r.url) || []
      lista.push(r)
      refsPorUrl.set(r.url, lista)
    }

    if (corpo?.modo === 'inventario') return json(await inventario(supabase, refsPorUrl))
    if (corpo?.modo === 'orfaos') {
      const limite = Math.min(Math.max(Number(corpo?.limite) || 120, 1), 200)
      return json(await limparOrfaos(supabase, refsPorUrl, real, limite))
    }
    if (corpo?.modo === 'restaurar_capas') {
      const dia = /^\d{4}-\d{2}-\d{2}$/.test(corpo?.lixeira_dia || '') ? corpo.lixeira_dia : null
      if (!dia) return json({ success: false, error: 'lixeira_dia (AAAA-MM-DD) obrigatório' }, 400)
      return json(await restaurarCapas(supabase, real, dia))
    }

    const agora = new Date()
    const { data: fila, error: filaErr } = await supabase
      .from('r2_limpeza_fila')
      .select('*')
      .eq('status', 'pendente')
      .lte('agendado_para', agora.toISOString())
      .order('agendado_para', { ascending: true })
      .limit(LOTE)
    if (filaErr) throw new Error(`fila: ${filaErr.message}`)

    const dia = agora.toISOString().slice(0, 10)
    const s3 = getR2Client()
    const bucket = getR2Bucket()
    const resumo = { itens: 0, cancelados: 0, apagaria: 0, apagados: 0, protegidas: 0, falhas: 0 }

    for (const item of fila || []) {
      resumo.itens++
      let urls: string[] = Array.isArray(item.urls) ? item.urls : []
      let capa: string | null = null
      let veiculo: any = null

      if (item.motivo !== 'excluido') {
        const { data: v } = await supabase
          .from('veiculos')
          .select('id, status, fotos, videos, video_url, fotos_criativo')
          .eq('id', item.veiculo_id)
          .maybeSingle()
        veiculo = v
        // Reconfere no dia: se voltou ao estoque, não limpa.
        if (v && !['vendido', 'devolvido'].includes(v.status)) {
          resumo.cancelados++
          if (real) {
            await supabase
              .from('r2_limpeza_fila')
              .update({
                status: 'cancelado',
                atualizado_em: agora.toISOString(),
                resultado: { cancelado_porque: `status atual ${v.status}` },
              })
              .eq('id', item.id)
          } else {
            await supabase
              .from('r2_limpeza_fila')
              .update({
                resultado: {
                  ensaio: true,
                  em: agora.toISOString(),
                  cancelaria_porque: `status atual ${v.status}`,
                },
              })
              .eq('id', item.id)
          }
          continue
        }
        if (v) {
          const fotos: string[] = Array.isArray(v.fotos) ? v.fotos : []
          const videos: string[] = Array.isArray(v.videos) ? v.videos : []
          const criativo: string[] = Array.isArray(v.fotos_criativo) ? v.fotos_criativo : []
          capa = item.manter_capa ? fotos[0] || null : null
          urls = [...fotos, ...videos, ...criativo, ...(v.video_url ? [v.video_url] : [])]
        }
      }

      const alvo = [...new Set(urls)].filter((u) => u && u !== capa)
      const apagar: string[] = []
      const protegidas: { url: string; motivo: string }[] = []
      for (const u of alvo) {
        const m = motivoProtecao(u, item.veiculo_id, refsPorUrl.get(u) || [])
        if (m) protegidas.push({ url: u, motivo: m })
        else apagar.push(u)
      }
      resumo.protegidas += protegidas.length

      if (!real) {
        resumo.apagaria += apagar.length
        await supabase
          .from('r2_limpeza_fila')
          .update({
            resultado: {
              ensaio: true,
              em: agora.toISOString(),
              manteria_capa: capa,
              apagaria: apagar,
              protegidas,
            },
          })
          .eq('id', item.id)
        continue
      }

      const apagadas: string[] = []
      const falhas: { url: string; erro: string }[] = []
      for (const u of apagar) {
        const chave = chaveDaUrl(u)!
        try {
          await s3.send(
            new CopyObjectCommand({
              Bucket: bucket,
              CopySource: `${bucket}/${chave.split('/').map(encodeURIComponent).join('/')}`,
              Key: `lixeira/${dia}/${chave}`,
            }),
          )
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: chave }))
          apagadas.push(u)
        } catch (e: any) {
          // Arquivo que já não existe no R2 conta como limpo (nada a apagar).
          if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) apagadas.push(u)
          else falhas.push({ url: u, erro: String(e?.message || e).slice(0, 200) })
        }
      }
      resumo.apagados += apagadas.length
      resumo.falhas += falhas.length

      // O banco passa a apontar só para o que ficou (capa + protegidas), nunca para arquivo apagado.
      if (veiculo && apagadas.length) {
        const fora = new Set(apagadas)
        const filtra = (arr: any) =>
          Array.isArray(arr) ? arr.filter((u: string) => !fora.has(u)) : arr
        await atualizarFotosSemMexerNoML(supabase, item.veiculo_id, {
          fotos: filtra(veiculo.fotos),
          videos: filtra(veiculo.videos),
          fotos_criativo: filtra(veiculo.fotos_criativo),
          video_url: veiculo.video_url && fora.has(veiculo.video_url) ? null : veiculo.video_url,
        })
      }
      if (apagadas.length) {
        await supabase.from('veiculo_fotos_ia').delete().in('url', apagadas)
        await supabase.from('media_assets').delete().in('file_path', apagadas)
      }

      await supabase
        .from('r2_limpeza_fila')
        .update({
          status: falhas.length ? 'erro' : 'concluido',
          executado_em: agora.toISOString(),
          atualizado_em: agora.toISOString(),
          resultado: {
            manteve_capa: capa,
            apagadas,
            protegidas,
            falhas,
            lixeira: `lixeira/${dia}/`,
          },
        })
        .eq('id', item.id)
    }

    await supabase.from('r2_limpeza_execucoes').insert({ modo: real ? 'real' : 'ensaio', resumo })
    return json({ success: true, modo: real ? 'real' : 'ensaio', resumo })
  } catch (err: any) {
    console.error('r2-limpeza:', err)
    await supabase.from('r2_limpeza_execucoes').insert({
      modo: corpo?.modo === 'inventario' ? 'inventario' : real ? 'real' : 'ensaio',
      erro: String(err?.message || err).slice(0, 500),
    })
    return json({ success: false, error: err.message }, 500)
  }
})

// Mudar fotos de carro vendido/devolvido aciona o gatilho do Mercado Livre (trigger_ml_sync_veiculos), que
// marca o anúncio para fechar de novo (pending_close). Aqui só arrumamos a ficha: devolve o status anterior.
async function atualizarFotosSemMexerNoML(
  supabase: any,
  veiculoId: string,
  campos: Record<string, any>,
) {
  const { data: antes } = await supabase
    .from('ml_listings')
    .select('id, status')
    .eq('veiculo_id', veiculoId)
  await supabase.from('veiculos').update(campos).eq('id', veiculoId)
  for (const l of antes || []) {
    await supabase
      .from('ml_listings')
      .update({ status: l.status })
      .eq('id', l.id)
      .eq('status', 'pending_close')
      .neq('status', l.status)
  }
}

// Capas de volta (27/11/2026, autorizado pela Adriana). O gatilho antigo clear_fotos_on_status_change
// apagava a lista de fotos ao vender/devolver; os arquivos foram para lixeira/<dia>/ na limpeza do lixo
// antigo. Para cada vendido/devolvido SEM fotos na ficha, procura na lixeira a foto que o nome indica ser
// a capa ("capa" no nome, ou "01_"/"1-" no começo), copia de volta ao lugar original (a cópia da lixeira
// fica) e grava só ela na ficha. Sem capa identificável pelo nome = não mexe.
async function restaurarCapas(supabase: any, real: boolean, dia: string) {
  const s3 = getR2Client()
  const bucket = getR2Bucket()
  const prefixoLixeira = `lixeira/${dia}/`

  const porPlaca = new Map<string, string[]>()
  let token: string | undefined
  do {
    const r = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefixoLixeira,
        ContinuationToken: token,
      }),
    )
    for (const o of r.Contents || []) {
      if (!o.Key || o.Key.endsWith('/')) continue
      const original = o.Key.slice(prefixoLixeira.length)
      const placa = placaDaPasta(original)
      if (!placa) continue
      const k = chavePlaca(placa)
      const lista = porPlaca.get(k) || []
      lista.push(original)
      porPlaca.set(k, lista)
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)

  const { data: veiculos, error } = await supabase
    .from('veiculos')
    .select('id, placa, status, fotos')
    .in('status', ['vendido', 'devolvido'])
  if (error) throw new Error(`veiculos: ${error.message}`)

  const nomeArquivo = (k: string) => k.split('/').pop() || ''
  const ehCapa = (k: string) => /capa/i.test(nomeArquivo(k))
  const ehPrimeira = (k: string) => /^0?1[_\-. ]/.test(nomeArquivo(k))

  const restauradas: { placa: string; capa: string }[] = []
  const sem_capa: { placa: string; motivo: string }[] = []
  const falhas: { placa: string; erro: string }[] = []
  for (const v of veiculos || []) {
    if (Array.isArray(v.fotos) && v.fotos.length > 0) continue
    const placa = chavePlaca((v.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, ''))
    const arquivos = (porPlaca.get(placa) || []).sort()
    if (!arquivos.length) {
      sem_capa.push({ placa: v.placa, motivo: 'nenhum arquivo dele na lixeira' })
      continue
    }
    const capa = arquivos.find(ehCapa) || arquivos.find(ehPrimeira)
    if (!capa) {
      sem_capa.push({
        placa: v.placa,
        motivo: `${arquivos.length} arquivo(s), nenhum com nome de capa`,
      })
      continue
    }
    if (!real) {
      restauradas.push({ placa: v.placa, capa })
      continue
    }
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${(prefixoLixeira + capa).split('/').map(encodeURIComponent).join('/')}`,
          Key: capa,
        }),
      )
      const url = BASE + capa.split('/').map(encodeURIComponent).join('/')
      await atualizarFotosSemMexerNoML(supabase, v.id, { fotos: [url] })
      restauradas.push({ placa: v.placa, capa })
    } catch (e: any) {
      falhas.push({ placa: v.placa, erro: String(e?.message || e).slice(0, 200) })
    }
  }

  const resumo = {
    tipo: 'restaurar_capas',
    lixeira: prefixoLixeira,
    [real ? 'restauradas' : 'restauraria']: restauradas,
    sem_capa,
    falhas,
  }
  await supabase.from('r2_limpeza_execucoes').insert({ modo: real ? 'real' : 'ensaio', resumo })
  return { success: true, modo: real ? 'real' : 'ensaio', resumo }
}

// Lixo antigo (27/11/2026, decisão da Adriana: opção "a"). Arquivos que NENHUMA linha do banco usa, só em
// pastas de veículo vendido, devolvido ou excluído (placa sem cadastro). Pastas de carro disponível,
// rascunho, em preparação ou sem placa ficam de fora. Mesma trava dupla e mesma lixeira da fila.
const PLACA = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
// Placa antiga (ABC1234) e Mercosul (ABC1C34) do mesmo carro viram a mesma chave: o 5º caractere
// letra A–J corresponde ao dígito 0–9. Evita tratar como "excluído" carro cadastrado com a outra forma.
const chavePlaca = (p: string) =>
  p.length === 7 && /[A-J]/.test(p[4]) ? p.slice(0, 4) + (p.charCodeAt(4) - 65) + p.slice(5) : p
function placaDaPasta(chave: string): string | null {
  const pasta = chave.split('/')[1] || ''
  if (chave.split('/').length < 3) return null // arquivo solto na raiz da pasta, sem pasta de veículo
  for (const parte of pasta.toUpperCase().split(/[_\-\s]+/)) if (PLACA.test(parte)) return parte
  return null
}

async function limparOrfaos(
  supabase: any,
  refsPorUrl: Map<string, Ref[]>,
  real: boolean,
  limite: number,
) {
  const s3 = getR2Client()
  const bucket = getR2Bucket()
  const usadas = new Set<string>()
  for (const url of refsPorUrl.keys()) {
    const chave = chaveDaUrl(url)
    if (chave) usadas.add(chave)
  }
  const { data: veiculos, error } = await supabase.from('veiculos').select('placa, status')
  if (error) throw new Error(`veiculos: ${error.message}`)
  const statusPorPlaca = new Map<string, string>()
  for (const v of veiculos || []) {
    const p = (v.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (p) statusPorPlaca.set(chavePlaca(p), v.status)
  }

  const candidatos: { chave: string; bytes: number; situacao: string }[] = []
  for (const prefixo of PREFIXOS_PERMITIDOS) {
    let token: string | undefined
    do {
      const r = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefixo, ContinuationToken: token }),
      )
      for (const o of r.Contents || []) {
        if (!o.Key || o.Key.endsWith('/') || usadas.has(o.Key)) continue
        const placa = placaDaPasta(o.Key)
        if (!placa) continue
        const status = statusPorPlaca.get(chavePlaca(placa))
        const situacao = status ?? 'excluido'
        if (!['vendido', 'devolvido', 'excluido'].includes(situacao)) continue
        candidatos.push({ chave: o.Key, bytes: o.Size || 0, situacao })
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined
    } while (token)
  }

  const mb = (b: number) => Math.round((b / 1024 / 1024) * 10) / 10
  const bytesPorSituacao: Record<string, { arquivos: number; bytes: number }> = {}
  for (const c of candidatos) {
    const s = (bytesPorSituacao[c.situacao] ||= { arquivos: 0, bytes: 0 })
    s.arquivos++
    s.bytes += c.bytes
  }
  const porSituacao = Object.fromEntries(
    Object.entries(bytesPorSituacao).map(([k, v]) => [
      k,
      { arquivos: v.arquivos, mb: mb(v.bytes) },
    ]),
  )

  const lote = candidatos.slice(0, limite)
  const dia = new Date().toISOString().slice(0, 10)
  let movidos = 0
  const falhas: { chave: string; erro: string }[] = []
  if (real) {
    for (const c of lote) {
      try {
        await s3.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `${bucket}/${c.chave.split('/').map(encodeURIComponent).join('/')}`,
            Key: `lixeira/${dia}/${c.chave}`,
          }),
        )
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: c.chave }))
        movidos++
      } catch (e: any) {
        falhas.push({ chave: c.chave, erro: String(e?.message || e).slice(0, 200) })
      }
    }
  }

  const resumo = {
    tipo: 'orfaos',
    candidatos: candidatos.length,
    mb_candidatos: mb(candidatos.reduce((s, c) => s + c.bytes, 0)),
    por_situacao: porSituacao,
    ...(real
      ? { movidos, falhas, restantes: candidatos.length - movidos, lixeira: `lixeira/${dia}/` }
      : { moveria_neste_lote: lote.length, exemplos: lote.slice(0, 10).map((c) => c.chave) }),
  }
  await supabase.from('r2_limpeza_execucoes').insert({ modo: real ? 'real' : 'ensaio', resumo })
  return { success: true, modo: real ? 'real' : 'ensaio', resumo }
}

// Relatório do lixo que já existe: arquivos nas pastas de veículo que nenhuma linha do banco usa.
async function inventario(supabase: any, refsPorUrl: Map<string, Ref[]>) {
  const s3 = getR2Client()
  const bucket = getR2Bucket()
  const usadas = new Set<string>()
  for (const url of refsPorUrl.keys()) {
    const chave = chaveDaUrl(url)
    if (chave) usadas.add(chave)
  }

  let total = 0
  let bytesTotal = 0
  let orfaos = 0
  let bytesOrfaos = 0
  const porPasta = new Map<string, { arquivos: number; bytes: number }>()
  for (const prefixo of PREFIXOS_PERMITIDOS) {
    let token: string | undefined
    do {
      const r = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefixo, ContinuationToken: token }),
      )
      for (const o of r.Contents || []) {
        if (!o.Key || o.Key.endsWith('/')) continue
        total++
        bytesTotal += o.Size || 0
        if (usadas.has(o.Key)) continue
        orfaos++
        bytesOrfaos += o.Size || 0
        const partes = o.Key.split('/')
        const pasta = partes.length > 2 ? `${partes[0]}/${partes[1]}/` : `${partes[0]}/ (soltos)`
        const p = porPasta.get(pasta) || { arquivos: 0, bytes: 0 }
        p.arquivos++
        p.bytes += o.Size || 0
        porPasta.set(pasta, p)
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined
    } while (token)
  }

  const mb = (b: number) => Math.round((b / 1024 / 1024) * 10) / 10
  const resumo = {
    arquivos_nas_pastas_de_veiculo: total,
    mb_total: mb(bytesTotal),
    sem_uso_no_banco: orfaos,
    mb_sem_uso: mb(bytesOrfaos),
    pastas: [...porPasta.entries()]
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .slice(0, 300)
      .map(([pasta, p]) => ({ pasta, arquivos: p.arquivos, mb: mb(p.bytes) })),
  }
  await supabase.from('r2_limpeza_execucoes').insert({ modo: 'inventario', resumo })
  return { success: true, modo: 'inventario', resumo }
}
