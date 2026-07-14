export interface QualityScoreResult {
  score: number
  isReady: boolean
  missingItems: string[]
  breakdown: {
    photos: number
    basicInfo: number
    description: number
    techSpecs: number
  }
}

export function calculateAdQualityScore(vehicle: {
  fotos?: string[] | null
  ano_modelo?: number | null
  ano_fabricacao?: number | null
  quilometragem?: number | null
  preco_venda?: number | null
  cor?: string | null
  combustivel?: string | null
  placa?: string | null
  descricao?: string | null
  cilindrada?: string | null
  cambio?: string | null
  portas?: number | null
  direcao?: string | null
  versao?: string | null
}): QualityScoreResult {
  const missingItems: string[] = []
  const photoCount = Array.isArray(vehicle.fotos) ? vehicle.fotos.length : 0
  const photos = photoCount >= 18 ? 40 : Math.round((photoCount / 18) * 40)
  if (photoCount < 18) missingItems.push(`${photoCount}/18 fotos do roteiro`)

  let basicInfo = 0
  if (vehicle.ano_modelo || vehicle.ano_fabricacao) basicInfo += 5
  else missingItems.push('Ano')
  if (vehicle.quilometragem !== null && vehicle.quilometragem !== undefined) basicInfo += 5
  else missingItems.push('KM')
  if (vehicle.placa) basicInfo += 5
  else missingItems.push('Placa')
  if (vehicle.preco_venda) basicInfo += 5
  else missingItems.push('Preço')
  if (vehicle.cor) basicInfo += 5
  else missingItems.push('Cor')
  if (vehicle.combustivel) basicInfo += 5
  else missingItems.push('Combustível')

  let description = 0
  if (vehicle.descricao && vehicle.descricao.length > 100) description = 20
  else if (vehicle.descricao && vehicle.descricao.length > 0) description = 10
  else missingItems.push('Descrição')

  let techSpecs = 0
  if (vehicle.cilindrada) techSpecs += 2.5
  else missingItems.push('Cilindrada')
  if (vehicle.cambio) techSpecs += 2.5
  else missingItems.push('Câmbio')
  if (vehicle.direcao) techSpecs += 2.5
  else missingItems.push('Direção')
  if (vehicle.versao) techSpecs += 2.5
  else missingItems.push('Versão')

  const score = Math.round(photos + basicInfo + description + techSpecs)
  return {
    score,
    isReady: score === 100,
    missingItems,
    breakdown: { photos, basicInfo, description, techSpecs: Math.round(techSpecs) },
  }
}

export function getQualityColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 41) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function getQualityTextColor(score: number): string {
  if (score >= 80) return 'text-green-700'
  if (score >= 41) return 'text-yellow-700'
  return 'text-red-700'
}

export function getQualityLabel(score: number): string {
  if (score >= 80) return 'Alta Qualidade'
  if (score >= 41) return 'Qualidade Média'
  return 'Baixa Qualidade'
}
