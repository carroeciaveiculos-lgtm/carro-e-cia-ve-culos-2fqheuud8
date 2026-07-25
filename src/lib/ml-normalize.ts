export function normalizeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  if (trimmed.length === 0) return null
  const noDiacritics = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const collapsed = noDiacritics.replace(/\s+/g, ' ').trim()
  if (collapsed.length === 0) return null
  return collapsed
}

export const ML_TRANSMISSION_MAP: Record<string, string> = {
  manual: 'Manual',
  automatico: 'Automática',
  automatica: 'Automática',
  automatizada: 'Automatizada',
  cvt: 'CVT',
}

export const ML_FUEL_MAP: Record<string, string> = {
  flex: 'Flex',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  alcool: 'Álcool',
  hibrido: 'Híbrido',
  eletrico: 'Elétrico',
}

export const ML_COLOR_MAP: Record<string, string> = {
  branco: 'Branco',
  preto: 'Preto',
  prata: 'Prata',
  vermelho: 'Vermelho',
  azul: 'Azul',
  verde: 'Verde',
  amarelo: 'Amarelo',
  cinza: 'Cinza',
  marrom: 'Marrom',
  bege: 'Bege',
  dourado: 'Dourado',
  vinho: 'Vinho',
}

export const ML_STEERING_MAP: Record<string, string> = {
  hidraulica: 'Hidráulica',
  eletrica: 'Elétrica',
  mecanica: 'Mecânica',
}

export function lookupNormalized(value: unknown, map: Record<string, string>): string | null {
  const normalized = normalizeValue(value)
  if (normalized === null) return null
  return map[normalized] || null
}
