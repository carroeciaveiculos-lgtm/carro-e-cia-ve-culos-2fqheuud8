import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidMLToken, buildMLItemPayload } from '../_shared/ml-client.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { token, error: tokenError } = await getValidMLToken(supabase)
    if (tokenError || !token) {
      await supabase.from('logs_integracao').insert({
        portal: 'mercadolivre_sync',
        status: 'error',
        payload_erro: { error: tokenError || 'No token', stage: 'authentication' },
      })
      return new Response(JSON.stringify({ error: tokenError || 'No token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const specificVeiculoId = body.veiculo_id

    let pendingQuery = supabase
      .from('ml_listings')
      .select('id, veiculo_id, ml_item_id, status')
      .in('status', ['pending_create', 'pending_update', 'pending_close'])

    if (specificVeiculoId) {
      pendingQuery = pendingQuery.eq('veiculo_id', specificVeiculoId)
    }

    const { data: pendingListings, error: pendingError } = await pendingQuery.limit(50)

    if (pendingError) throw pendingError
    if (!pendingListings || pendingListings.length === 0) {
      await supabase.from('logs_integracao').insert({
        portal: 'mercadolivre_sync',
        status: 'success',
        payload_erro: { message: 'No pending listings to sync', processed: 0 },
      })
      return new Response(
        JSON.stringify({ success: true, message: 'No pending listings to sync', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const results: any[] = []

    for (const listing of pendingListings) {
      const { data: veiculo } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', listing.veiculo_id)
        .maybeSingle()

      if (!veiculo) {
        await supabase
          .from('ml_listings')
          .update({ status: 'error', last_synced_at: new Date().toISOString() })
          .eq('id', listing.id)
        results.push({ listing_id: listing.id, status: 'error', error: 'Vehicle not found' })
        continue
      }

      try {
        if (listing.status === 'pending_create') {
          const payload = buildMLItemPayload(veiculo)
          const mlRes = await fetch('https://api.mercadolibre.com/items', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          const mlData = await mlRes.json()

          if (mlRes.ok) {
            await supabase
              .from('ml_listings')
              .update({
                ml_item_id: mlData.id,
                ml_listing_url: mlData.permalink,
                status: 'active',
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', listing.id)

            await supabase
              .from('veiculos')
              .update({ publicado_mercadolivre: true })
              .eq('id', veiculo.id)
            results.push({ listing_id: listing.id, ml_item_id: mlData.id, status: 'created' })
          } else {
            await supabase
              .from('ml_listings')
              .update({ status: 'error', last_synced_at: new Date().toISOString() })
              .eq('id', listing.id)
            results.push({ listing_id: listing.id, status: 'error', error: JSON.stringify(mlData) })
          }
        } else if (listing.status === 'pending_update' && listing.ml_item_id) {
          const updateRes = await fetch(
            `https://api.mercadolibre.com/items/${listing.ml_item_id}`,
            {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ price: Number(veiculo.preco_venda) || 0 }),
            },
          )

          if (updateRes.ok) {
            await supabase
              .from('ml_listings')
              .update({ status: 'active', last_synced_at: new Date().toISOString() })
              .eq('id', listing.id)
            results.push({
              listing_id: listing.id,
              ml_item_id: listing.ml_item_id,
              status: 'updated',
            })
          } else {
            const errData = await updateRes.json()
            results.push({
              listing_id: listing.id,
              status: 'error',
              error: JSON.stringify(errData),
            })
          }
        } else if (listing.status === 'pending_close' && listing.ml_item_id) {
          const closeRes = await fetch(`https://api.mercadolibre.com/items/${listing.ml_item_id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed' }),
          })

          if (closeRes.ok) {
            await supabase
              .from('ml_listings')
              .update({ status: 'closed', last_synced_at: new Date().toISOString() })
              .eq('id', listing.id)
            await supabase
              .from('veiculos')
              .update({ publicado_mercadolivre: false })
              .eq('id', veiculo.id)
            results.push({
              listing_id: listing.id,
              ml_item_id: listing.ml_item_id,
              status: 'closed',
            })
          } else {
            const errData = await closeRes.json()
            results.push({
              listing_id: listing.id,
              status: 'error',
              error: JSON.stringify(errData),
            })
          }
        }
      } catch (err: any) {
        results.push({ listing_id: listing.id, status: 'error', error: err.message })
      }
    }

    const errorCount = results.filter((r) => r.status === 'error').length
    await supabase.from('logs_integracao').insert({
      portal: 'mercadolivre_sync',
      status: errorCount > 0 ? (errorCount === results.length ? 'error' : 'partial') : 'success',
      payload_erro: { processed: results.length, errors: errorCount, details: results },
    })

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    await supabase.from('logs_integracao').insert({
      portal: 'mercadolivre_sync',
      status: 'error',
      payload_erro: { error: err.message, stage: 'general' },
    })
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
