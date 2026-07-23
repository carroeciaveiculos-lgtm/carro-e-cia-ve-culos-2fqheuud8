import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidMLToken, fetchWithBackoff } from '../_shared/ml-client.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { token, error: tokenError } = await getValidMLToken(supabase)
    if (tokenError || !token) {
      return new Response(
        JSON.stringify({ error: tokenError || 'No token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: activeListings, error: listingsError } = await supabase
      .from('ml_listings')
      .select('ml_item_id, veiculo_id')
      .eq('status', 'active')
      .not('ml_item_id', 'is', null)

    if (listingsError) throw listingsError
    if (!activeListings || activeListings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let processed = 0
    let lowScoreCount = 0

    for (const listing of activeListings) {
      if (!listing.ml_item_id) continue
      try {
        const perfRes = await fetchWithBackoff(
          `https://api.mercadolibre.com/items/${listing.ml_item_id}/performance`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (!perfRes.ok) continue
        const perfData = await perfRes.json()
        const score = typeof perfData.score === 'number' ? perfData.score : null
        const level = perfData.level || null
        if (score === null) continue

        await supabase.from('ml_quality_scores').insert({
          ml_item_id: listing.ml_item_id,
          score,
          level,
          veiculo_id: listing.veiculo_id,
          checked_at: new Date().toISOString(),
        })

        if (score < 70) {
          lowScoreCount++
          const { data: veiculo } = await supabase
            .from('veiculos')
            .select('marca, modelo')
            .eq('id', listing.veiculo_id)
            .maybeSingle()

          const veiculoNome = veiculo
            ? `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim()
            : 'Veículo'

          await supabase.from('notificacoes').insert({
            tipo: 'qualidade_baixa',
            titulo: 'Qualidade do anúncio baixa no Mercado Livre',
            mensagem: `O anúncio "${veiculoNome}" no ML obteve score ${score}/100. ` +
              `Acesse: /admin/estoque para revisar. Item ML: ${listing.ml_item_id}`,
          })

          await supabase
            .from('veiculos')
            .update({ requires_review: true })
            .eq('id', listing.veiculo_id)
        }

        processed++
      } catch {
        // Continue to next listing on error
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, lowScoreCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
