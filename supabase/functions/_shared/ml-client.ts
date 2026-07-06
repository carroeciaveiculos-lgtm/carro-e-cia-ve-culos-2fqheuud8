import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface MLCredentials {
  access_token: string
  refresh_token: string
  expires_at: string
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

export function buildMLItemPayload(v: any): any {
  let fotos: string[] = []
  if (Array.isArray(v.fotos)) {
    fotos = v.fotos.filter((url: any) => typeof url === 'string')
  }

  return {
    title: formatVehicleTitle(v),
    category_id: 'MLB1744',
    price: Number(v.preco_venda) || 0,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition: 'used',
    listing_type_id: 'gold_special',
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes: [
      { id: 'BRAND', value_name: v.marca || undefined },
      { id: 'MODEL', value_name: v.modelo || undefined },
      { id: 'VEHICLE_YEAR', value_name: v.ano_modelo ? String(v.ano_modelo) : undefined },
      { id: 'KM', value_name: v.quilometragem ? String(v.quilometragem) : undefined }),
      { id: 'COLOR', value_name: v.cor || undefined },
      { id: 'FUEL_TYPE', value_name: v.combustivel || undefined },
      { id: 'TRANSMISSION', value_name: v.cambio || undefined }),
    ].filter((a: any) => a.value_name !== undefined),
    description: { plain_text: v.descricao || `${v.marca} ${v.modelo}` },
  }
}
