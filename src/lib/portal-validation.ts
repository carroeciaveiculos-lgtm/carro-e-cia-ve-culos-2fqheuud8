interface ValidationField {
  key: string
  label: string
}

export const REQUIRED_PORTAL_FIELDS: ValidationField[] = [
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'ano_fabricacao', label: 'Ano de Fabricação' },
  { key: 'ano_modelo', label: 'Ano do Modelo' },
  { key: 'cor', label: 'Cor' },
  { key: 'cambio', label: 'Câmbio' },
  { key: 'combustivel', label: 'Combustível' },
  { key: 'preco_venda', label: 'Preço de Venda' },
]

export function validatePortalFields(vehicle: Record<string, any>): {
  valid: boolean
  missingFields: string[]
} {
  const missing: string[] = []

  for (const field of REQUIRED_PORTAL_FIELDS) {
    const value = vehicle[field.key]
    if (value === null || value === undefined || value === '' || value === 0) {
      missing.push(field.label)
    }
  }

  if (!vehicle.is_zero_km) {
    if (vehicle.quilometragem === null || vehicle.quilometragem === undefined) {
      missing.push('Quilometragem')
    }
  }

  let photos: any[] = []
  try {
    photos =
      typeof vehicle.fotos === 'string' ? JSON.parse(vehicle.fotos || '[]') : vehicle.fotos || []
  } catch {
    photos = []
  }
  if (!Array.isArray(photos) || photos.length === 0) {
    missing.push('Fotos (mínimo 1)')
  }

  return { valid: missing.length === 0, missingFields: missing }
}

export function formatMissingFields(fields: string[]): string {
  if (fields.length === 0) return ''
  if (fields.length === 1) return `Campo obrigatório faltando: ${fields[0]}`
  return `Campos obrigatórios faltando: ${fields.join(', ')}`
}
