import { supabase } from '@/lib/supabase/client'
import {
  validateVehicleForML,
  generateMLPayloadPreview,
  type VehicleForValidation,
  type MLValidationResult,
} from '@/lib/ml-validation'

export interface DiagnosisVehicle extends VehicleForValidation {
  validation: MLValidationResult
  status: 'ready' | 'pending' | 'blocked'
}

export async function fetchDiagnosisVehicles(): Promise<DiagnosisVehicle[]> {
  const { data, error } = await supabase
    .from('veiculos')
    .select(
      'id, marca, modelo, versao, ano_modelo, combustivel, cambio, descricao, preco_venda, valor_fipe, fotos, is_zero_km, proprietario_cidade, proprietario_estado, ml_listing_type, quilometragem, cor, portas, direcao, cilindrada, final_placa, codigo_fipe, placa',
    )
    .eq('status', 'disponivel')
    .order('created_at', { ascending: false })
    .limit(24)

  if (error || !data) return []

  return (data as unknown as VehicleForValidation[]).map((vehicle) => {
    const validation = validateVehicleForML(vehicle)
    const status =
      validation.blockingErrors.length > 0
        ? 'blocked'
        : validation.qualityAlerts.length > 0
          ? 'pending'
          : 'ready'
    return { ...vehicle, validation, status }
  })
}

export async function generateDryRunPayload(vehicleId: string): Promise<{
  payload: Record<string, any>
  validation: MLValidationResult
  vehicle: VehicleForValidation | null
}> {
  const { data } = await supabase
    .from('veiculos')
    .select(
      'id, marca, modelo, versao, ano_modelo, combustivel, cambio, descricao, preco_venda, valor_fipe, fotos, is_zero_km, proprietario_cidade, proprietario_estado, ml_listing_type, quilometragem, cor, portas, direcao, cilindrada, final_placa, codigo_fipe, placa',
    )
    .eq('id', vehicleId)
    .maybeSingle()

  if (!data)
    return {
      payload: {},
      validation: { success: false, blockingErrors: ['Veículo não encontrado'], qualityAlerts: [] },
      vehicle: null,
    }

  const vehicle = data as unknown as VehicleForValidation
  const validation = validateVehicleForML(vehicle)
  const payload = generateMLPayloadPreview(vehicle)
  return { payload, validation, vehicle }
}

export async function selectiveSync(
  vehicleIds: string[],
  plan: string,
  onProgress?: (index: number, total: number, result: any) => void,
): Promise<{ success: number; failed: number; results: any[] }> {
  const results: any[] = []
  let success = 0
  let failed = 0

  for (let i = 0; i < vehicleIds.length; i++) {
    const vid = vehicleIds[i]
    try {
      if (plan === 'mercadolivre') {
        await supabase.from('veiculos').update({ ml_listing_type: 'gold_premium' }).eq('id', vid)
        await supabase.from('ml_listings').upsert(
          {
            veiculo_id: vid,
            status: 'pending_create',
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'veiculo_id' },
        )
      }

      const { data, error } = await supabase.functions.invoke('ml-sync', {
        method: 'POST',
        body: { veiculo_id: vid },
      })

      if (error) throw error
      results.push({ vehicleId: vid, success: true, data })
      success++
    } catch (err: any) {
      results.push({ vehicleId: vid, success: false, error: err.message })
      failed++
    }

    if (onProgress) onProgress(i + 1, vehicleIds.length, results[results.length - 1])

    if (i < vehicleIds.length - 1) {
      await new Promise((r) => setTimeout(r, 6000))
    }
  }

  return { success, failed, results }
}

export async function fetchBrandMappingReport(): Promise<
  Array<{ marca: string; brand_ml_id: string | null; brand_ml_name: string | null }>
> {
  const { data, error } = await supabase.from('veiculos').select('marca').eq('status', 'disponivel')

  if (error || !data) return []

  const marcas = [...new Set(data.map((v: any) => v.marca).filter(Boolean))]
  const { data: aliases } = await supabase
    .from('ml_brand_aliases')
    .select('brand_crm, brand_ml_id, brand_ml_name')
    .in('brand_crm', marcas)

  const aliasMap = new Map((aliases || []).map((a: any) => [a.brand_crm, a]))

  return marcas.sort().map((marca) => ({
    marca,
    brand_ml_id: aliasMap.get(marca)?.brand_ml_id || null,
    brand_ml_name: aliasMap.get(marca)?.brand_ml_name || null,
  }))
}
