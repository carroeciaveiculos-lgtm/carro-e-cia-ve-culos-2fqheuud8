import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getValidMLToken,
  buildMLItemPayload,
  checkMLPackages,
  fetchCategoryAttributes,
  resolveListingType,
} from '../_shared/ml-client.ts'
import { validateImagesForML } from '../_shared/image-validation.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const logSync = (status: string, payload: any) =>
    supabase.from('logs_integracao').insert({ portal: 'mercadolivre_sync', status, payload_erro: payload })

  try {
    const { token, error: tokenError } = await getValidMLToken(supabase)
    if (tokenError || !token) {
      await logSync('error', { error: tokenError || 'No token', stage: 'authentication' })
      return new Response(JSON.stringify({ error: tokenError || 'No token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const specificVeiculoId = body.veiculo_id

    const { data: mlPlataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'mercadolivre')
      .maybeSingle()
    const mlPlataformaId = mlPlataforma?.id || null

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
      await logSync('success', { message: 'No pending listings', processed: 0 })
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any[] = []
    let cachedMandatoryAttrs: string[] | null = null

    for (const listing of pendingListings) {
      const { data: veiculo } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', listing.veiculo_id)
        .maybeSingle()

      if (!veiculo) {
        await supabase.from('ml_listings').update({ status: 'error', last_synced_at: new Date().toISOString() }).eq('id', listing.id)
        results.push({ listing_id: listing.id, status: 'error', error: 'Vehicle not found' })
        continue
      }

      try {
        if (listing.status === 'pending_create') {
          // Duplicate prevention: check for existing ML listing with ml_item_id
          const { data: existingML } = await supabase
            .from('ml_listings')
            .select('id, ml_item_id')
            .eq('veiculo_id', listing.veiculo_id)
            .not('ml_item_id', 'is', null)
            .maybeSingle()

          if (existingML?.ml_item_id) {
            // Auto-link: skip creation, mark as active
            await supabase.from('ml_listings').update({
              status: 'active',
              last_synced_at: new Date().toISOString(),
            }).eq('id', listing.id)
            await supabase.from('veiculos').update({ publicado_mercadolivre: true }).eq('id', veiculo.id)
            results.push({ listing_id: listing.id, ml_item_id: existingML.ml_item_id, status: 'linked' })
            continue
          }

          // Duplicate prevention: check same placa already published on ML
          if (veiculo.placa) {
            const { data: samePlaca } = await supabase
              .from('veiculos')
              .select('id')
              .eq('placa', veiculo.placa)
              .eq('publicado_mercadolivre', true)
              .neq('id', veiculo.id)
              .maybeSingle()

            if (samePlaca) {
              await supabase.from('ml_listings').update({
                status: 'error',
                last_synced_at: new Date().toISOString(),
              }).eq('id', listing.id)
              results.push({
                listing_id: listing.id,
                status: 'error',
                error: 'Duplicado: veículo com mesma placa já publicado no Mercado Livre',
              })
              continue
            }
          }

          // Also check estoque_publicacoes for existing listing
          const { data: existingPub } = await supabase
            .from('estoque_publicacoes')
            .select('id, post_id')
            .eq('veiculo_id', listing.veiculo_id)
            .eq('platform', 'mercadolivre')
            .not('post_id', 'is', null)
            .maybeSingle()

          if (existingPub?.post_id) {
            // Auto-link using existing publication
            await supabase.from('ml_listings').update({
              ml_item_id: existingPub.post_id,
              status: 'active',
              last_synced_at: new Date().toISOString(),
            }).eq('id', listing.id)
            await supabase.from('veiculos').update({ publicado_mercadolivre: true }).eq('id', veiculo.id)
            results.push({ listing_id: listing.id, ml_item_id: existingPub.post_id, status: 'linked' })
            continue
          }

          const errorMsg = await handleCreate(supabase, token, listing, veiculo, cachedMandatoryAttrs, mlPlataformaId)
          if (errorMsg.cachedAttrs) cachedMandatoryAttrs = errorMsg.cachedAttrs
          if (errorMsg.error) {
            await supabase.from('ml_listings').update({ status: 'error', last_synced_at: new Date().toISOString() }).eq('id', listing.id)
            results.push({ listing_id: listing.id, status: 'error', error: errorMsg.error })
          } else {
            await supabase.from('veiculos').update({ publicado_mercadolivre: true }).eq('id', veiculo.id)
            results.push({ listing_id: listing.id, ml_item_id: errorMsg.mlItemId, status: 'created' })
          }
        } else if (listing.status === 'pending_update' && listing.ml_item_id) {
          const updateRes = await fetch(`https://api.mercadolibre.com/items/${listing.ml_item_id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: Number(veiculo.preco_venda) || 0 }),
          })
          if (updateRes.ok) {
            await supabase.from('ml_listings').update({ status: 'active', last_synced_at: new Date().toISOString() }).eq('id', listing.id)
            results.push({ listing_id: listing.id, ml_item_id: listing.ml_item_id, status: 'updated' })
          } else {
            const errData = await updateRes.json()
            await supabase.from('ml_listings').update({ status: 'error', last_synced_at: new Date().toISOString() }).eq('id', listing.id)
            results.push({ listing_id: listing.id, status: 'error', error: JSON.stringify(errData) })
          }
        } else if (listing.status === 'pending_close' && listing.ml_item_id) {
          const closeRes = await fetch(`https://api.mercadolibre.com/items/${listing.ml_item_id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed' }),
          })
          if (closeRes.ok) {
            await supabase.from('ml_listings').update({ status: 'closed', last_synced_at: new Date().toISOString() }).eq('id', listing.id)
            await supabase.from('veiculos').update({ publicado_mercadolivre: false }).eq('id', veiculo.id)
            results.push({ listing_id: listing.id, ml_item_id: listing.ml_item_id, status: 'closed' })
          } else {
            const errData = await closeRes.json()
            results.push({ listing_id: listing.id, status: 'error', error: JSON.stringify(errData) })
          }
        }
      } catch (err: any) {
        await supabase.from('ml_listings').update({ status: 'error', last_synced_at: new Date().toISOString() }).eq('id', listing.id)
        results.push({ listing_id: listing.id, status: 'error', error: err.message })
      }
    }

    if (mlPlataformaId && pendingListings.length > 0) {
      const successVeiculoIds = results
        .filter((r) => r.status === 'created' || r.status === 'updated' || r.status === 'closed')
        .map((r) => pendingListings.find((l) => l.id === r.listing_id)?.veiculo_id)
        .filter(Boolean) as string[]
      const errorVeiculoIds = results
        .filter((r) => r.status === 'error')
        .map((r) => pendingListings.find((l) => l.id === r.listing_id)?.veiculo_id)
        .filter(Boolean) as string[]

      if (successVeiculoIds.length > 0) {
        await supabase
          .from('sync_log')
          .update({ status: 'success', mensagem: 'Sincronizacao processada via ml-sync' })
          .eq('plataforma_id', mlPlataformaId)
          .in('veiculo_id', successVeiculoIds)
          .eq('status', 'pending')
      }
      if (errorVeiculoIds.length > 0) {
        await supabase
          .from('sync_log')
          .update({ status: 'erro', mensagem: 'Erro na sincronizacao via ml-sync' })
          .eq('plataforma_id', mlPlataformaId)
          .in('veiculo_id', errorVeiculoIds)
          .eq('status', 'pending')
      }
    }

    const errorCount = results.filter((r) => r.status === 'error').length
    await logSync(errorCount > 0 ? (errorCount === results.length ? 'error' : 'partial') : 'success', {
      processed: results.length,
      errors: errorCount,
      details: results,
    })

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    await logSync('error', { error: err.message, stage: 'general' })
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleCreate(
  supabase: ReturnType<typeof createClient>,
  token: string,
  listing: any,
  veiculo: any,
  cachedAttrs: string[] | null,
  mlPlataformaId: string | null,
): Promise<{ error: string | null; mlItemId?: string; cachedAttrs?: string[] }> {
  const photos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []

  if (photos.length === 0) {
    return { error: 'Nenhuma foto encontrada. Adicione pelo menos 1 foto ao veículo.', cachedAttrs }
  }

  const imageValidation = await validateImagesForML(photos)
  if (imageValidation.invalidUrls.length > 0 && mlPlataformaId) {
    await supabase.from('sync_log').insert({
      plataforma_id: mlPlataformaId,
      veiculo_id: listing.veiculo_id,
      acao: 'image_validation',
      status: imageValidation.validUrls.length === 0 ? 'erro' : 'warning',
      mensagem: `${imageValidation.invalidUrls.length} imagem(ns) rejeitada(s) na validação técnica`,
      metadata: { invalid_images: imageValidation.invalidUrls },
    })
  }
  if (imageValidation.validUrls.length === 0) {
    return {
      error: 'Nenhuma imagem válida após validação técnica (resolução mín 800x800, formato JPEG/PNG, máx 10MB)',
      cachedAttrs,
    }
  }

  const pkgCheck = await checkMLPackages(token)
  if (pkgCheck.error) {
    return { error: `Verificação de pacote ML falhou: ${pkgCheck.error}`, cachedAttrs }
  }

  let mandatoryAttrs = cachedAttrs
  if (!mandatoryAttrs) {
    mandatoryAttrs = await fetchCategoryAttributes(token, 'MLB1744')
  }

  let payload: any
  try {
    const validVehicle = { ...veiculo, fotos: imageValidation.validUrls }
    payload = buildMLItemPayload(validVehicle, veiculo.ml_listing_type, mandatoryAttrs)
  } catch (buildErr: any) {
    return { error: buildErr.message, cachedAttrs: mandatoryAttrs }
  }

  if (pkgCheck.activeCount >= 15 && payload.listing_type_id === 'gold_pro') {
    payload.listing_type_id = resolveListingType('prata')
  }

  const mlRes = await fetch('https://api.mercadolibre.com/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const mlData = await mlRes.json()

  if (mlRes.ok) {
    await supabase.from('ml_listings').update({
      ml_item_id: mlData.id,
      ml_listing_url: mlData.permalink,
      status: 'active',
      last_synced_at: new Date().toISOString(),
    }).eq('id', listing.id)
    return { error: null, mlItemId: mlData.id, cachedAttrs: mandatoryAttrs }
  }

  return { error: JSON.stringify(mlData), cachedAttrs: mandatoryAttrs }
}
