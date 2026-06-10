import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type ContratoConsignacao = Database['public']['Tables']['contratos_consignacao']['Row']

export const getContratoByVeiculoId = async (veiculoId: string) => {
  const { data, error } = await supabase
    .from('contratos_consignacao')
    .select('*')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  return { data, error }
}

export const getContratos = async () => {
  const { data, error } = await supabase
    .from('contratos_consignacao')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}
