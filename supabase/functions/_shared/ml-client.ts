import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface MLCredentials {
  access_token: string
  refresh_token: string
  expires_at: string
}

const LISTING_TYPE_MAP: Record<string, string> = {
  diamante: 'gold_pro',
  ouro: 'gold_special',
  prata: 'silver',
  gold_pro: 'gold_pro',
  gold_special: 'gold_special',
  silver: 'silver',
}

export function resolveListingType(mlListingType: string | null | undefined): string {
  if (!mlListingType) return 'gold_special'
  const key = mlListingType.toLowerCase()
  return LISTING_TYPE_MAP[key] || mlListingType
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
  const buffer = 5 * 60 * 1000

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

export async function checkMLPackages(
  token: string,
): Promise<{ hasPackage: boolean; activeCount: number; error: string | null }> {
  try {
    const userRes = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) {
      return {
        hasPackage: false,
        activeCount: 0,
        error: 'Não foi possível obter informações do usuário no Mercado Livre',
      }
    }
    const user = await userRes.json()

    const listingsRes = await fetch(
      `https://api.mercadolibre.com/users/${user.id}/items/search?status=active&search_type=classifieds`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!listingsRes.ok) {
      return {
        hasPackage: false,
        activeCount: 0,
        error: 'Não foi possível verificar anúncios ativos no Mercado Livre',
      }
    }
    const listings = await listingsRes.json()
    const activeCount = listings.results?.length || 0

    return { hasPackage: true, activeCount, error: null }
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

export function buildMLItemPayload(v: any, listingType?: string, mandatoryAttrs?: string[]): any {
  let fotos: string[] = []
  if (Array.isArray(v.fotos)) {
    fotos = v.fotos.filter((url: any) => typeof url === 'string')
  }

  const resolvedListingType = resolveListingType(listingType || v.ml_listing_type)
  const isZeroKm = v.is_zero_km === true
  const condition = isZeroKm ? 'new' : 'used'

  const attributes = [
    { id: 'BRAND', value_name: v.marca || undefined },
    { id: 'MODEL', value_name: v.modelo || undefined },
    { id: 'VEHICLE_YEAR', value_name: v.ano_modelo ? String(v.ano_modelo) : undefined },
    { id: 'KM', value_name: v.quilometragem ? String(v.quilometragem) : undefined },
    { id: 'COLOR', value_name: v.cor || undefined },
    { id: 'FUEL_TYPE', value_name: v.combustivel || undefined },
    { id: 'TRANSMISSION', value_name: v.cambio || undefined },
    { id: 'DOORS', value_name: v.portas ? String(v.portas) : undefined },
    { id: 'STEERING', value_name: v.direcao || undefined },
    { id: 'ENGINE_DISPLACEMENT', value_name: v.cilindrada || undefined },
    { id: 'TRIM', value_name: v.versao || undefined },
    { id: 'PLATE_FINAL_DIGIT', value_name: v.final_placa || undefined },
    { id: 'ITEM_CONDITION', value_name: isZeroKm ? 'Nuevo' : 'Usado' },
  ].filter((a: any) => a.value_name !== undefined)

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
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes,
    description: { plain_text: v.descricao || `${v.marca} ${v.modelo}` },
  }
}
