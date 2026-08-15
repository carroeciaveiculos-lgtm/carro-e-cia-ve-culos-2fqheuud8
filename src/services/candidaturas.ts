import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Candidatura = Database['public']['Tables']['candidaturas']['Row']

export interface CandidaturaFormInput {
  nome: string
  telefone: string
  email: string
  informacoesAdicionais?: string
  curriculo: File
  vagaId?: string
}

export const enviarCandidatura = async (input: CandidaturaFormInput) => {
  const formData = new FormData()
  formData.append('nome', input.nome)
  formData.append('telefone', input.telefone)
  formData.append('email', input.email)
  formData.append('informacoes_adicionais', input.informacoesAdicionais || '')
  formData.append('curriculo', input.curriculo)
  if (input.vagaId) formData.append('vaga_id', input.vagaId)

  const { data, error } = await supabase.functions.invoke('enviar-candidatura', {
    body: formData,
  })
  return { data, error }
}

export const listCandidaturas = async () => {
  const { data, error } = await supabase
    .from('candidaturas')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateCandidaturaStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('candidaturas').update({ status }).eq('id', id)
  return { error }
}
