import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Lead = Database['public']['Tables']['leads']['Row']

export const getLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const createLead = async (lead: Database['public']['Tables']['leads']['Insert']) => {
  const { data, error } = await supabase.from('leads').insert([lead]).select().single()

  if (data && !error) {
    // Alerta interno
    supabase.functions
      .invoke('send-lead-email', {
        body: {
          nome: data.nome,
          telefone: data.telefone,
          email: data.email,
          mensagem: data.observacoes,
          origem: data.origem,
          veiculo: data.veiculo_interesse,
        },
      })
      .catch(console.error)

    // Dispara gatilho do CRM (Boas-vindas e Brevo)
    supabase.functions.invoke('on-lead-created', { body: data }).catch(console.error)
  }

  return { data, error }
}

export const updateLeadStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}
