export interface AdTier {
  value: string
  label: string
}

export const PLATFORM_TIERS: Record<string, AdTier[]> = {
  mercadolivre: [
    { value: 'gold_pro', label: 'Diamante' },
    { value: 'gold_special', label: 'Ouro' },
    { value: 'silver', label: 'Prata' },
  ],
  webmotors: [
    { value: 'super_acelerador_vip', label: 'Super Acelerador VIP' },
    { value: 'anuncio_basico', label: 'Anúncio Básico' },
  ],
  napista: [
    { value: 'anuncio_basico', label: 'Anúncio Básico' },
    { value: 'destaque_1_6', label: 'Destaque 1.6' },
    { value: 'destaque_2_0', label: 'Destaque 2.0' },
  ],
  olx: [
    { value: 'basico', label: 'Básico' },
    { value: 'completo', label: 'Completo' },
  ],
  icarros: [],
}

export function getTiersForPlatform(slug: string): AdTier[] {
  return PLATFORM_TIERS[slug] ?? []
}

export function getTierLabel(slug: string, value: string): string {
  const tiers = PLATFORM_TIERS[slug] ?? []
  return tiers.find((t) => t.value === value)?.label ?? value
}

export function hasTiers(slug: string): boolean {
  return (PLATFORM_TIERS[slug] ?? []).length > 0
}

export function getDefaultTierValue(slug: string): string {
  const tiers = PLATFORM_TIERS[slug] ?? []
  return tiers[0]?.value ?? ''
}
