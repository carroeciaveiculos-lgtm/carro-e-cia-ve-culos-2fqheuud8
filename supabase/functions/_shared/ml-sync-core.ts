import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  getValidMLToken,
  fetchWithBackoff,
  formatVehicleTitle,
  resolveListingType,
} from '../_shared/ml-client.ts'
import { validateImagesForML } from '../_shared/image-validation.ts'
import { getAttributeValueId, getCityId, checkAvailableListingTypes } from '../_shared/ml-cache.ts'
import { fetchAndStorePerformance } from '../_shared/ml-performance.ts'

type SupabaseClient = ReturnType<typeof createClient>

const ML_FUEL_MAP: Record<string, string> = {
  flex: 'Flex',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  álcool: 'Álcool',
  alcool: 'Álcool',
  híbrido: 'Híbrido',
  hibrido: 'Híbrido',
  elétrico: 'Elétrico',
  eletrico: 'Elétrico',
}
const ML_TRANSMISSION_MAP: Record<string, string> = {
  manual: 'Manual',
  automática: 'Automática',
  automatica: 'Automática',
  automatizada: 'Automatizada',
  cvt: 'CVT',
}
const ML_COLOR_MAP: Record<string, string> = {
  branco: 'Branco',
  preto: 'Preto',
  prata: 'Prata',
  vermelho: 'Vermelho',
  azul: 'Azul',
  verde: 'Verde',
  amarelo: 'Amarelo',
  cinza: 'Cinza',
  marrom: 'Marrom',
  bege: 'Bege',
  dourado: 'Dourado',
  vinho: 'Vinho',
}
const ML_STEERING_MAP: Record<string, string> = {
  hidráulica: 'Hidráulica',
  hidraulica: 'Hidráulica',
  elétrica: 'Elétrica',
  eletrica: 'Elétrica',
  mecânica: 'Mecânica',
  mecanica: 'Mecânica',
}

function normalizeValue(value: string, map: Record<string, string>): string {
  return map[value.toLowerCase().trim()] || value
}

function buildDescription(v: any): string {
  if (v.descricao && v.descricao.trim()) return v.descricao
  const parts: string[] = []
  if (Array.isArray(v.diferenciais) && v.diferenciais.length > 0) {
    parts.push('Diferenciais: ' + v.diferenciais.join(', '))
  }
  if (Array.isArray(v.caracteristicas) && v.caracteristicas.length > 0) {
    parts.push('Características: ' + v.caracteristicas.join(', '))
  }
  return parts.length > 0 ? parts.join('\n\n') : `${v.marca} ${v.modelo}`
}

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

  const fotos: string[] = Array.isArray(veiculo.fotos)
    ? veiculo.fotos.filter((u: any) => typeof u === 'string')
    : []

  if (fotos.length < 8) {
    await supabase.from('sync_log').insert({
      plataforma_id: (
        await supabase.from('plataformas').select('id').eq('slug', 'mercadolivre').maybeSingle()
      ).data?.id,
      veiculo_id: veiculoId,
      acao: 'sync',
      status: 'skipped',
      mensagem: 'Insufficient images (< 8). Required for Professional level.',
    })
    await supabase.from('ml_listings').update({ status: 'blocked' }).eq('veiculo_id', veiculoId)
    return { success: false, skipped: true, error: 'Insufficient images (min 8 required)' }
  }

  const { data: existingListing } = await supabase
    .from('ml_listings')
    .select('id, ml_item_id, status')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

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

  const price = Number(veiculo.preco_classificados || veiculo.preco_venda) || 0
  const title = formatVehicleTitle(veiculo).substring(0, 60)
  const isZeroKm = veiculo.is_zero_km === true
  const description = buildDescription(veiculo)

  const attributes = [
    { id: 'BRAND', value_name: veiculo.marca || undefined },
    { id: 'MODEL', value_name: veiculo.modelo || undefined },
    { id: 'VEHICLE_YEAR', value_name: veiculo.ano_modelo ? String(veiculo.ano_modelo) : undefined },
    {
      id: 'KILOMETERS',
      value_struct:
        veiculo.quilometragem != null
          ? { number: Number(veiculo.quilometragem), unit: 'km' }
          : undefined,
    },
    {
      id: 'COLOR',
      value_name: veiculo.cor ? normalizeValue(veiculo.cor, ML_COLOR_MAP) : undefined,
    },
    {
      id: 'FUEL_TYPE',
      value_name: veiculo.combustivel
        ? normalizeValue(veiculo.combustivel, ML_FUEL_MAP)
        : undefined,
    },
    {
      id: 'TRANSMISSION',
      value_name: veiculo.cambio ? normalizeValue(veiculo.cambio, ML_TRANSMISSION_MAP) : undefined,
    },
    { id: 'DOORS', value_name: veiculo.portas ? String(veiculo.portas) : undefined },
    {
      id: 'STEERING',
      value_name: veiculo.direcao ? normalizeValue(veiculo.direcao, ML_STEERING_MAP) : undefined,
    },
    { id: 'TRIM', value_name: veiculo.versao || undefined },
    { id: 'ITEM_CONDITION', value_name: isZeroKm ? 'Nuevo' : 'Usado' },
  ].filter((a: any) => a.value_name !== undefined)

  const location: any = { address_line: 'Uberaba, MG' }
  if (cityId) location.city_id = cityId

  const payload: any = {
    title,
    category_id: 'MLB1744',
    price,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition: isZeroKm ? 'new' : 'used',
    listing_type_id: listingType,
    channels: ['marketplace'],
    pictures: imageValidation.validUrls.map((url: string) => ({ source: url })),
    attributes,
    location,
    description: { plain_text: description },
  }

  const mlPlataforma = await supabase
    .from('plataformas')
    .select('id')
    .eq('slug', 'mercadolivre')
    .maybeSingle()
  const mlPid = mlPlataforma.data?.id

  try {
    let mlData: any
    if (existingListing?.ml_item_id) {
      const updateRes = await fetchWithBackoff(
        `https://api.mercadolibre.com/items/${existingListing.ml_item_id}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, price, pictures: payload.pictures, attributes, location }),
        },
      )
      mlData = await updateRes.json()
      if (!updateRes.ok) throw new Error(JSON.stringify(mlData))
    } else {
      const createRes = await fetchWithBackoff('https://api.mercadolibre.com/items', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      mlData = await createRes.json()
      if (!createRes.ok) throw new Error(JSON.stringify(mlData))
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
      await supabase.from('sync_log').insert({
        plataforma_id: mlPid,
        veiculo_id: veiculoId,
        acao: 'sync',
        status: 'success',
        mensagem: `ML item ${mlData.id} ${existingListing?.ml_item_id ? 'updated' : 'created'}`,
      })
    }

    await fetchAndStorePerformance(supabase, token, mlData.id, veiculoId)

    return { success: true, ml_item_id: mlData.id }
  } catch (err: any) {
    await supabase.from('logs_integracao').insert({
      veiculo_id: veiculoId,
      portal: 'mercadolivre',
      status: 'falha',
      payload_erro: { error: err.message, request_body: payload },
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
