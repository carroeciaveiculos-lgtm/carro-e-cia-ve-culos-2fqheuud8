import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getValidMLToken,
  buildMLItemPayload,
  buildMLUpdatePayload,
  fetchWithBackoff,
  getVehicleBodyType,
} from '../_shared/ml-client.ts'
import { validateImagesForML } from '../_shared/image-validation.ts'
import { validatePayload } from '../_shared/validate-payload.ts'
import { fetchAndStorePerformance } from '../_shared/ml-performance.ts'
import { getCityId } from '../_shared/ml-cache.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const { veiculo_id, platform, action } = body as {
      veiculo_id?: string
      platform?: string
      action?: 'publish' | 'unpublish'
    }

    if (!veiculo_id || !platform) {
      return json({ success: false, message: 'veiculo_id e platform são obrigatórios' }, 400)
    }
    if (platform !== 'mercadolivre') {
      return json({ success: false, message: 'Plataforma não suportada' }, 400)
    }

    const { data: mlPlataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'mercadolivre')
      .maybeSingle()
    const mlPid = mlPlataforma?.id || null

    const { token, error: tokenError } = await getValidMLToken(supabase)
    if (tokenError || !token) {
      const msg = 'Credenciais inválidas ou expiradas'
      if (mlPid) {
        await supabase.from('sync_log').insert({
          plataforma_id: mlPid,
          veiculo_id,
          acao: 'sync',
          status: 'error',
          mensagem: msg,
        })
      }
      return json({ success: false, message: msg }, 401)
    }

    const { data: veiculo } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id', veiculo_id)
      .maybeSingle()

    if (!veiculo) {
      return json({ success: false, message: 'Veículo não encontrado' }, 404)
    }

    if (action === 'unpublish') {
      return await handleUnpublish(supabase, token, veiculo_id, mlPid)
    }

    return await handlePublish(supabase, token, veiculo, mlPid)
  } catch (err: any) {
    return json({ success: false, message: err.message || 'Erro interno' }, 500)
  }
})

async function handleUnpublish(
  supabase: ReturnType<typeof createClient>,
  token: string,
  veiculoId: string,
  mlPid: string | null,
) {
  const { data: listing } = await supabase
    .from('ml_listings')
    .select('id, ml_item_id')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  if (listing?.ml_item_id) {
    const closeRes = await fetchWithBackoff(
      `https://api.mercadolibre.com/items/${listing.ml_item_id}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      },
    )
    if (!closeRes.ok) {
      const errData = await closeRes.json().catch(() => ({}))
      const errMsg = JSON.stringify(errData)
      if (mlPid) {
        await supabase.from('sync_log').insert({
          plataforma_id: mlPid,
          veiculo_id: veiculoId,
          acao: 'sync',
          status: 'error',
          mensagem: errMsg,
        })
      }
      return json({ success: false, message: errMsg })
    }
  }

  await supabase
    .from('ml_listings')
    .update({ status: 'closed', last_synced_at: new Date().toISOString() })
    .eq('veiculo_id', veiculoId)
  await supabase.from('veiculos').update({ publicado_mercadolivre: false }).eq('id', veiculoId)

  const successMsg = 'Anúncio fechado com sucesso'
  if (mlPid) {
    await supabase.from('sync_log').insert({
      plataforma_id: mlPid,
      veiculo_id: veiculoId,
      acao: 'sync',
      status: 'success',
      mensagem: successMsg,
    })
  }
  return json({ success: true, message: successMsg })
}

async function handlePublish(
  supabase: ReturnType<typeof createClient>,
  token: string,
  veiculo: any,
  mlPid: string | null,
) {
  const veiculoId = veiculo.id

  const validation = await validatePayload(null as any, veiculo, { supabase })
  if (!validation.valid) {
    const msg = validation.errors.join('; ')
    await supabase.from('ml_listings').update({ status: 'blocked' }).eq('veiculo_id', veiculoId)
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculoId)
    if (mlPid) {
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'error',
        mensagem: msg,
      })
    }
    return json({ success: false, message: msg })
  }

  const photos: string[] = Array.isArray(veiculo.fotos)
    ? veiculo.fotos.filter((u: any) => typeof u === 'string')
    : []
  if (photos.length === 0) {
    const msg = 'Nenhuma foto encontrada. Adicione pelo menos 1 foto ao veículo.'
    if (mlPid) {
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'error',
        mensagem: msg,
      })
    }
    return json({ success: false, message: msg })
  }

  const imageValidation = await validateImagesForML(photos)
  if (imageValidation.validUrls.length === 0) {
    const msg = 'Nenhuma imagem válida (mín 800x800, JPEG/PNG, máx 10MB)'
    if (mlPid) {
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'error',
        mensagem: msg,
      })
    }
    return json({ success: false, message: msg })
  }

  const cityId = await getCityId(supabase, 'Uberaba')

  const { data: existingListing } = await supabase
    .from('ml_listings')
    .select('id, ml_item_id, status')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  const validVehicle = { ...veiculo, fotos: imageValidation.validUrls }

  let mlData: any
  let actionVerb: string

  try {
    if (existingListing?.ml_item_id) {
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
      actionVerb = 'updated'
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
      actionVerb = 'created'
    }
  } catch (err: any) {
    const errMsg = err.message || 'Erro desconhecido na API do Mercado Livre'
    await supabase
      .from('ml_listings')
      .update({ status: 'error', last_synced_at: new Date().toISOString() })
      .eq('veiculo_id', veiculoId)
    if (mlPid) {
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'error',
        mensagem: errMsg,
      })
    }
    return json({ success: false, message: errMsg })
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

  const successMsg = `ML item ${mlData.id} ${actionVerb} com sucesso`
  if (mlPid) {
    const bodyType = getVehicleBodyType(veiculo.categoria)
    const logMetadata: Record<string, any> = bodyType?.esportivo_fallback
      ? { esportivo_sync: 'fallback_coupe' }
      : {}
    await supabase.from('sync_log').insert({
      plataforma_id: mlPid,
      veiculo_id: veiculoId,
      acao: 'sync',
      status: 'success',
      mensagem: successMsg,
      metadata: logMetadata,
    })
  }

  await fetchAndStorePerformance(supabase, token, mlData.id, veiculoId)

  return json({ success: true, message: successMsg, ml_item_id: mlData.id })
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
