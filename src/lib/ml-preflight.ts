import type { VeiculoSync } from '@/services/plataformas'

export interface PreflightIssue {
  vehicleId: string
  vehicleName: string
  issues: string[]
}

export function validateMLPreflight(vehicle: VeiculoSync): string[] {
  const issues: string[] = []

  if (!vehicle.preco_venda || vehicle.preco_venda <= 0) {
    issues.push('Preço de venda não definido ou zerado')
  }

  if (!vehicle.descricao || vehicle.descricao.trim().length < 50) {
    issues.push('Descrição muito curta (mínimo 50 caracteres)')
  }

  if (!vehicle.marca) issues.push('Marca não informada')
  if (!vehicle.modelo) issues.push('Modelo não informado')
  if (!vehicle.ano_modelo) issues.push('Ano do modelo não informado')
  if (vehicle.quilometragem == null) issues.push('Quilometragem não informada')
  if (!vehicle.combustivel) issues.push('Combustível não informado')
  if (!vehicle.cambio) issues.push('Câmbio não informado')
  if (!vehicle.cor) issues.push('Cor não informada')
  if (!vehicle.versao) issues.push('Versão não informada')
  if (!vehicle.direcao) issues.push('Direção não informada')
  if (!vehicle.cilindrada) issues.push('Cilindrada não informada')

  if (!vehicle.fotos || vehicle.fotos.length === 0) {
    issues.push('Nenhuma foto cadastrada (mínimo 1)')
  }

  return issues
}

export function validateVehiclesForML(vehicles: VeiculoSync[]): PreflightIssue[] {
  return vehicles
    .map((v) => ({
      vehicleId: v.id,
      vehicleName: `${v.marca} ${v.modelo}`,
      issues: validateMLPreflight(v),
    }))
    .filter((v) => v.issues.length > 0)
}
