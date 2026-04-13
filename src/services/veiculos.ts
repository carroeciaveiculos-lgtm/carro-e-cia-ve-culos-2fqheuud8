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
