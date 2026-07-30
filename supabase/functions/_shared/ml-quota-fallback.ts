import { createClient } from 'npm:@supabase/supabase-js@2'

const ML_DAILY_QUOTA = 50

interface FallbackResult {
  listingType: string
  fellBack: boolean
  originalType: string
}

export async function checkQuotaAndFallback(
  supabaseUrl: string,
  supabaseKey: string,
  veiculoId: string,
  currentListingType: string,
  mlUserId?: number | null,
): Promise<FallbackResult> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (currentListingType !== 'gold_special') {
    return { listingType: currentListingType, fellBack: false, originalType: currentListingType }
  }

  const today = new Date().toISOString().split('T')[0]
  const { count, error } = await supabase
    .from('ml_listings')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  if (error) {
    console.warn('Could not check ML quota:', error.message)
    return { listingType: currentListingType, fellBack: false, originalType: currentListingType }
  }

  if ((count || 0) >= ML_DAILY_QUOTA) {
    const fallbackType = 'silver'

    await supabase.from('ads_audit_logs').insert({
      plataforma: 'mercadolivre',
      acao: 'fallback_listing_type',
      campanha_id: null,
      detalhes: {
        veiculo_id: veiculoId,
        from: 'gold_special',
        to: fallbackType,
        reason: 'quota_exhausted',
        daily_count: count,
        quota_limit: ML_DAILY_QUOTA,
      },
      status: 'sucesso',
    })

    await supabase.from('autonomia_log').insert({
      action: 'ml_quota_fallback',
      details: {
        veiculo_id: veiculoId,
        from: 'gold_special',
        to: fallbackType,
        daily_count: count,
        quota_limit: ML_DAILY_QUOTA,
      },
      result: 'fallback_applied',
    })

    await supabase.from('veiculos').update({ ml_listing_type: fallbackType }).eq('id', veiculoId)

    return { listingType: fallbackType, fellBack: true, originalType: 'gold_special' }
  }

  return { listingType: currentListingType, fellBack: false, originalType: currentListingType }
}
