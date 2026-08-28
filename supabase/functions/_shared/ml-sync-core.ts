import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  getValidMLToken,
  fetchWithBackoff,
  buildMLItemPayload,
  buildMLUpdatePayload,
  resolveListingType,
  getVehicleBodyType,
} from '../_shared/ml-client.ts'
import { validateImagesForML } from '../_shared/image-validation.ts'
import { getCityId, checkAvailableListingTypes } from '../_shared/ml-cache.ts'
import { fetchAndStorePerformance } from '../_shared/ml-performance.ts'
import { validatePayload, filtrarDescricao } from '../_shared/validate-payload.ts'

type SupabaseClient = ReturnType<typeof createClient>

export async function syncVehicleToML(
  supabase: SupabaseClient,
  veiculoId: string,
): Promise<{ success: boolean; ml_item_id?: string; error?: string; skipped?: boolean }> {
  const { token, error: tokenError } = await getValidMLToken(supabase)
  if (tokenError || !token) return { success: false, error: tokenError || 'No ML token' }

  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('*')
    .eq('id', veiculoId)
    .maybeSingle()
  if (!veiculo) return { success: false, error: 'Vehicle not found' }

  const { data: mlPlataforma } = await supabase
    .from('plataformas')
    .select('id')
    .eq('slug', 'mercadolivre')
    .maybeSingle()
  const mlPid = mlPlataforma?.id || null

  const validation = await validatePayload(null as any, veiculo, { supabase })
  if (!validation.valid) {
    await supabase.from('ml_listings').update({ status: 'blocked' }).eq('veiculo_id', veiculoId)
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculoId)
    if (mlPid) {
      const categoria = veiculo.categoria || ''
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'erro',
        mensagem: `VEHICLE_BODY_TYPE inválido: categoria='${categoria}'`,
        metadata: { categoria, atributo: 'VEHICLE_BODY_TYPE', motivo: 'sem_mapeamento' },
      })
    }
    return { success: false, error: validation.errors.join('; ') }
  }

  const bodyType = getVehicleBodyType(veiculo.categoria)
  const isEsportivoFallback = bodyType?.esportivo_fallback === true

  const fotos: string[] = Array.isArray(veiculo.fotos)
    ? veiculo.fotos.filter((u: any) => typeof u === 'string')
    : []
  if (fotos.length < 8) {
    if (mlPid) {
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'skipped',
        mensagem: 'Insufficient images (< 8). Required for Professional level.',
      })
    }
    await supabase.from('ml_listings').update({ status: 'blocked' }).eq('veiculo_id', veiculoId)
    return { success: false, skipped: true, error: 'Insufficient images (min 8 required)' }
  }

  const { data: existingListing } = await supabase
    .from('ml_listings')
    .select('id, ml_item_id, status')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  // Achado ao vivo (14/08/2026, SW4 Hilux): o item local apontava pra um
  // anúncio que já estava "closed"/"deleted" no Mercado Livre (fechado
  // manualmente, ou por outro motivo do lado deles) — o PUT então falhava
  // com TODOS os campos como "not modifiable", porque a API não deixa
  // editar nada de um anúncio fechado/deletado, só recriar um novo. Sem
  // essa checagem, ficaria tentando o PUT pra sempre e nunca republicaria.
  let listingIsStale = false
  if (existingListing?.ml_item_id) {
    try {
      const statusRes = await fetchWithBackoff(
        `https://api.mercadolibre.com/items/${existingListing.ml_item_id}?attributes=status,sub_status`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.status === 'closed' || (statusData.sub_status || []).includes('deleted')) {
          listingIsStale = true
        }
      }
    } catch {
      // fail-open — se a checagem falhar, tenta o PUT normal como antes
    }
  }

  const cityId = await getCityId(supabase, 'Uberaba')

  const imageValidation = await validateImagesForML(fotos)
  if (imageValidation.validUrls.length === 0) {
    return { success: false, error: 'No valid images for ML (min 800x800, JPEG/PNG, max 10MB)' }
  }

  const listingType = resolveListingType(veiculo.ml_listing_type)
  const typeCheck = await checkAvailableListingTypes(token, 'MLB1744', listingType)
  if (!typeCheck.valid) {
    await supabase.from('logs_integracao').insert({
      veiculo_id: veiculoId,
      portal: 'mercadolivre',
      status: 'falha',
      payload_erro: { error: typeCheck.error },
    })
    return { success: false, error: typeCheck.error }
  }

  const validVehicle = { ...veiculo, fotos: imageValidation.validUrls }

  try {
    let mlData: any
    if (existingListing?.ml_item_id && !listingIsStale) {
      const updatePayload = buildMLUpdatePayload(validVehicle, undefined, cityId)
      if (validation.corrections.title) updatePayload.title = validation.corrections.title
      const updateRes = await fetchWithBackoff(
        `https://api.mercadolibre.com/items/${existingListing.ml_item_id}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        },
      )
      mlData = await updateRes.json()
      if (!updateRes.ok) throw new Error(JSON.stringify(mlData))
    } else {
      const createPayload = buildMLItemPayload(
        validVehicle,
        veiculo.ml_listing_type,
        undefined,
        cityId,
      )
      if (validation.corrections.title) createPayload.title = validation.corrections.title
      const createRes = await fetchWithBackoff('https://api.mercadolibre.com/items', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      })
      mlData = await createRes.json()
      if (!createRes.ok) throw new Error(JSON.stringify(mlData))
    }

    // Achado 28/08/2026 (pedido da Adriana): a API do Mercado Livre nao
    // aceita a descricao no PUT principal do item quando ele ja existe --
    // precisa da chamada dedicada abaixo. O cron (ml-sync/index.ts) ja fazia
    // isso; este caminho (usado por sync-plataforma, o clique manual em
    // "Publicar/Sincronizar Agora") nunca fazia, entao a descricao gerada
    // por IA nunca chegava no anuncio real quando sincronizado manualmente
    // -- confirmado ao vivo com o Honda Fit LX (PUQ3A75).
    if (veiculo.descricao && veiculo.descricao.length > 0) {
      try {
        const filteredDesc = filtrarDescricao(veiculo.descricao)
        await fetchWithBackoff(`https://api.mercadolibre.com/items/${mlData.id}/description`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ plain_text: filteredDesc }),
        })
      } catch {
        // Falha ao atualizar descricao nao bloqueia o restante do sync
      }
    }

    await supabase.from('ml_listings').upsert(
      {
        veiculo_id: veiculoId,
        ml_item_id: mlData.id,
        ml_listing_url: mlData.permalink,
        status: 'active',
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'veiculo_id' },
    )

    await supabase.from('veiculos').update({ publicado_mercadolivre: true }).eq('id', veiculoId)

    if (mlPid) {
      const logMetadata: Record<string, any> = isEsportivoFallback
        ? { esportivo_sync: 'fallback_coupe' }
        : {}
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'success',
        mensagem: `ML item ${mlData.id} ${existingListing?.ml_item_id && !listingIsStale ? 'updated' : listingIsStale ? 'recreated (anúncio anterior estava closed/deleted no ML)' : 'created'}`,
        metadata: logMetadata,
      })
    }

    await fetchAndStorePerformance(supabase, token, mlData.id, veiculoId)
    return { success: true, ml_item_id: mlData.id }
  } catch (err: any) {
    await supabase.from('logs_integracao').insert({
      veiculo_id: veiculoId,
      portal: 'mercadolivre',
      status: 'falha',
      payload_erro: { error: err.message },
    })
    if (mlPid) {
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'erro',
        mensagem: err.message.substring(0, 500),
      })
    }
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculoId)
    return { success: false, error: err.message }
  }
}
