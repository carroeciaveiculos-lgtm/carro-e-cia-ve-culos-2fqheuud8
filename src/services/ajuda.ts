import { supabase } from '@/lib/supabase/client'

export interface AjudaConteudo {
  id: string
  categoria: string
  titulo: string
  o_que_e: string | null
  dependencias: string | null
  para_que_serve: string | null
  caminho: string | null
  quando_utilizar: string | null
  como_utilizar: string | null
  is_faq: boolean
  setor_id: string | null
}

export type AjudaConteudoInput = Omit<AjudaConteudo, 'id'>

export const listAjudaConteudos = async () => {
  const { data, error } = await supabase.from('ajuda_conteudos').select('*').order('titulo')
  return { data: (data as AjudaConteudo[]) || [], error }
}

export const criarAjudaConteudo = async (payload: AjudaConteudoInput) => {
  const { data, error } = await supabase.from('ajuda_conteudos').insert(payload).select().single()
  return { data: data as AjudaConteudo | null, error }
}

export const atualizarAjudaConteudo = async (
  id: string,
  payload: Partial<AjudaConteudoInput>,
) => {
  const { data, error } = await supabase
    .from('ajuda_conteudos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data: data as AjudaConteudo | null, error }
}

export const apagarAjudaConteudo = async (id: string) => {
  const { error } = await supabase.from('ajuda_conteudos').delete().eq('id', id)
  return { error }
}
