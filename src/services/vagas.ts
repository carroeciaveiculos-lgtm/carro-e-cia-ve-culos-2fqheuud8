import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Vaga = Database['public']['Tables']['vagas']['Row']
export type VagaInsert = Database['public']['Tables']['vagas']['Insert']
export type VagaUpdate = Database['public']['Tables']['vagas']['Update']

export const listVagasAtivas = async () => {
  const { data, error } = await supabase
    .from('vagas')
    .select('id, titulo')
    .eq('ativa', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const listVagas = async () => {
  const { data, error } = await supabase
    .from('vagas')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const createVaga = async (vaga: VagaInsert) => {
  const { data, error } = await supabase.from('vagas').insert(vaga).select().single()
  return { data, error }
}

export const updateVaga = async (id: string, vaga: VagaUpdate) => {
  const { data, error } = await supabase
    .from('vagas')
    .update({ ...vaga, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteVaga = async (id: string) => {
  const { error } = await supabase.from('vagas').delete().eq('id', id)
  return { error }
}

export const gerarVagaComIA = async (cargo: string, palavrasChave?: string) => {
  const { data, error } = await supabase.functions.invoke('gerar-vaga-ia', {
    body: { cargo, palavrasChave },
  })
  if (error) return { data: null, error }
  return { data: data?.data as { titulo: string; descricao: string }, error: null }
}

export const gerarImagemVaga = async (
  titulo: string,
  opts?: { ajuste?: string; imagemAtualUrl?: string },
) => {
  const { data, error } = await supabase.functions.invoke('gerar-imagem-vaga', {
    body: { titulo, ajuste: opts?.ajuste, imagemAtualUrl: opts?.imagemAtualUrl },
  })
  if (error) return { data: null, error }
  return { data: data?.url as string, error: null }
}

// Cria um post agendado pro agora, reaproveitando a mesma fila que o resto do
// site já usa pra publicar no Facebook/Instagram (tabela social_posts + cron
// que roda publicar-social).
export const postarVagaNasRedes = async (vaga: Vaga) => {
  const texto = `📢 Estamos contratando: ${vaga.titulo}!\n\n${vaga.descricao || ''}\n\nCandidate-se pelo site: carroeciamotors.com.br/trabalhe-conosco`
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      texto,
      imagem: vaga.imagem_url,
      redes: { facebook: true, instagram: true },
      data_agendamento: new Date().toISOString(),
      status: 'Agendado',
      content_type: 'feed',
    })
    .select()
    .single()
  return { data, error }
}
