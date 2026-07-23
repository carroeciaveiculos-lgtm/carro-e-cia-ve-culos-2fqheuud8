import { supabase } from '@/lib/supabase/client'
import { validateVehicleForML, type MLValidationResult } from '@/lib/ml-validation'

export interface DiagnosisVehicle {
  id: string
  marca: string
  modelo: string
  versao: string | null
  ano_modelo: number | null
  placa: string | null
  preco_venda: number | null
  valor_fipe: number | null
  fotos: string[] | null
  descricao: string | null
  is_zero_km: boolean | null
  proprietario_cidade: string | null
  proprietario_estado: string | null
  combustivel: string | null
  cambio: string | null
  cor: string | null
  quilometragem: number | null
  direcao: string | null
  cilindrada: string | null
  ml_listing_type: string | null
  status: 'ready' | 'pending' | 'blocked'
  validation: MLValidationResult
}

const DIAGNOSIS_FIELDS = `
  id, marca, modelo, versao, ano_modelo, placa, preco_venda, valor_fipe,
  fotos, descricao, is_zero_km, proprietario_cidade, proprietario_estado,
  combustivel, cambio, cor, quilometragem, direcao, cilindrada, ml_listing_type
`

export async function fetchDiagnosisVehicles(): Promise<DiagnosisVehicle[]> {
  const { data, error } = await supabase
    .from('veiculos')
    .select(DIAGNOSIS_FIELDS)
    .eq('status', 'disponivel')
    .order('created_at', { ascending: false })
    .limit(24)

  if (error || !data) return []

  const results = await Promise.all(
    data.map(async (v) => {
      const validation = await validateVehicleForML(v as any)
      let status: 'ready' | 'pending' | 'blocked' = 'ready'
      if (validation.blockingErrors.length > 0) status = 'blocked'
      else if (validation.qualityAlerts.length > 0) status = 'pending'
      return {
        ...v,
        fotos: Array.isArray(v.fotos) ? v.fotos : [],
        status,
        validation,
      } as DiagnosisVehicle
    }),
  )

  return results
}
