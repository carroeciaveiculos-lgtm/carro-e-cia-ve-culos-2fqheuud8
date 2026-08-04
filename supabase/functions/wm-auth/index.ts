import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { buildAuthXML, callSOAP, type WMCredentials } from '../_shared/wm-soap.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({ action: 'get_hash' }))
    const action = body?.action || 'get_hash'

    const creds: WMCredentials = {
      email: Deno.env.get('WM_EMAIL') || '',
      senha: Deno.env.get('WM_SENHA') || '',
      cnpj: Deno.env.get('WM_CNPJ') || '',
    }

    if (!creds.email || !creds.senha || !creds.cnpj) {
      return new Response(JSON.stringify({ erro: 'Credenciais Webmotors não configuradas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: plataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .maybeSingle()

    if (!plataforma) {
      return new Response(JSON.stringify({ erro: 'Plataforma Webmotors não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'check_cached') {
      const { data: integracao } = await supabase
        .from('integracao_plataforma')
        .select('credentials, ultima_sincronizacao')
        .eq('plataforma_id', plataforma.id)
        .maybeSingle()

      const cachedHash = integracao?.credentials?.hashAutenticacao
      const cachedAt = integracao?.credentials?.hashGeneratedAt
      const isFresh =
        cachedHash && cachedAt && Date.now() - new Date(cachedAt).getTime() < 50 * 60 * 1000

      if (isFresh) {
        return new Response(JSON.stringify({ hashAutenticacao: cachedHash, cached: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const authResult = await callSOAP(buildAuthXML(creds), 'autenticar')

    if (!authResult.success || !authResult.hashAutenticacao) {
      if (authResult.networkError) {
        return new Response(
          JSON.stringify({
            erro: 'Unable to connect to Webmotors service. Please try again later.',
            detalhe: authResult.error,
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({ erro: 'Falha na autenticação Webmotors', detalhe: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const hash = authResult.hashAutenticacao
    const nowIso = new Date().toISOString()

    const { data: existing } = await supabase
      .from('integracao_plataforma')
      .select('id')
      .eq('plataforma_id', plataforma.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('integracao_plataforma')
        .update({
          status: 'conectado',
          credentials: { hashAutenticacao: hash, hashGeneratedAt: nowIso },
          ultima_sincronizacao: nowIso,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('integracao_plataforma').insert({
        plataforma_id: plataforma.id,
        usuario_id: '00000000-0000-0000-0000-000000000000',
        status: 'conectado',
        credentials: { hashAutenticacao: hash, hashGeneratedAt: nowIso },
        ultima_sincronizacao: nowIso,
      })
    }

    return new Response(
      JSON.stringify({
        hashAutenticacao: hash,
        message: 'Hash de autenticação obtido com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('[wm-auth] Erro:', err)
    return new Response(JSON.stringify({ erro: 'Falha na autenticação', detalhe: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
