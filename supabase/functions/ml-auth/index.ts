import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidMLToken } from '../_shared/ml-client.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const code = url.searchParams.get('code') || body?.code

    if (body?.action === 'refresh_check') {
      const { token, error: tokenError } = await getValidMLToken(supabase)

      await supabase.from('logs_integracao').insert({
        portal: 'mercadolivre_auth',
        status: tokenError ? 'error' : 'success',
        payload_erro: tokenError
          ? { error: tokenError, action: 'refresh_check' }
          : { action: 'refresh_check', message: 'Token valid or refreshed' },
      })

      return new Response(
        JSON.stringify({ success: !tokenError, token_valid: !!token, error: tokenError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!code) {
      const clientId = Deno.env.get('ML_CLIENT_ID')!
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ml-auth`
      const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const clientId = Deno.env.get('ML_CLIENT_ID')!
    const clientSecret = Deno.env.get('ML_CLIENT_SECRET')!
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ml-auth`

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      await supabase.from('logs_integracao').insert({
        portal: 'mercadolivre_auth',
        status: 'error',
        payload_erro: {
          error: 'OAuth token exchange failed',
          details: errText,
          status_code: tokenRes.status,
        },
      })
      return new Response(
        JSON.stringify({ error: 'OAuth token exchange failed', details: errText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const tokenData = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    await supabase.from('ml_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    await supabase.from('ml_credentials').insert({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })

    await supabase.from('logs_integracao').insert({
      portal: 'mercadolivre_auth',
      status: 'success',
      payload_erro: { action: 'oauth_exchange', expires_at: expiresAt },
    })

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
      <h2 style="color:#2E7D32">✅ Mercado Livre conectado com sucesso!</h2>
      <p>Você já pode fechar esta janela. A sincronização de estoque está ativa.</p>
      <script>setTimeout(()=>window.close(),3000)</script>
    </body></html>`

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (err: any) {
    await supabase.from('logs_integracao').insert({
      portal: 'mercadolivre_auth',
      status: 'error',
      payload_erro: { error: err.message, stage: 'general' },
    })
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
