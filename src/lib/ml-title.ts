export interface TitlePreviewResult {
  titulo: string
  truncado: boolean
  campos_removidos: string[]
  length: number
}

export function montarTituloMLPreview(vehicle: {
  ano_modelo?: number | string | null
  marca?: string | null
  modelo?: string | null
  versao?: string | null
  combustivel?: string | null
  cambio?: string | null
}): TitlePreviewResult {
  const ano = vehicle.ano_modelo ? String(vehicle.ano_modelo) : ''
  const marca = vehicle.marca || ''
  const modelo = vehicle.modelo || ''
  const versao = vehicle.versao || ''
  const combustivel = vehicle.combustivel || ''
  const cambio = vehicle.cambio || ''

  const base = `${ano} ${marca} ${modelo}`.trim().replace(/\s+/g, ' ')
  const campos_removidos: string[] = []

  let titulo = base
  if (versao) titulo += ` ${versao}`
  if (combustivel) titulo += ` ${combustivel}`
  if (cambio) titulo += ` ${cambio}`
  titulo = titulo.replace(/\s+/g, ' ').trim()

  if (titulo.length > 60) {
    campos_removidos.push('Versão')
    titulo = base
    if (combustivel) titulo += ` ${combustivel}`
    if (cambio) titulo += ` ${cambio}`
    titulo = titulo.replace(/\s+/g, ' ').trim()
  }

  if (titulo.length > 60) {
    if (!campos_removidos.includes('Combustível')) campos_removidos.push('Combustível')
    titulo = base
    if (cambio) titulo += ` ${cambio}`
    titulo = titulo.replace(/\s+/g, ' ').trim()
  }

  if (titulo.length > 60) {
    if (!campos_removidos.includes('Câmbio')) campos_removidos.push('Câmbio')
    titulo = base
  }

  let truncado = campos_removidos.length > 0
  if (titulo.length > 60) {
    titulo = titulo.substring(0, 60)
    truncado = true
  }

  return { titulo, truncado, campos_removidos, length: titulo.length }
}
