import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Veiculo = Database['public']['Tables']['veiculos']['Row']

export const getVeiculos = async () => {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getVeiculoById = async (id: string) => {
  const { data, error } = await supabase.from('veiculos').select('*').eq('id', id).single()
  return { data, error }
}

export const createVeiculo = async (
  veiculo: Database['public']['Tables']['veiculos']['Insert'],
) => {
  const { data, error } = await supabase.from('veiculos').insert([veiculo]).select().single()
  return { data, error }
}

export const getContratoByVeiculoId = async (veiculoId: string) => {
  const { data, error } = await supabase
    .from('contratos_consignacao')
    .select('*')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  return { data, error }
}

export const getVeiculosWithoutPhotos = async () => {
  const { data, error } = await supabase
    .from('veiculos')
    .select('id, placa, marca, modelo')
    .or('fotos.is.null,fotos.eq.[]')
    .eq('status', 'disponivel')
  return { data, error }
}

const MAX_RETRIES = 2
const MIN_BATCH_SIZE = 1
const RESOURCE_LIMIT_STATUS = 546

export const triggerDriveSync = async (params?: { offset?: number; limit?: number }) => {
  const limit = Math.min(params?.limit ?? 2, 2)
  let currentLimit = limit
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await supabase.functions.invoke('sync-google-drive', {
      body: { ...params, limit: currentLimit },
    })

    if (!error) {
      return { data, error: null }
    }

    const isResourceLimit =
      (error as any)?.context?.status === RESOURCE_LIMIT_STATUS ||
      (error as any)?.status === RESOURCE_LIMIT_STATUS ||
      String((error as any)?.message ?? '').includes('546') ||
      String((error as any)?.message ?? '')
        .toLowerCase()
        .includes('resource_limit')

    if (isResourceLimit && currentLimit > MIN_BATCH_SIZE) {
      currentLimit = MIN_BATCH_SIZE
      lastError = error
      continue
    }

    if (isResourceLimit) {
      console.warn('sync-google-drive: resource limit reached, stopping sync gracefully')
      return { data: null, error: null }
    }

    return { data, error }
  }

  console.warn('sync-google-drive: exhausted retries due to resource limits, stopping gracefully')
  return { data: null, error: null }
}
