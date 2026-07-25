function fixMojibakeLatin1ToUtf8(input: string): string {
  // Conserta o caso clássico de mojibake: UTF-8 interpretado como Latin-1
  // Ex.: "AutomÃ¡tica" -> "Automática", "HÃ­brido" -> "Híbrido"
  return input
    .replace(/Ã£/g, 'ã')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ã´/g, 'ô')
    .replace(/Ãµ/g, 'õ')
    .replace(/Ãº/g, 'ú')
    .replace(/Ãœ/g, 'Ü')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/ÃŠ/g, 'Ê')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ã”/g, 'Ô')
    .replace(/Ã•/g, 'Õ')
    .replace(/Ãš/g, 'Ú')
}

export function normalizeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null

  // Corrige mojibake antes do normalize/matching
  const fixed = fixMojibakeLatin1ToUtf8(value)

  const trimmed = fixed.trim().toLowerCase()
  if (trimmed.length === 0) return null

  // Remove diacríticos para permitir matching mais simples (ex.: hídrido -> hibrido)
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
