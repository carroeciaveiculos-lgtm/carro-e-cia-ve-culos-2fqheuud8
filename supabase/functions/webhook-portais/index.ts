import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Extract portal name from url or header
    const url = new URL(req.url)
    const portal = url.searchParams.get('portal') || 'Desconhecido'

    // Authentication for Google Meu Negocio
    if (portal === 'GoogleMeuNegocio') {
      const authHeader = req.headers.get('authorization')
      const apiKeyHeader = req.headers.get('x-api-key')
      const expectedKey = 'GMN_LEAD_CARROCIA_BF939'

      const hasValidToken =
        authHeader === `Bearer ${expectedKey}` ||
        authHeader === expectedKey ||
        apiKeyHeader === expectedKey ||
        url.searchParams.get('key') === expectedKey

      if (!hasValidToken) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Invalid or missing Webhook Key.' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    const body = await req.json()

    // Map fields robustly
    const nome = body.name || body.displayName || body.cliente || 'Lead Portal'
    const telefone = body.phoneNumber || body.phone || body.telefone || ''
    const email = body.email || ''
    const observacoes = JSON.stringify(body, null, 2)

    const { error } = await supabase.from('leads').insert({
      nome,
      telefone,
      email,
      origem: `Portal - ${portal}`,
      tipo: 'comprador',
      status: 'novo',
      temperatura: 'morno',
      observacoes,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
