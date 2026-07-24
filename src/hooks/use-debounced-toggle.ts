import { useRef, useCallback, useState } from 'react'

export function useDebouncedToggle(
  onToggle: (checked: boolean) => Promise<void>,
  debounceMs = 500,
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastClickRef = useRef(0)
  const pendingRef = useRef(false)

  const handleToggle = useCallback(
    async (checked: boolean) => {
      const now = Date.now()
      if (now - lastClickRef.current < debounceMs) {
        return
      }
      if (pendingRef.current) {
        return
      }
      lastClickRef.current = now
      pendingRef.current = true
      setIsLoading(true)
      setError(null)
      try {
        await onToggle(checked)
      } catch (err: any) {
        setError(err.message || 'Erro na sincronização')
      } finally {
        setIsLoading(false)
        pendingRef.current = false
      }
    },
    [onToggle, debounceMs],
  )

  const clearError = useCallback(() => setError(null), [])

  return { isLoading, error, handleToggle, clearError }
}
