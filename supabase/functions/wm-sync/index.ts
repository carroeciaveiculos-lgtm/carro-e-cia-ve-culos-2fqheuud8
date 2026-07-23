import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  buildAuthXML,
  buildIncluirCarroXML,
  buildAlterarCarroXML,
  buildExcluirCarroXML,
  callSOAP,
  type WMCredentials,
} from '../_shared/wm-soap.ts'

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
      clienteId: Deno.env.get('WM_CLIENT_ID') || '',
    }

    if (!creds.email || !creds.senha) {
      return new Response(JSON.stringify({ error: 'WM credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authResult = await callSOAP(buildAuthXML(creds), 'Autenticar')
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
        JSON.stringify({ error: 'WM authentication failed', details: authResult.error }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
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

      try {
        if (pub.status === 'pending_create' || pub.status === 'agendado') {
          const xml = buildIncluirCarroXML(veiculo, hash, veiculo.categoria || 'Carro')
          const res = await callSOAP(
            xml,
            veiculo.categoria === 'Moto' ? 'IncluirMoto' : 'IncluirCarro',
          )
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
            results.push({ id: pub.id, status: 'created', codigoAnuncio: res.codigoAnuncio })
          } else {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'error', erro_msg: res.error })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        } else if (pub.status === 'pending_update' && pub.post_id) {
          const xml = buildAlterarCarroXML(veiculo, hash, pub.post_id)
          const res = await callSOAP(xml, 'AlterarCarro')
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
          const res = await callSOAP(xml, 'ExcluirCarro')
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
