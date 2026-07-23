import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface MLCredentials {
  access_token: string
  refresh_token: string
  expires_at: string
}

const LISTING_TYPE_MAP: Record<string, string> = {
  diamante: 'gold_pro',
  prata: 'silver',
  gold_pro: 'gold_pro',
  gold_special: 'gold_special',
  silver: 'silver',
}

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

const ML_STEERING_MAP: Record<string, string> = {
  hidráulica: 'Hidráulica',
  hidraulica: 'Hidráulica',
  elétrica: 'Elétrica',
  eletrica: 'Elétrica',
  mecânica: 'Mecânica',
  mecanica: 'Mecânica',
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

function normalizeValue(value: string, map: Record<string, string>): string {
  const key = value.toLowerCase().trim()
  return map[key] || value
}

export function resolveListingType(mlListingType: string | null | undefined): string {
  if (!mlListingType) return 'gold_special'
  const key = mlListingType.toLowerCase()
  return LISTING_TYPE_MAP[key] || mlListingType
}

export async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      return res
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
        continue
      }
    }
  }
  throw lastError || new Error('Max retries exceeded')
}

export async function lookupMLCityId(token: string, zipCode: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mercadolibre.com/countries/BR/zip_codes/${zipCode}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.city?.id || null
  } catch {
    return null
  }
}

export async function getValidMLToken(
  supabase: SupabaseClient,
): Promise<{ token: string | null; error: string | null }> {
  const { data: cred, error } = await supabase
    .from('ml_credentials')
    .select('access_token, refresh_token, expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !cred) {
    return { token: null, error: 'No ML credentials found. Please authenticate first.' }
  }

  const now = new Date()
  const expires = new Date(cred.expires_at)
  const buffer = 15 * 60 * 1000

  if (expires.getTime() - now.getTime() > buffer) {
    return { token: cred.access_token, error: null }
  }

  const clientId = Deno.env.get('ML_CLIENT_ID')!
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET')!

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: cred.refresh_token,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { token: null, error: `Token refresh failed: ${errText}` }
  }

  const tokenData = await res.json()
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabase
    .from('ml_credentials')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('access_token', cred.access_token)

  return { token: tokenData.access_token, error: null }
}

export function formatVehicleTitle(v: any): string {
  const parts = [v.marca, v.modelo, v.versao].filter(Boolean)
  const yearPart = v.ano_modelo ? ` ${v.ano_modelo}` : ''
  return `${parts.join(' ')}${yearPart}`.substring(0, 60)
}

export async function checkMLPackages(
  token: string,
): Promise<{ hasPackage: boolean; activeCount: number; error: string | null }> {
  try {
    const userRes = await fetchWithBackoff('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) {
      return {
        hasPackage: false,
        activeCount: 0,
        error: 'Não foi possível obter informações do usuário',
      }
    }
    const user = await userRes.json()
    const listingsRes = await fetchWithBackoff(
      `https://api.mercadolibre.com/users/${user.id}/items/search?status=active&search_type=classifieds`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!listingsRes.ok) {
      return {
        hasPackage: false,
        activeCount: 0,
        error: 'Não foi possível verificar anúncios ativos',
      }
    }
    const listings = await listingsRes.json()
    return { hasPackage: true, activeCount: listings.results?.length || 0, error: null }
  } catch (err: any) {
    return { hasPackage: false, activeCount: 0, error: err.message }
  }
}

