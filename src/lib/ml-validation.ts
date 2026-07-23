export interface MLValidationResult {
  success: boolean
  blockingErrors: string[]
  qualityAlerts: string[]
}

export interface VehicleForValidation {
  id: string
  marca: string | null
  modelo: string | null
  versao: string | null
  ano_modelo: number | null
  combustivel: string | null
  cambio: string | null
  descricao: string | null
  preco_venda: number | null
  valor_fipe: number | null
  fotos: string[] | null
  is_zero_km: boolean | null
  proprietario_cidade: string | null
  proprietario_estado: string | null
  ml_listing_type: string | null
  quilometragem: number | null
  cor: string | null
  portas: number | null
  direcao: string | null
  cilindrada: string | null
  final_placa: string | null
  codigo_fipe: string | null
  placa: string | null
}

export function validateVehicleForML(vehicle: VehicleForValidation): MLValidationResult {
  const blockingErrors: string[] = []
  const qualityAlerts: string[] = []

  if (!vehicle.marca || vehicle.marca.trim().length === 0)
    blockingErrors.push('Marca não informada')

  const ano = vehicle.ano_modelo ? String(vehicle.ano_modelo) : ''
  const base = `${ano} ${vehicle.marca || ''} ${vehicle.modelo || ''}`.trim().replace(/\s+/g, ' ')
  if (!base || base.trim().length < 5)
    blockingErrors.push('Título muito curto ou vazio após construção')
  if (base.length > 60) qualityAlerts.push('Título pode ser truncado para 60 caracteres')

  const fotoCount = Array.isArray(vehicle.fotos) ? vehicle.fotos.length : 0
  if (fotoCount === 0) blockingErrors.push('Nenhuma foto cadastrada (mínimo 1)')
  else {
    const validUrls = vehicle.fotos!.filter(
      (f) => typeof f === 'string' && f.startsWith('https://'),
    )
    if (validUrls.length === 0) blockingErrors.push('Nenhuma foto com URL HTTPS válida')
  }
  if (fotoCount > 0 && fotoCount < 8)
    qualityAlerts.push(`Apenas ${fotoCount} fotos (recomendado: 8+)`)

  const condition = vehicle.is_zero_km === true ? 'new' : 'used'
  if (!['used', 'new', 'not_specified'].includes(condition))
    blockingErrors.push('Condição do veículo inválida')

  if (!vehicle.descricao || vehicle.descricao.trim().length === 0)
    blockingErrors.push('Descrição não pode estar vazia')

  const precoVenda = Number(vehicle.preco_venda) || 0
  if (precoVenda < 1000)
    blockingErrors.push(`Preço abaixo do mínimo (R$ 1.000). Atual: R$ ${precoVenda}`)

  const valorFipe = Number(vehicle.valor_fipe) || 0
  if (valorFipe <= 0) blockingErrors.push('Valor FIPE não informado')
  else {
    const diff = Math.abs(precoVenda - valorFipe) / valorFipe
    if (diff > 0.3)
      blockingErrors.push(`Preço difere mais de 30% do FIPE (R$ ${valorFipe.toFixed(2)})`)
  }

  if (!vehicle.proprietario_cidade) blockingErrors.push('Cidade do proprietário não informada')
  if (!vehicle.proprietario_estado) blockingErrors.push('Estado do proprietário não informado')

  if (!vehicle.codigo_fipe && !vehicle.valor_fipe)
    qualityAlerts.push('Dados FIPE ausentes — categoria pode não ser compatível')

  if (vehicle.descricao && vehicle.descricao.length > 50000)
    qualityAlerts.push('Descrição muito longa')

  return { success: blockingErrors.length === 0, blockingErrors, qualityAlerts }
}

export function getDiagnosisStatus(result: MLValidationResult): 'ready' | 'pending' | 'blocked' {
  if (result.blockingErrors.length > 0) return 'blocked'
  if (result.qualityAlerts.length > 0) return 'pending'
  return 'ready'
}

export function generateMLPayloadPreview(vehicle: VehicleForValidation): Record<string, any> {
  const isZeroKm = vehicle.is_zero_km === true
  const ano = vehicle.ano_modelo ? String(vehicle.ano_modelo) : ''
  const title = `${ano} ${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.versao || ''}`
    .trim()
    .substring(0, 60)
  const fotos = Array.isArray(vehicle.fotos)
    ? vehicle.fotos.filter((f) => typeof f === 'string')
    : []

  return {
    title,
    category_id: 'MLB1744',
    price: Number(vehicle.preco_venda) || 0,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition: isZeroKm ? 'new' : 'used',
    listing_type_id: vehicle.ml_listing_type || 'gold_special',
    channels: ['marketplace'],
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes: [
      { id: 'BRAND', value_name: vehicle.marca || undefined },
      { id: 'MODEL', value_name: vehicle.modelo || undefined },
      {
        id: 'VEHICLE_YEAR',
        value_name: vehicle.ano_modelo ? String(vehicle.ano_modelo) : undefined,
      },
      {
        id: 'KILOMETERS',
        value_struct:
          vehicle.quilometragem != null
            ? { number: Number(vehicle.quilometragem), unit: 'km' }
            : undefined,
      },
      { id: 'COLOR', value_name: vehicle.cor || undefined },
      { id: 'FUEL_TYPE', value_name: vehicle.combustivel || undefined },
      { id: 'TRANSMISSION', value_name: vehicle.cambio || undefined },
      { id: 'DOORS', value_name: vehicle.portas ? String(vehicle.portas) : undefined },
      { id: 'STEERING', value_name: vehicle.direcao || undefined },
      { id: 'TRIM', value_name: vehicle.versao || undefined },
    ].filter((a) => a.value_name !== undefined),
    location: {
      address_line: 'Endereço não informado',
      city_id: undefined,
    },
    description: { plain_text: vehicle.descricao || `${vehicle.marca} ${vehicle.modelo}` },
  }
}
