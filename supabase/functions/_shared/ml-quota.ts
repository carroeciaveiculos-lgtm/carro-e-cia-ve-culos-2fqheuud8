import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getValidMLToken } from '../_shared/ml-client.ts'

type SupabaseClient = ReturnType<typeof createClient>

export async function checkListingQuota(
  supabase: SupabaseClient,
  listingType: string,
): Promise<{ hasQuota: boolean; available: number; error: string | null }> {
  const { token, error: tokenError } = await getValidMLToken(supabase)
  if (tokenError || !token) return { hasQuota: false, available: 0, error: tokenError || 'No token' }

  try {
    const userRes = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) return { hasQuota: false, available: 0, error: 'Falha ao obter usuário ML' }
    const user = await userRes.json()

    const quotaRes = await fetch(
      `https://api.mercadolibre.com/users/${user.id}/available_listing_types?category_id=MLB1744`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!quotaRes.ok) return { hasQuota: false, available: 0, error: 'Falha ao verificar quota' }
    const quotaData = await quotaRes.json()

    if (!Array.isArray(quotaData)) return { hasQuota: true, available: 999, error: null }

    const matching = quotaData.find((q: any) => q.id === listingType)
    if (!matching) return { hasQuota: false, available: 0, error: `Plano ${listingType} não disponível` }

    const available = matching.available ?? matching.quantity ?? 0
    if (available <= 0) {
      return { hasQuota: false, available: 0, error: 'Cota insuficiente para o plano selecionado. Consulte seu plano no Mercado Livre.' }
    }
    return { hasQuota: true, available, error: null }
  } catch (err: any) {
    return { hasQuota: false, available: 0, error: err.message }
  }
}
