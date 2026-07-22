import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SyncProgress {
  current: number
  total: number
  photosSynced: number
  vehiclesUpdated: number
}

export function useRecursiveSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastOffset, setLastOffset] = useState(0)
  const abortRef = useRef(false)

  const runSync = useCallback(
    async (startOffset: number, onBatchComplete?: () => Promise<void> | void) => {
      abortRef.current = false
      setIsSyncing(true)
      setError(null)

      let offset = startOffset
      const limit = 2
      let totalPhotos = 0
      let totalUpdated = 0

      try {
        while (!abortRef.current) {
          const { data, error: fnError } = await supabase.functions.invoke('sync-google-drive', {
            body: { offset, limit },
          })

          if (fnError) {
            setError(
              `Sincronização pausada no lote ${offset}: ${fnError.message || 'erro desconhecido'}`,
            )
            setLastOffset(offset)
            break
          }

          if (!data) break

          totalPhotos += data.totalPhotosSynced || 0
          totalUpdated += data.vehiclesUpdated || 0
          const newOffset = data.offset || offset + limit
          const remaining = data.remaining || 0

          setProgress({
            current: newOffset,
            total: newOffset + remaining,
            photosSynced: totalPhotos,
            vehiclesUpdated: totalUpdated,
          })
          setLastOffset(newOffset)

          if (onBatchComplete) {
            await onBatchComplete()
          }

          if (remaining <= 0) break
          offset = newOffset
        }
      } catch (err: any) {
        setError(err?.message || 'Erro inesperado durante a sincronização')
        setLastOffset(offset)
      } finally {
        setIsSyncing(false)
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    abortRef.current = true
    setIsSyncing(false)
  }, [])

  return { isSyncing, progress, error, lastOffset, runSync, cancel }
}
