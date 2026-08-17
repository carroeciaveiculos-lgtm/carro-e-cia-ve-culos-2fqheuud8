import { supabase } from '@/lib/supabase/client'

export interface Setor {
  id: string
  nome: string
  ativo: boolean
}

export const listSetores = async () => {
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  return { data: (data as Setor[]) || [], error }
}

export const criarSetor = async (nome: string) => {
  const { data, error } = await supabase.from('setores').insert({ nome }).select().single()
  return { data: data as Setor | null, error }
}

export const listSetorIdsDoUsuario = async (usuarioId: string) => {
  const { data, error } = await supabase
    .from('usuario_setores')
    .select('setor_id')
    .eq('usuario_id', usuarioId)
  return { data: (data || []).map((r: any) => r.setor_id as string), error }
}

export const salvarSetoresDoUsuario = async (usuarioId: string, setorIds: string[]) => {
  const { error: delError } = await supabase
    .from('usuario_setores')
    .delete()
    .eq('usuario_id', usuarioId)
  if (delError) return { error: delError }
  if (setorIds.length === 0) return { error: null }
  const { error } = await supabase
    .from('usuario_setores')
    .insert(setorIds.map((setor_id) => ({ usuario_id: usuarioId, setor_id })))
  return { error }
}
