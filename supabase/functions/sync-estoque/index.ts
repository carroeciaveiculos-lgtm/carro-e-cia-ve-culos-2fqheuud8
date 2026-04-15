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

    // 1. Load APIs configured
    const { data: configs } = await supabase.from('configuracoes_api').select('*').eq('ativo', true)

    // 2. Load stock
    const { data: veiculos } = await supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel')

    if (!configs || configs.length === 0 || !veiculos) {
      return new Response(JSON.stringify({ message: 'Nenhuma API ativa ou sem estoque.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Skeleton of Promise.allSettled
    const results = await Promise.allSettled(
      configs.map(async (config) => {
        // Here we would call the real portal APIs (Webmotors, iCarros, etc.)
        // Mock payload sending
        // throw new Error("Simulated API failure");
        return { portal: config.portal, status: 'success' }
      }),
    )

    // 4. Log failures
    const logsToInsert: any[] = []
    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        logsToInsert.push({
          portal: configs[idx].portal,
          payload_erro: { error: res.reason?.message || 'Unknown error' },
          status: 'falha',
        })
      }
    })

    if (logsToInsert.length > 0) {
      await supabase.from('logs_integracao').insert(logsToInsert)
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
