import { montarTituloMLPreview } from '@/lib/ml-title'
import {
  normalizeValue,
  lookupNormalized,
  ML_FUEL_MAP,
  ML_TRANSMISSION_MAP,
  ML_COLOR_MAP,
  ML_STEERING_MAP,
} from '@/lib/ml-normalize'

export function buildMLPayloadPreview(vehicle: any): any {
  const titleResult = montarTituloMLPreview(vehicle)
  const isZeroKm = vehicle.is_zero_km === true
  const condition = isZeroKm ? 'new' : 'used'
  const listingType = vehicle.ml_listing_type || 'gold_special'

  const fotos: string[] = Array.isArray(vehicle.fotos)
    ? vehicle.fotos.filter((u: any) => typeof u === 'string')
    : []

  const attributes = [
    { id: 'BRAND', value_name: vehicle.marca || undefined },
    { id: 'MODEL', value_name: vehicle.modelo || undefined },
    { id: 'VEHICLE_YEAR', value_name: vehicle.ano_modelo ? String(vehicle.ano_modelo) : undefined },
    {
      id: 'KILOMETERS',
      value_struct:
        vehicle.quilometragem != null
          ? { number: Number(vehicle.quilometragem), unit: 'km' }
          : undefined,
    },
    {
      id: 'COLOR',
      value_name: vehicle.cor
        ? (lookupNormalized(vehicle.cor, ML_COLOR_MAP) ?? normalizeValue(vehicle.cor) ?? undefined)
        : undefined,
    },
    {
      id: 'FUEL_TYPE',
      value_name: vehicle.combustivel
        ? (lookupNormalized(vehicle.combustivel, ML_FUEL_MAP) ??
          normalizeValue(vehicle.combustivel) ??
          undefined)
        : undefined,
    },
    {
      id: 'TRANSMISSION',
      value_name: vehicle.cambio
        ? (lookupNormalized(vehicle.cambio, ML_TRANSMISSION_MAP) ??
          normalizeValue(vehicle.cambio) ??
          undefined)
        : undefined,
    },
    { id: 'DOORS', value_name: vehicle.portas ? String(vehicle.portas) : undefined },
    {
      id: 'STEERING',
      value_name: vehicle.direcao
        ? (lookupNormalized(vehicle.direcao, ML_STEERING_MAP) ??
          normalizeValue(vehicle.direcao) ??
          undefined)
        : undefined,
    },
    { id: 'TRIM', value_name: vehicle.versao || undefined },
    { id: 'ITEM_CONDITION', value_name: isZeroKm ? 'Nuevo' : 'Usado' },
  ].filter((a: any) => a.value_name !== undefined || a.value_struct !== undefined)

  return {
    title: titleResult.titulo,
    category_id: 'MLB1744',
    price: Number(vehicle.preco_venda) || 0,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition,
    listing_type_id: listingType,
    channels: ['marketplace'],
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes,
    location: {
      address_line: vehicle.proprietario_logradouro || 'Endereço não informado',
      city: vehicle.proprietario_cidade || undefined,
      state: vehicle.proprietario_estado || undefined,
    },
    description: { plain_text: vehicle.descricao || `${vehicle.marca} ${vehicle.modelo}` },
  }
}
