import type { VeiculoSync } from '@/services/plataformas'

export interface PreflightIssue {
  vehicleId: string
  vehicleName: string
  issues: string[]
}

// Espelha as chaves reconhecidas em supabase/functions/_shared/ml-client.ts
// (ML_BODY_TYPE_MAP / ML_FUEL_MAP / ML_COLOR_MAP / ML_TRANSMISSION_MAP).
// Objetivo aqui não é traduzir pro nome que o ML espera (isso é papel do
// ml-client.ts no backend) — é so avisar ANTES de tentar sincronizar quando
// o valor cadastrado não é nenhum dos que o sistema sabe traduzir, porque aí
// a sincronização vai falhar. Achado real (12/08/2026): o veículo Honda City
// tinha categoria='carro', um valor que não bate com nenhuma chave aqui, e
// só descobrimos isso lendo o log de erro depois da tentativa falhar. Se uma
// categoria/combustível/cor/câmbio nova for aceita no cadastro (VehicleFormModal),
// atualize as duas listas (aqui e em ml-client.ts) juntas.
const CATEGORIAS_ML_VALIDAS = ['suv', 'picape', 'hatch', 'sedan', 'van', 'esportivo']
const COMBUSTIVEIS_ML_VALIDOS = ['flex', 'gasolina', 'diesel', 'alcool', 'hibrido', 'eletrico']
const CORES_ML_VALIDAS = [
  'branco', 'preto', 'prata', 'vermelho', 'azul', 'verde', 'amarelo', 'cinza',
  'marrom', 'bege', 'dourado', 'vinho',
]
const CAMBIOS_ML_VALIDOS = ['manual', 'automatico', 'automatica', 'automatizada', 'cvt']

function normaliza(v: string | null | undefined): string {
  return (v || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

  if (!vehicle.combustivel) {
    issues.push('Combustível não informado')
  } else if (!COMBUSTIVEIS_ML_VALIDOS.includes(normaliza(vehicle.combustivel))) {
    issues.push(
      `Combustível '${vehicle.combustivel}' não é reconhecido pelo Mercado Livre — a sincronização vai falhar`,
    )
  }

  if (!vehicle.cambio) {
    issues.push('Câmbio não informado')
  } else if (!CAMBIOS_ML_VALIDOS.includes(normaliza(vehicle.cambio))) {
    issues.push(
      `Câmbio '${vehicle.cambio}' não é reconhecido pelo Mercado Livre — a sincronização vai falhar`,
    )
  }

  if (!vehicle.cor) {
    issues.push('Cor não informada')
  } else if (!CORES_ML_VALIDAS.includes(normaliza(vehicle.cor))) {
    issues.push(
      `Cor '${vehicle.cor}' não é reconhecida pelo Mercado Livre — a sincronização vai falhar`,
    )
  }

  if (!vehicle.categoria) {
    issues.push('Categoria não informada')
  } else if (!CATEGORIAS_ML_VALIDAS.includes(normaliza(vehicle.categoria))) {
    issues.push(
      `Categoria '${vehicle.categoria}' não é reconhecida pelo Mercado Livre (aceitas: Hatch, Sedan, SUV, Picape, Esportivo, Van) — a sincronização vai falhar`,
    )
  }

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
