import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidNapistaToken } from '../_shared/napista-client.ts'

// Trocado pra produção em 18/08/2026 — NaPista liberou o client_id
// "carro-e-cia" em produção (confirmado por e-mail à Adriana). Credenciais
// antigas em napista_credentials eram do realm de desenvolvimento e não
// valem aqui — precisa reautenticar do zero (novo auth_url).
const AUTH_URL =
  Deno.env.get('NAPISTA_AUTH_URL') ||
  'https://auth.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/auth'
const TOKEN_URL =
  Deno.env.get('NAPISTA_TOKEN_URL') ||
  'https://auth.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/token'
const SELLERS_URL = 'https://api.napista.com.br/seller-inventory-api/seller/access'

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
      const { token, error: tokenError } = await getValidNapistaToken(supabase)

      await supabase.from('logs_integracao').insert({
        portal: 'napista_auth',
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

    const clientId = Deno.env.get('NAPISTA_ID')!
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/napista-auth`

    if (!code) {
      const authUrl = `${AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      await supabase.from('logs_integracao').insert({
        portal: 'napista_auth',
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

    // Busca o sellerId da(s) loja(s) que esse login tem acesso — obrigatório
    // pra todas as chamadas de estoque (ver docs/integracao-napista.md).
    const sellersRes = await fetch(SELLERS_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!sellersRes.ok) {
      const errText = await sellersRes.text()
      await supabase.from('logs_integracao').insert({
        portal: 'napista_auth',
        status: 'error',
        payload_erro: { error: 'Failed to fetch NaPista sellers', details: errText },
      })
      return new Response(JSON.stringify({ error: 'Failed to fetch NaPista sellers', details: errText }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sellersData = await sellersRes.json()
    const sellerId = sellersData?.sellers?.[0]?.sellerId ?? null

    await supabase.from('napista_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    await supabase.from('napista_credentials').insert({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      seller_id: sellerId,
      updated_at: new Date().toISOString(),
    })

    await supabase.from('logs_integracao').insert({
      portal: 'napista_auth',
      status: 'success',
      payload_erro: { action: 'oauth_exchange', expires_at: expiresAt, seller_id: sellerId, sellers: sellersData?.sellers },
    })

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
      <h2 style="color:#2E7D32">✅ NaPista conectado com sucesso!</h2>
      <p>${sellerId ? `Loja identificada: ${sellerId}` : 'Nenhuma loja encontrada para este login — verifique com o suporte do NaPista.'}</p>
      <p>Você já pode fechar esta janela.</p>
      <script>setTimeout(()=>window.close(),4000)</script>
    </body></html>`

    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
  } catch (err: any) {
    await supabase.from('logs_integracao').insert({
      portal: 'napista_auth',
      status: 'error',
      payload_erro: { error: err.message, stage: 'general' },
    })
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
