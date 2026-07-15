import { createClient } from 'jsr:@supabase/supabase-js@2'

const ML_API_BASE = 'https://api.mercadolibre.com'
const ML_CATEGORY = 'MLB1744'

export async function getValidMLToken(
  supabase: ReturnType<typeof createClient>,
): Promise<{ token: string | null; error: string | null }> {
  const { data: cred, error: credError } = await supabase
    .from('ml_credentials')
    .select('access_token, refresh_token, expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (credError || !cred) {
    return { token: null, error: credError?.message || 'No ML credentials found' }
  }

  const now = new Date()
  const expiresAt = new Date(cred.expires_at)
  const bufferMs = 5 * 60 * 1000

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return { token: cred.access_token, error: null }
  }

  const clientId = Deno.env.get('ML_CLIENT_ID')!
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET')!

  const refreshRes = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: cred.refresh_token,
    }),
  })

  if (!refreshRes.ok) {
    const errText = await refreshRes.text()
    return { token: null, error: `Token refresh failed: ${errText}` }
  }

  const refreshData = await refreshRes.json()
  const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString()

  await supabase.from('ml_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  await supabase.from('ml_credentials').insert({
    access_token: refreshData.access_token,
    refresh_token: refreshData.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  })

  return { token: refreshData.access_token, error: null }
}

export async function validatePhotos(
  photos: string[],
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  if (!photos || photos.length === 0) {
    errors.push('Nenhuma foto encontrada.')
    return { valid: false, errors }
  }

  if (photos.length > 10) {
    errors.push('Máximo de 10 fotos permitido pelo Mercado Livre.')
  }

  for (let i = 0; i < Math.min(photos.length, 10); i++) {
    const url = photos[i]
    if (!url || typeof url !== 'string') {
      errors.push(`Foto ${i + 1} URL inválida.`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export async function checkMLPackages(
  token: string,
): Promise<{ error: string | null; activeCount: number }> {
  try {
    const res = await fetch(
      `${ML_API_BASE}/users/me/items/search?status=active&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!res.ok) {
      const errText = await res.text()
      return { error: `ML API error: ${errText}`, activeCount: 0 }
    }

    const data = await res.json()
    const totalCount = data?.total ?? 0
    return { error: null, activeCount: totalCount }
  } catch (err: any) {
    return { error: err.message, activeCount: 0 }
  }
}

export async function fetchCategoryAttributes(
  token: string,
  categoryId: string = ML_CATEGORY,
): Promise<string[]> {
  const res = await fetch(
    `${ML_API_BASE}/categories/${categoryId}/attributes`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) return []

  const attrs = await res.json()
  if (!Array.isArray(attrs)) return []

  return attrs
    .filter((a: any) => a.tags?.required || a.tags?.fixed)
    .map((a: any) => a.id)
}

export function resolveListingType(tier: string | null | undefined): string {
  const t = (tier || '').toLowerCase().trim()
  if (t === 'ouro' || t === 'gold_pro') return 'gold_pro'
  if (t === 'prata' || t === 'gold_special') return 'gold_special'
  if (t === 'bronze' || t === 'bronze') return 'bronze'
  if (t === 'diamante' || t === 'gold') return 'gold'
  return 'gold_special'
}

export function buildMLItemPayload(
  veiculo: any,
  listingType: string | null | undefined,
  mandatoryAttrs: string[],
): any {
  const title = `${veiculo.marca || ''} ${veiculo.modelo || ''} ${veiculo.versao || ''} ${veiculo.ano_modelo || veiculo.ano_fabricacao || ''}`.trim().replace(/\s+/g, ' ')
  if (!title) throw new Error('Título do anúncio não pode ser vazio.')

  const price = Number(veiculo.preco_venda) || 0
  if (price <= 0) throw new Error('Preço de venda deve ser maior que zero.')

  const photos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos.slice(0, 10) : []

  const attributes: { id: string; value_name: string }[] = [
    { id: 'BRAND', value_name: veiculo.marca || '' },
    { id: 'MODEL', value_name: veiculo.modelo || '' },
    { id: 'VEHICLE_YEAR', value_name: String(veiculo.ano_modelo || veiculo.ano_fabricacao || '') },
    { id: 'KM', value_name: String(veiculo.quilometragem || 0) },
  ]

  if (veiculo.cor) {
    attributes.push({ id: 'COLOR', value_name: veiculo.cor })
  }
  if (veiculo.combustivel) {
    const fuelMap: Record<string, string> = {
      'Flex': 'Flex',
      'Gasolina': 'Gasolina',
      'Diesel': 'Diesel',
      'Álcool': 'Álcool',
      'Híbrido': 'Híbrido',
      'Elétrico': 'Elétrico',
    }
    attributes.push({ id: 'FUEL_TYPE', value_name: fuelMap[veiculo.combustivel] || veiculo.combustivel })
  }
  if (veiculo.cambio) {
    const transMap: Record<string, string> = {
      'Automático': 'Automática',
      'Manual': 'Manual',
      'CVT': 'Automática',
      'Automatizada': 'Automática',
    }
    attributes.push({ id: 'TRANSMISSION', value_name: transMap[veiculo.cambio] || veiculo.cambio })
  }
  if (veiculo.portas) {
    attributes.push({ id: 'DOORS', value_name: String(veiculo.portas) })
  }

  const filteredAttrs = attributes.filter((a) => a.value_name && mandatoryAttrs.includes(a.id))

  return {
    title: title.substring(0, 60),
    category_id: ML_CATEGORY,
    price,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition: 'used',
    listing_type_id: resolveListingType(listingType || veiculo.ml_listing_type),
    pictures: photos.map((url) => ({ source: url })),
    attributes: filteredAttrs,
  }
}
