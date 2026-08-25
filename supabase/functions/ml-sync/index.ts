import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getValidMLToken,
  buildMLItemPayload,
  buildMLUpdatePayload,
  fetchWithBackoff,
  checkMLPackages,
  fetchCategoryAttributes,
  resolveListingType,
  lookupMLCityId,
  getVehicleBodyType,
} from '../_shared/ml-client.ts'
import { validateImagesForML } from '../_shared/image-validation.ts'
import { validatePayload, filtrarDescricao } from '../_shared/validate-payload.ts'
import { fetchAndStorePerformance } from '../_shared/ml-performance.ts'
import { checkListingQuota } from '../_shared/ml-quota.ts'
import { translateError } from '../_shared/error-map.ts'

async function checkQuotaAndNotify(supabase: any, token: string): Promise<void> {
  try {
    const userRes = await fetchWithBackoff('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) return
    const user = await userRes.json()
    const quotaRes = await fetchWithBackoff(
      `https://api.mercadolibre.com/users/${user.id}/classifieds_quota/MLB1744`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!quotaRes.ok) return
    const quota = await quotaRes.json()
    const remaining = quota.available ?? quota.remaining ?? 0
    const total = quota.total ?? 0
    if (total > 0 && remaining / total < 0.2) {
      await supabase.from('notificacoes').insert({
        tipo: 'quota_baixa',
        titulo: 'Cota de anúncios baixa',
        mensagem: `Restam ${remaining} de ${total} anúncios disponíveis no Mercado Livre. Considere fechar anúncios antigos ou contratar mais quota.`,
      })
    }
  } catch {
    // Quota check is non-critical
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const logSync = (status: string, payload: any) =>
    supabase
      .from('logs_integracao')
      .insert({ portal: 'mercadolivre_sync', status, payload_erro: payload })

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

    await supabase.rpc('auto_retry_stuck_ml_listings')

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
    if (pendingListings && pendingListings.length > 0) {
      await checkQuotaAndNotify(supabase, token)
    }

    if (!pendingListings || pendingListings.length === 0) {
      await logSync('success', { message: 'No pending listings', processed: 0 })
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any[] = []
    let cachedMandatoryAttrs: string[] | null = null
    let cachedCityId: string | null | undefined = undefined

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
          const errMsg = await handleCreate(
            supabase,
            token,
            listing,
            veiculo,
            cachedMandatoryAttrs,
            mlPlataformaId,
          )
          if (errMsg.cachedAttrs) cachedMandatoryAttrs = errMsg.cachedAttrs
          if (errMsg.cachedCityId !== undefined) cachedCityId = errMsg.cachedCityId
          if (errMsg.blocked) {
            results.push({ listing_id: listing.id, status: 'blocked', error: errMsg.error })
          } else if (errMsg.error) {
            await supabase
              .from('ml_listings')
              .update({ status: 'error', last_synced_at: new Date().toISOString() })
              .eq('id', listing.id)
            results.push({ listing_id: listing.id, status: 'error', error: errMsg.error })
          } else {
            await supabase
              .from('veiculos')
              .update({ publicado_mercadolivre: true })
              .eq('id', veiculo.id)
            results.push({ listing_id: listing.id, ml_item_id: errMsg.mlItemId, status: 'created' })
          }
        } else if (listing.status === 'pending_update' && listing.ml_item_id) {
          const updateErr = await handleUpdate(
            supabase,
            token,
            listing,
            veiculo,
            cachedMandatoryAttrs,
            cachedCityId,
            mlPlataformaId,
          )
          if (updateErr.cachedAttrs) cachedMandatoryAttrs = updateErr.cachedAttrs
          if (updateErr.cachedCityId !== undefined) cachedCityId = updateErr.cachedCityId
          if (updateErr.blocked) {
            results.push({ listing_id: listing.id, status: 'blocked', error: updateErr.error })
          } else if (updateErr.error) {
            await supabase
              .from('ml_listings')
              .update({ status: 'error', last_synced_at: new Date().toISOString() })
              .eq('id', listing.id)
            results.push({ listing_id: listing.id, status: 'error', error: updateErr.error })
          } else {
            await supabase
              .from('ml_listings')
              .update({ status: 'active', last_synced_at: new Date().toISOString() })
              .eq('id', listing.id)
            results.push({
              listing_id: listing.id,
              ml_item_id: listing.ml_item_id,
              status: 'updated',
            })
          }
        } else if (listing.status === 'pending_close' && listing.ml_item_id) {
          const closeRes = await fetchWithBackoff(
            `https://api.mercadolibre.com/items/${listing.ml_item_id}`,
            {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'closed' }),
            },
          )
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
        await supabase
          .from('ml_listings')
          .update({ status: 'error', last_synced_at: new Date().toISOString() })
          .eq('id', listing.id)
        results.push({ listing_id: listing.id, status: 'error', error: err.message })
      }
    }

    if (mlPlataformaId && pendingListings.length > 0) {
      const successIds = results
        .filter((r) => r.status === 'created' || r.status === 'updated' || r.status === 'closed')
        .map((r) => pendingListings.find((l) => l.id === r.listing_id)?.veiculo_id)
        .filter(Boolean) as string[]
      const errorIds = results
        .filter((r) => r.status === 'error' || r.status === 'blocked')
        .map((r) => pendingListings.find((l) => l.id === r.listing_id)?.veiculo_id)
        .filter(Boolean) as string[]
      if (successIds.length > 0) {
        await supabase
          .from('sync_log')
          .update({ status: 'success', mensagem: 'Sincronizacao via ml-sync' })
          .eq('plataforma_id', mlPlataformaId)
          .in('veiculo_id', successIds)
          .eq('status', 'pending')
      }
      if (errorIds.length > 0) {
        await supabase
          .from('sync_log')
          .update({ status: 'erro', mensagem: 'Erro na sincronizacao via ml-sync' })
          .eq('plataforma_id', mlPlataformaId)
          .in('veiculo_id', errorIds)
          .eq('status', 'pending')
      }
    }

    const errorCount = results.filter((r) => r.status === 'error').length
    await logSync(
      errorCount > 0 ? (errorCount === results.length ? 'error' : 'partial') : 'success',
      {
        processed: results.length,
        errors: errorCount,
        details: results,
      },
    )

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
  cachedCityId?: string | null,
): Promise<{
  error: string | null
  mlItemId?: string
  cachedAttrs?: string[]
  cachedCityId?: string | null
  blocked?: boolean
}> {
  const validation = await validatePayload(null as any, veiculo, { supabase })
  if (!validation.valid) {
    await supabase.from('ml_listings').update({ status: 'blocked' }).eq('id', listing.id)
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculo.id)
    if (mlPlataformaId) {
      // Corrigido 25/08/2026 (achado real: veículos com categoria VÁLIDA
      // apareciam com esse erro fixo, porque a mensagem sempre dizia
      // "VEHICLE_BODY_TYPE inválido" não importa qual validação bloqueou de
      // verdade — preço, foto, cor, o que fosse). Agora grava o motivo real.
      await supabase.from('sync_log').insert({
        plataforma_id: mlPlataformaId,
        veiculo_id: veiculo.id,
        acao: 'sync',
        status: 'erro',
        mensagem: validation.errors.join('; ') || 'Validação bloqueante sem detalhe',
        metadata: { erros: validation.errors, motivo: 'validacao_bloqueante' },
      })
    }
    return { error: validation.errors.join('; '), blocked: true, cachedAttrs, cachedCityId }
  }

  const photos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []
  if (photos.length === 0) {
    return {
      error: 'Nenhuma foto encontrada. Adicione pelo menos 1 foto ao veículo.',
      cachedAttrs,
      cachedCityId,
    }
  }

  const imageValidation = await validateImagesForML(photos)
  if (imageValidation.validUrls.length === 0) {
    return {
      error: 'Nenhuma imagem válida (mín 800x800, JPEG/PNG, máx 10MB)',
      cachedAttrs,
      cachedCityId,
    }
  }

  const pkgCheck = await checkMLPackages(token)
  if (pkgCheck.error) {
    return {
      error: `Verificação de pacote ML falhou: ${pkgCheck.error}`,
      cachedAttrs,
      cachedCityId,
    }
  }

  let mandatoryAttrs = cachedAttrs
  if (!mandatoryAttrs) {
    mandatoryAttrs = await fetchCategoryAttributes(token, 'MLB1744')
  }

  let cityId = cachedCityId
  if (cityId === undefined && veiculo.proprietario_cep) {
    cityId = await lookupMLCityId(token, veiculo.proprietario_cep.replace(/\D/g, ''))
  }

  let payload: any
  try {
    const validVehicle = { ...veiculo, fotos: imageValidation.validUrls }
    payload = buildMLItemPayload(validVehicle, veiculo.ml_listing_type, mandatoryAttrs, cityId)
  } catch (buildErr: any) {
    return { error: buildErr.message, cachedAttrs: mandatoryAttrs, cachedCityId: cityId }
  }

  if (validation.corrections.title) payload.title = validation.corrections.title
  if (validation.corrections.description) {
    payload.description = { plain_text: validation.corrections.description as string }
  }

  const resolvedType = resolveListingType(veiculo.ml_listing_type)
  const quotaCheck = await checkListingQuota(supabase, resolvedType)
  if (!quotaCheck.hasQuota) {
    return {
      error:
        quotaCheck.error ||
        'Cota insuficiente para o plano selecionado. Consulte seu plano no Mercado Livre.',
      cachedAttrs: mandatoryAttrs,
      cachedCityId: cityId,
    }
  }

  const tokenRefresher = async () => {
    const { token: newToken } = await getValidMLToken(supabase)
    return newToken
  }

  const mlRes = await fetchWithBackoff(
    'https://api.mercadolibre.com/items',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    3,
    tokenRefresher,
  )

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
    await fetchAndStorePerformance(supabase, token, mlData.id, veiculo.id)
    if (mlPlataformaId) {
      const bodyType = getVehicleBodyType(veiculo.categoria)
      const logMetadata: Record<string, any> = bodyType?.esportivo_fallback
        ? { esportivo_sync: 'fallback_coupe' }
        : {}
      await supabase.from('sync_log').insert({
        plataforma_id: mlPlataformaId,
        veiculo_id: veiculo.id,
        acao: 'sync',
        status: 'success',
        mensagem: `ML item ${mlData.id} created`,
        metadata: logMetadata,
      })
    }
    return { error: null, mlItemId: mlData.id, cachedAttrs: mandatoryAttrs, cachedCityId: cityId }
  }

  return { error: JSON.stringify(mlData), cachedAttrs: mandatoryAttrs, cachedCityId: cityId }
}

