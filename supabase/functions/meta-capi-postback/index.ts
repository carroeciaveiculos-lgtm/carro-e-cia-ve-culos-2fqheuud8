import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { vehicle_id, marca, modelo, versao, ano_modelo, preco_venda, status, slug } = await req.json()

    if (!vehicle_id || status !== 'Vendido') {
      return new Response(
        JSON.stringify({ error: 'Invalid payload - vehicle_id and status=Vendido required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const pixelId = Deno.env.get('META_PIXEL_ID')
    const adsToken = Deno.env.get('META_ADS_TOKEN')

    if (!pixelId || !adsToken) {
      return new Response(
        JSON.stringify({ error: 'META_PIXEL_ID or META_ADS_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const vehicleName = `${marca || ''} ${modelo || ''} ${versao || ''} ${ano_modelo || ''}`.trim()
    const eventTime = Math.floor(Date.now() / 1000)
    const eventId = `${vehicle_id}-${eventTime}`

    const capiRes = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: eventTime,
          event_id: eventId,
          action_source: 'physical_store',
          event_source_url: `https://www.carroeciamotors.com.br/estoque/${slug || vehicle_id}`,
          custom_data: {
            currency: 'BRL',
            value: preco_venda || 0,
            content_name: vehicleName,
            content_type: 'vehicle',
            content_ids: [vehicle_id],
          },
        }],
        access_token: adsToken,
      }),
    })
    const capiData = await capiRes.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    if (supabaseUrl) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/ads-agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pause_sold_ads',
            platform: 'meta',
            params: { vehicle_id, marca, modelo },
          }),
        })
      } catch (e) {
        console.error('Failed to trigger ad pausing:', e)
      }
    }

    return new Response(
      JSON.stringify({ success: true, capi_response: capiData, event_id: eventId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('CAPI Postback error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
