import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  buildAuthXML,
  buildIncluirCarroXML,
  buildAlterarCarroXML,
  buildExcluirCarroXML,
  callSOAP,
  type WMCredentials,
  type MapeamentoWM,
} from '../_shared/wm-soap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// O hash de autenticação aparece no XML enviado; nunca persistir sem mascarar.
function mascararHash(xml: string): string {
  return xml.replace(/(<pHashAutenticacao>)[^<]*(<\/pHashAutenticacao>)/gi, '$1***$2')
}

// Guarda request + response no mapeamento do veículo. Sem isso a depuração vira
// adivinhação: até aqui só sobrava a resposta da Webmotors, e o que foi enviado
// tinha de ser inferido a partir do eco dela.
async function registrarTrocaXML(
  supabase: any,
  veiculoId: string,
  operacao: string,
  requestXml: string,
  responseXml: string | undefined,
) {
  await supabase
    .from('wm_mapeamento_veiculos')
    .update({
      ultima_resposta_xml: [
        `-- ${operacao} @ ${new Date().toISOString()}`,
        '-- REQUEST --',
        mascararHash(requestXml),
        '-- RESPONSE --',
        responseXml ?? '(sem resposta)',
      ].join('\n'),
    })
    .eq('veiculo_id', veiculoId)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const specificVeiculoId = body.veiculo_id

    const creds: WMCredentials = {
      email: Deno.env.get('WM_EMAIL') || '',
      senha: Deno.env.get('WM_SENHA') || '',
      cnpj: Deno.env.get('WM_CNPJ') || '',
    }

    if (!creds.email || !creds.senha) {
      return new Response(JSON.stringify({ error: 'WM credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authResult = await callSOAP(buildAuthXML(creds), 'autenticar')
    if (!authResult.success || !authResult.hashAutenticacao) {
      if (authResult.networkError) {
        return new Response(
          JSON.stringify({
            error: 'Unable to connect to Webmotors service. Please try again later.',
            details: authResult.error,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({
          error: 'WM authentication failed',
          details: authResult.error,
          codigoRetorno: authResult.codigoRetorno,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const hash = authResult.hashAutenticacao

    const { data: integracao } = await supabase
      .from('integracao_plataforma')
      .select('id')
      .eq('status', 'conectado')
      .limit(1)
      .maybeSingle()

    if (integracao) {
      await supabase
        .from('integracao_plataforma')
        .update({
          credentials: { hashAutenticacao: hash },
          ultima_sincronizacao: new Date().toISOString(),
        })
        .eq('id', integracao.id)
    }

    const { data: wmPlataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .maybeSingle()

    let pubQuery = supabase
      .from('estoque_publicacoes')
      .select('id, veiculo_id, platform, status, post_id')
      .eq('platform', 'webmotors')
      .in('status', ['agendado', 'pending_create', 'pending_update', 'pending_close'])

    if (specificVeiculoId) {
      pubQuery = pubQuery.eq('veiculo_id', specificVeiculoId)
    }

    const { data: pendingPubs } = await pubQuery.limit(50)
    if (!pendingPubs || pendingPubs.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any[] = []
    for (const pub of pendingPubs) {
      const { data: veiculo } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', pub.veiculo_id)
        .maybeSingle()

      if (!veiculo) {
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: 'Vehicle not found' })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: 'Vehicle not found' })
        continue
      }

      const { data: mapeamento } = await supabase
        .from('wm_mapeamento_veiculos')
        .select('*')
        .eq('veiculo_id', veiculo.id)
        .maybeSingle()

      if (!mapeamento || mapeamento.status_sincronizacao !== 'mapeado') {
        const msg =
          'Veículo sem mapeamento de catálogo Webmotors confirmado (marca/modelo/versão/cor/câmbio/combustível). Publicação bloqueada até mapear.'
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: msg })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: msg })
        continue
      }

      const [{ data: corRow }, { data: cambioRow }, { data: combustivelRow }] = await Promise.all([
        supabase
          .from('wm_cores')
          .select('nome_wm')
          .eq('codigo_wm', mapeamento.codigo_cor_wm)
          .maybeSingle(),
        supabase
          .from('wm_cambios')
          .select('nome_wm')
          .eq('codigo_wm', mapeamento.codigo_cambio_wm)
          .maybeSingle(),
        supabase
          .from('wm_combustiveis')
          .select('nome_wm')
          .eq('codigo_wm', mapeamento.codigo_combustivel_wm)
          .maybeSingle(),
      ])

      const mapa: MapeamentoWM = {
        codigo_marca_wm: mapeamento.codigo_marca_wm,
        codigo_modelo_wm: mapeamento.codigo_modelo_wm,
        codigo_versao_wm: mapeamento.codigo_versao_wm,
        codigo_cor_wm: mapeamento.codigo_cor_wm,
        codigo_combustivel_wm: mapeamento.codigo_combustivel_wm,
        codigo_cambio_wm: mapeamento.codigo_cambio_wm,
        codigo_modalidade_wm: mapeamento.codigo_modalidade_wm,
        descricao_cor: corRow?.nome_wm || veiculo.cor || '',
        descricao_cambio: cambioRow?.nome_wm || veiculo.cambio || '',
        descricao_combustivel: combustivelRow?.nome_wm || veiculo.combustivel || '',
      }

      // Guard corrigido em 07/08/2026: a validação original só checava as
      // DESCRIÇÕES (descricao_cor/descricao_cambio/descricao_combustivel), que
      // têm fallback pro texto livre do veículo e por isso quase sempre passam
      // mesmo com o CÓDIGO ausente. Os campos <Codigo*> enviados no XML não têm
      // fallback nenhum — se vierem null/undefined, o template literal manda a
      // string literal "null"/"undefined" pra Webmotors. É exatamente essa classe
      // de bug (CodigoRetorno 22|78 de 06/08/2026) que essa correção pretendia
      // fechar; o guard antigo não cobria os códigos, só o eco textual deles.
      const codigosFaltando = [
        !mapa.codigo_cor_wm && 'codigo_cor_wm',
        !mapa.codigo_cambio_wm && 'codigo_cambio_wm',
        !mapa.codigo_combustivel_wm && 'codigo_combustivel_wm',
        !mapa.codigo_modalidade_wm && 'codigo_modalidade_wm',
      ].filter(Boolean)

      if (codigosFaltando.length > 0) {
        const msg = `Código(s) de catálogo Webmotors ausente(s) em wm_mapeamento_veiculos: ${codigosFaltando.join(', ')}. Publicação bloqueada — enviar esses campos vazios faria a Webmotors receber "null"/"undefined" no XML. Complete o mapeamento antes de publicar.`
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: msg })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: msg })
        continue
      }

      try {
        if (pub.status === 'pending_create' || pub.status === 'agendado') {
          const xml = buildIncluirCarroXML(veiculo, hash, mapa)
          const res = await callSOAP(xml, 'IncluirCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'IncluirCarro', xml, res.raw)
          if (res.success && res.codigoAnuncio) {
            await supabase
              .from('estoque_publicacoes')
              .update({
                status: 'publicado',
                post_id: res.codigoAnuncio,
                publicado_em: new Date().toISOString(),
                erro_msg: null,
              })
              .eq('id', pub.id)
            await supabase
              .from('veiculos')
              .update({ publicado_webmotors: true })
              .eq('id', veiculo.id)
            await supabase
              .from('wm_mapeamento_veiculos')
              .update({ codigo_anuncio_wm: res.codigoAnuncio })
              .eq('veiculo_id', veiculo.id)
            results.push({ id: pub.id, status: 'created', codigoAnuncio: res.codigoAnuncio })
          } else {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'error', erro_msg: res.error })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        } else if (pub.status === 'pending_update' && pub.post_id) {
          const xml = buildAlterarCarroXML(veiculo, hash, mapa, pub.post_id)
          const res = await callSOAP(xml, 'AlterarCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'AlterarCarro', xml, res.raw)
          if (res.success) {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'publicado', erro_msg: null })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'updated' })
          } else {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'error', erro_msg: res.error })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        } else if (pub.status === 'pending_close' && pub.post_id) {
          const xml = buildExcluirCarroXML(hash, pub.post_id)
          const res = await callSOAP(xml, 'ExcluirCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'ExcluirCarro', xml, res.raw)
          if (res.success) {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'despublicado' })
              .eq('id', pub.id)
            await supabase
              .from('veiculos')
              .update({ publicado_webmotors: false })
              .eq('id', veiculo.id)
            results.push({ id: pub.id, status: 'closed' })
          } else {
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        }
      } catch (err: any) {
        results.push({ id: pub.id, status: 'error', error: err.message })
      }
    }

    if (wmPlataforma) {
      const logs = results.map((r) => ({
        plataforma_id: wmPlataforma.id,
        veiculo_id: pendingPubs.find((p) => p.id === r.id)?.veiculo_id,
        acao:
          r.status === 'created'
            ? 'create'
            : r.status === 'updated'
              ? 'update'
              : r.status === 'closed'
                ? 'close'
                : 'error',
        status: r.status === 'error' ? 'erro' : 'success',
        mensagem: r.error || `WM sync ${r.status}`,
        metadata: { codigoAnuncio: r.codigoAnuncio },
      }))
      if (logs.length > 0) await supabase.from('sync_log').insert(logs)
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