async function handleUpdate(
  supabase: ReturnType<typeof createClient>,
  token: string,
  listing: any,
  veiculo: any,
  cachedAttrs: string[] | null,
  cachedCityId?: string | null,
  mlPlataformaId?: string | null,
): Promise<{
  error: string | null
  cachedAttrs?: string[]
  cachedCityId?: string | null
  blocked?: boolean
}> {
  const validation = await validatePayload(null as any, veiculo, { supabase })
  if (!validation.valid) {
    await supabase.from('ml_listings').update({ status: 'blocked' }).eq('id', listing.id)
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculo.id)
    if (mlPlataformaId) {
      // Corrigido 25/08/2026 (achado real: veículos com categoria VÁLIDA
      // apareciam com esse erro fixo, porque a mensagem sempre dizia
      // "VEHICLE_BODY_TYPE inválido" não importa qual validação bloqueou de
      // verdade — preço, foto, cor, o que fosse). Agora grava o motivo real.
      await supabase.from('sync_log').insert({
        plataforma_id: mlPlataformaId,
        veiculo_id: veiculo.id,
        acao: 'sync',
        status: 'erro',
        mensagem: validation.errors.join('; ') || 'Validação bloqueante sem detalhe',
        metadata: { erros: validation.errors, motivo: 'validacao_bloqueante' },
      })
    }
    return { error: validation.errors.join('; '), blocked: true, cachedAttrs, cachedCityId }
  }

  let mandatoryAttrs = cachedAttrs
  if (!mandatoryAttrs) {
    mandatoryAttrs = await fetchCategoryAttributes(token, 'MLB1744')
  }

  let cityId = cachedCityId
  if (cityId === undefined && veiculo.proprietario_cep) {
    cityId = await lookupMLCityId(token, veiculo.proprietario_cep.replace(/\D/g, ''))
  }

  const photos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []
  const imageValidation =
    photos.length > 0 ? await validateImagesForML(photos) : { validUrls: [] as string[] }

  let payload: any
  try {
    const validVehicle =
      imageValidation.validUrls.length > 0
        ? { ...veiculo, fotos: imageValidation.validUrls }
        : veiculo
    payload = buildMLUpdatePayload(validVehicle, mandatoryAttrs, cityId)
  } catch (buildErr: any) {
    return { error: buildErr.message, cachedAttrs: mandatoryAttrs, cachedCityId: cityId }
  }

  if (validation.corrections.title) payload.title = validation.corrections.title
  if (validation.corrections.description && payload.description) {
    payload.description.plain_text = validation.corrections.description as string
  }

  const updateRes = await fetchWithBackoff(
    `https://api.mercadolibre.com/items/${listing.ml_item_id}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  if (!updateRes.ok) {
    const errData = await updateRes.json()
    return { error: JSON.stringify(errData), cachedAttrs: mandatoryAttrs, cachedCityId: cityId }
  }

  if (veiculo.descricao && veiculo.descricao.length > 0) {
    try {
      const filteredDesc = filtrarDescricao(veiculo.descricao)
      await fetchWithBackoff(
        `https://api.mercadolibre.com/items/${listing.ml_item_id}/description`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ plain_text: filteredDesc }),
        },
      )
    } catch {
      // Description update is non-critical
    }
  }

  await fetchAndStorePerformance(supabase, token, listing.ml_item_id, veiculo.id)

  if (mlPlataformaId) {
    const bodyType = getVehicleBodyType(veiculo.categoria)
    const logMetadata: Record<string, any> = bodyType?.esportivo_fallback
      ? { esportivo_sync: 'fallback_coupe' }
      : {}
    await supabase.from('sync_log').insert({
      plataforma_id: mlPlataformaId,
      veiculo_id: veiculo.id,
      acao: 'sync',
      status: 'success',
      mensagem: `ML item ${listing.ml_item_id} updated`,
      metadata: logMetadata,
    })
  }

  return { error: null, cachedAttrs: mandatoryAttrs, cachedCityId: cityId }
}
