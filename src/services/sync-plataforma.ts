import { supabase } from '@/lib/supabase/client'

export interface SyncResult {
  success: boolean
  message: string
  ml_item_id?: string
}

export async function syncVehicleToPlatform(
  veiculoId: string,
  platform: string,
  action: 'publish' | 'unpublish',
): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke('sync-plataforma', {
    body: { veiculo_id: veiculoId, platform, action },
  })

  if (error) {
    return { success: false, message: error.message || 'Erro de conexão com o servidor' }
  }

  return (data || { success: false, message: 'Resposta vazia do servidor' }) as SyncResult
}

export async function batchSyncVehicles(
  veiculoIds: string[],
  platform: string,
  onProgress?: (current: number, total: number, success: boolean, message: string) => void,
): Promise<{ successCount: number; failCount: number; results: SyncResult[] }> {
  const results: SyncResult[] = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < veiculoIds.length; i++) {
    const result = await syncVehicleToPlatform(veiculoIds[i], platform, 'publish')
    results.push(result)
    if (result.success) successCount++
    else failCount++

    onProgress?.(i + 1, veiculoIds.length, result.success, result.message)

    if (i < veiculoIds.length - 1) {
      await new Promise((r) => setTimeout(r, 6000))
    }
  }

  return { successCount, failCount, results }
}
