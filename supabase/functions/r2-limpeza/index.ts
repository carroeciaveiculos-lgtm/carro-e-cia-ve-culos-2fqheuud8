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
        await supabase
          .from('veiculos')
          .update({
            fotos: filtra(veiculo.fotos),
            videos: filtra(veiculo.videos),
            fotos_criativo: filtra(veiculo.fotos_criativo),
            video_url: veiculo.video_url && fora.has(veiculo.video_url) ? null : veiculo.video_url,
          })
          .eq('id', item.veiculo_id)
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
    await supabase
      .from('r2_limpeza_execucoes')
      .insert({
        modo: corpo?.modo === 'inventario' ? 'inventario' : real ? 'real' : 'ensaio',
        erro: String(err?.message || err).slice(0, 500),
      })
    return json({ success: false, error: err.message }, 500)
  }
})

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
