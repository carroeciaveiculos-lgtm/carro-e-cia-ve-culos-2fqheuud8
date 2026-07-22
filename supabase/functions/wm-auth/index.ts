import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    const { action } = await req.json().catch(() => ({ action: 'get_token' }))

    const WM_CLIENT_ID = Deno.env.get('WM_CLIENT_ID')!
    const WM_CLIENT_SECRET = Deno.env.get('WM_CLIENT_SECRET')!
    const WM_EMAIL = Deno.env.get('WM_EMAIL')!
    const WM_SENHA = Deno.env.get('WM_SENHA')!

    // Buscar plataforma Webmotors
    const { data: plataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .single()

    if (!plataforma) {
      return new Response(JSON.stringify({ erro: 'Plataforma Webmotors não encontrada' }), {
        status: 400,
      })
    }

    // Buscar credenciais salvas
    const { data: integracao } = await supabase
      .from('integracao_plataforma')
      .select('credentials')
      .eq('plataforma_id', plataforma.id)
      .single()

    // Se já tem token válido, retornar
    if (
      integracao?.credentials?.access_token &&
      new Date(integracao.credentials.expires_at) > new Date()
    ) {
      return new Response(
        JSON.stringify({
          access_token: integracao.credentials.access_token,
        }),
        { status: 200 },
      )
    }

    // Gerar Basic Auth (Client ID:Client Secret em Base64)
    const basicAuth = btoa(`${WM_CLIENT_ID}:${WM_CLIENT_SECRET}`)

    // Chamar OAuth da Webmotors
    const response = await fetch('https://api-webmotors.sensedia.com/oauth/v1/access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        username: WM_EMAIL,
        password: WM_SENHA,
        grant_type: 'password',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Falha na autenticação')
    }

    // Salvar token no banco
    await supabase.from('integracao_plataforma').upsert({
      plataforma_id: plataforma.id,
      status: 'conectado',
      credentials: {
        access_token: data.access_token,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        token_type: data.token_type || 'bearer',
      },
      ultima_sincronizacao: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        message: 'Token obtido com sucesso',
      }),
      { status: 200 },
    )
  } catch (error) {
    console.error('[wm-auth] Erro:', error)

    return new Response(
      JSON.stringify({
        erro: 'Falha na autenticação',
        detalhe: error.message,
      }),
      { status: 500 },
    )
  }
})
