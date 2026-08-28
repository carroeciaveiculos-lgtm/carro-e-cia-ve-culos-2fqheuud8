import { supabase } from '@/lib/supabase/client'

const DIAMOND_LIMIT = 15

export async function getDiamondQuota(): Promise<{ used: number; limit: number }> {
  const { count } = await supabase
    .from('listing_preferences')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'mercadolivre')
    .eq('listing_type', 'diamante')
  return { used: count || 0, limit: DIAMOND_LIMIT }
}

export async function checkDiamondQuota(
  currentVeiculoId?: string,
): Promise<{ canPromote: boolean; used: number; limit: number }> {
  const { used, limit } = await getDiamondQuota()

  if (currentVeiculoId) {
    const { data } = await supabase
      .from('listing_preferences')
      .select('listing_type')
      .eq('veiculo_id', currentVeiculoId)
      .eq('platform', 'mercadolivre')
      .maybeSingle()

    if (data?.listing_type === 'diamante') {
      return { canPromote: true, used, limit }
    }
  }

  return { canPromote: used < limit, used, limit }
}

export async function saveListingPreference(
  veiculoId: string,
  platform: string,
  listingType: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('listing_preferences')
    .upsert(
      { veiculo_id: veiculoId, platform, listing_type: listingType },
      { onConflict: 'veiculo_id,platform' },
    )
  return { error: error?.message || null }
}

export function mlListingTypeToPreference(mlListingType: string): string {
  if (mlListingType === 'gold_premium') return 'diamante'
  return 'prata'
}

export function preferenceToMlListingType(preference: string): string {
  if (preference === 'diamante') return 'gold_premium'
  return 'silver'
}