export async function fetchCategoryAttributes(
  token: string,
  categoryId = 'MLB1744',
): Promise<string[]> {
  try {
    const res = await fetch(`https://api.mercadolibre.com/categories/${categoryId}/attributes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const attrs = await res.json()
    return attrs
      .filter((a: any) => a.tags?.required === true || a.required === true)
      .map((a: any) => a.id)
  } catch {
    return []
  }
}

function buildLocation(v: any, cityId?: string | null): any {
  const addressParts = [
    v.proprietario_logradouro,
    v.proprietario_numero,
    v.proprietario_bairro,
  ].filter(Boolean)
  const addressLine = addressParts.length > 0 ? addressParts.join(', ') : 'Endereço não informado'
  const zipCode = v.proprietario_cep?.replace(/\D/g, '') || undefined
  const location: any = { address_line: addressLine }
  if (cityId) location.city_id = cityId
  if (zipCode) location.zip_code = zipCode
  return location
}

function buildAttributes(v: any, isZeroKm: boolean): any[] {
  return [
    { id: 'BRAND', value_name: v.marca || undefined },
    { id: 'MODEL', value_name: v.modelo || undefined },
    { id: 'VEHICLE_YEAR', value_name: v.ano_modelo ? String(v.ano_modelo) : undefined },
    {
      id: 'KILOMETERS',
      value_struct:
        v.quilometragem != null ? { number: Number(v.quilometragem), unit: 'km' } : undefined,
    },
    { id: 'COLOR', value_name: v.cor ? normalizeValue(v.cor, ML_COLOR_MAP) : undefined },
    {
      id: 'FUEL_TYPE',
      value_name: v.combustivel ? normalizeValue(v.combustivel, ML_FUEL_MAP) : undefined,
    },
    {
      id: 'TRANSMISSION',
      value_name: v.cambio ? normalizeValue(v.cambio, ML_TRANSMISSION_MAP) : undefined,
    },
    { id: 'DOORS', value_name: v.portas ? String(v.portas) : undefined },
    {
      id: 'STEERING',
      value_name: v.direcao ? normalizeValue(v.direcao, ML_STEERING_MAP) : undefined,
    },
    {
      id: 'ENGINE_DISPLACEMENT',
      value_struct: v.cilindrada
        ? { number: parseInt(String(v.cilindrada).replace(/\D/g, '')) || undefined, unit: 'cc' }
        : undefined,
    },
    { id: 'TRIM', value_name: v.versao || undefined },
    { id: 'PLATE_FINAL_DIGIT', value_name: v.final_placa || undefined },
    { id: 'ITEM_CONDITION', value_name: isZeroKm ? 'Nuevo' : 'Usado' },
  ].filter((a: any) => a.value_name !== undefined || a.value_struct !== undefined)
}

export function buildMLItemPayload(
  v: any,
  listingType?: string,
  mandatoryAttrs?: string[],
  cityId?: string | null,
): any {
  const fotos: string[] = Array.isArray(v.fotos)
    ? v.fotos.filter((url: any) => typeof url === 'string')
    : []
  const resolvedListingType = resolveListingType(listingType || v.ml_listing_type)
  const isZeroKm = v.is_zero_km === true
  const condition = isZeroKm ? 'new' : 'used'
  const attributes = buildAttributes(v, isZeroKm)

  if (mandatoryAttrs && mandatoryAttrs.length > 0) {
    const presentIds = new Set(attributes.map((a) => a.id))
    const missing = mandatoryAttrs.filter((id) => !presentIds.has(id))
    if (missing.length > 0) {
      throw new Error(`Missing mandatory attribute(s): ${missing.join(', ')}`)
    }
  }

  return {
    title: formatVehicleTitle(v),
    category_id: 'MLB1744',
    price: Number(v.preco_venda) || 0,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition,
    listing_type_id: resolvedListingType,
    channels: ['marketplace'],
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes,
    location: buildLocation(v, cityId),
    description: { plain_text: v.descricao || `${v.marca} ${v.modelo}` },
  }
}

export function buildMLUpdatePayload(
  v: any,
  mandatoryAttrs?: string[],
  cityId?: string | null,
): any {
  const fotos: string[] = Array.isArray(v.fotos)
    ? v.fotos.filter((url: any) => typeof url === 'string')
    : []
  const isZeroKm = v.is_zero_km === true
  const attributes = buildAttributes(v, isZeroKm)

  if (mandatoryAttrs && mandatoryAttrs.length > 0) {
    const presentIds = new Set(attributes.map((a) => a.id))
    const missing = mandatoryAttrs.filter((id) => !presentIds.has(id))
    if (missing.length > 0) {
      throw new Error(`Missing mandatory attribute(s): ${missing.join(', ')}`)
    }
  }

  return {
    title: formatVehicleTitle(v),
    price: Number(v.preco_venda) || 0,
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes,
    location: buildLocation(v, cityId),
    available_quantity: 1,
  }
}

export async function validatePhotos(
  photos: string[],
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  for (const url of photos) {
    if (!url.startsWith('https://')) {
      errors.push(`URL não é HTTPS: ${url}`)
      continue
    }
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        errors.push(`Imagem inacessível (HTTP ${res.status}): ${url}`)
      }
    } catch {
      try {
        const res2 = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          signal: AbortSignal.timeout(10000),
        })
        if (!res2.ok && res2.status !== 206) {
          errors.push(`Imagem inacessível (HTTP ${res2.status}): ${url}`)
        }
      } catch {
        errors.push(`Falha ao acessar imagem: ${url}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
