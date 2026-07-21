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

export const triggerDriveSync = async (limit?: number) => {
  const { data, error } = await supabase.functions.invoke('sync-google-drive', {
    body: limit ? { limit } : {},
  })
  return { data, error }
}
