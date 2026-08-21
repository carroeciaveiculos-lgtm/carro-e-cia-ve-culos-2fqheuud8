import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Gera o link de autorização do LinkedIn (21/08/2026). Chamada pelo admin
// autenticado no painel — devolve a URL, quem redireciona o navegador é o
// front. O `state` é gravado na única linha de `linkedin_integracao` e
// conferido de volta em `linkedin-oauth-callback` (proteção CSRF simples,
// suficiente pro caso de uso: só um admin autoriza, de cada vez).
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!clientId || !supabaseUrl) {
      throw new Error('LINKEDIN_CLIENT_ID ou SUPABASE_URL ausente na configuração')
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: row, error: rowError } = await supabase
      .from('linkedin_integracao')
      .select('id')
      .limit(1)
      .single()
    if (rowError || !row) throw new Error('Linha de linkedin_integracao não encontrada')

    const state = crypto.randomUUID()
    await supabase.from('linkedin_integracao').update({ oauth_state: state }).eq('id', row.id)

    const redirectUri = `${supabaseUrl}/functions/v1/linkedin-oauth-callback`

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'w_organization_social')
    authUrl.searchParams.set('state', state)

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
