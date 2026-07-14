import { supabase } from '@/lib/supabase/client'
import { DEFAULT_BRAND, type BrandConfig } from '@/lib/brand'

export async function loadBrandConfig(): Promise<BrandConfig> {
  const { data } = await supabase
    .from('site_configuracoes')
    .select('valor')
    .eq('chave', 'brand_config')
    .single()

  if (data?.valor) {
    return { ...DEFAULT_BRAND, ...(data.valor as Record<string, unknown>) } as BrandConfig
  }
  return DEFAULT_BRAND
}

export async function saveBrandConfig(config: BrandConfig): Promise<void> {
  const { error } = await supabase
    .from('site_configuracoes')
    .upsert(
      { chave: 'brand_config', valor: config as Record<string, unknown> },
      { onConflict: 'chave' },
    )
  if (error) throw error
}
