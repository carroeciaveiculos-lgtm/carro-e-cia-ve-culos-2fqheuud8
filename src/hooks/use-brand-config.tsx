import { useState, useEffect } from 'react'
import { DEFAULT_BRAND, type BrandConfig } from '@/lib/brand'
import { loadBrandConfig } from '@/lib/brand-config'

export function useBrandConfig() {
  const [config, setConfig] = useState<BrandConfig>(DEFAULT_BRAND)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrandConfig()
      .then((c) => setConfig(c))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
