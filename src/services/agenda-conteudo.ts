import { supabase } from '@/lib/supabase/client'

export interface AgendaItem {
  id: string
  tema: string
  palavra_chave_principal: string | null
  status: string
  data_programada: string | null
  artigo_id: string | null
  created_at: string
  updated_at: string
}

export async function fetchAgenda(): Promise<AgendaItem[]> {
  const { data, error } = await supabase
    .from('agenda_conteudo')
    .select('*')
    .order('data_programada', { ascending: true })
  if (error) throw error
  return (data || []) as AgendaItem[]
}

export async function createAgendaItem(item: Partial<AgendaItem>): Promise<AgendaItem> {
  const { data, error } = await supabase.from('agenda_conteudo').insert(item).select().single()
  if (error) throw error
  return data as AgendaItem
}

export async function updateAgendaItem(
  id: string,
  updates: Partial<AgendaItem>,
): Promise<AgendaItem> {
  const { data, error } = await supabase
    .from('agenda_conteudo')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as AgendaItem
}

export async function deleteAgendaItem(id: string): Promise<void> {
  const { error } = await supabase.from('agenda_conteudo').delete().eq('id', id)
  if (error) throw error
}

export async function generateArticleFromAgenda(agendaId: string): Promise<any> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')

  const { data: item } = await supabase
    .from('agenda_conteudo')
    .select('*')
    .eq('id', agendaId)
    .single()

  if (!item) throw new Error('Item não encontrado')

  await supabase.from('agenda_conteudo').update({ status: 'Em Produção' }).eq('id', agendaId)

  const { data, error } = await supabase.functions.invoke('gerar-conteudo', {
    body: {
      is_seo_agent: true,
      tema: item.tema,
      palavraChave: item.palavra_chave_principal || item.tema,
      agenda_id: agendaId,
    },
  })

  if (error) throw error
  return data
}

export async function fetchInteracoes(artigoId?: string): Promise<any[]> {
  let query = supabase
    .from('agente_interacoes')
    .select('*')
    .order('created_at', { ascending: false })
  if (artigoId) {
    query = query.eq('contexto_artigo_id', artigoId)
  }
  const { data, error } = await query.limit(50)
  if (error) throw error
  return data || []
}
