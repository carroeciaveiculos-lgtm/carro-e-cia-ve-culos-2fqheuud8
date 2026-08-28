import { supabase } from '@/lib/supabase/client'
import { updateAdType, ensureMLListings } from './plataformas'

export interface SelectiveSyncResult {
  veiculoId: string
  success: boolean
  error?: string
  mlItemId?: string
}

export async function syncSelectedVehicles(
  selections: Array<{ veiculoId: string; plan: string }>,
  onProgress?: (current: number, total: number, result: SelectiveSyncResult) => void,
): Promise<SelectiveSyncResult[]> {
  const results: SelectiveSyncResult[] = []
  const total = selections.length

  for (let i = 0; i < selections.length; i++) {
    const { veiculoId, plan } = selections[i]
    const mlListingType = plan === 'diamante' ? 'gold_premium' : 'silver'

    try {
      await updateAdType(veiculoId, 'mercadolivre', mlListingType)
      await ensureMLListings([veiculoId])

      const { data, error } = await supabase.functions.invoke('ml-sync', {
        method: 'POST',
        body: { veiculo_id: veiculoId },
      })

      if (error) {
        results.push({ veiculoId, success: false, error: error.message })
      } else {
        results.push({ veiculoId, success: true, mlItemId: data?.ml_item_id })
      }
    } catch (err: any) {
      results.push({ veiculoId, success: false, error: err.message })
    }

    onProgress?.(i + 1, total, results[results.length - 1])

    if (i < selections.length - 1) {
      await new Promise((r) => setTimeout(r, 6000))
    }
  }

  return results
}
