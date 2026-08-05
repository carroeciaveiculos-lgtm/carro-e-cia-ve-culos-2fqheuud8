export function getVersaoComplementar(
  modelo?: string | null,
  versao?: string | null,
): string {
  const modeloTrim = (modelo || '').trim()
  const versaoTrim = (versao || '').trim()
  if (!versaoTrim) return ''
  return modeloTrim.toLowerCase().includes(versaoTrim.toLowerCase()) ? '' : versaoTrim
}

export function buildVehicleTitle(
  parts: Array<string | number | null | undefined>,
): string {
  return parts
    .filter((p) => p !== null && p !== undefined && p !== '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
