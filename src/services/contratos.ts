import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Contrato = Database['public']['Tables']['contratos_consignacao']['Row']

export const getContratoByVeiculoId = async (veiculoId: string) => {
  const { data, error } = await supabase
    .from('contratos_consignacao')
    .select('*')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  return { data, error }
}
