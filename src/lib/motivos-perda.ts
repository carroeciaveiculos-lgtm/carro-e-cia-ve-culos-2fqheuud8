import { supabase } from '@/lib/supabase/client'

// Motivos padrão do sistema — fixos, não editáveis (pedido da Adriana,
// 15/09/2026). Motivos personalizados ficam na tabela
// motivos_perda_personalizados, gerenciados na tela de Cadastro do CRM.
export const MOTIVOS_PERDA_PADRAO = [
  'Preço elevado',
  'Comprou na concorrência',
  'Sem interesse',
  'Sem condição financeira',
  'Veículo indisponível',
  'Contato perdido / não responde',
  'Desistiu',
  'Outro',
]

export interface MotivoPersonalizado {
  id: string
  nome: string
  ativo: boolean
}

export async function fetchMotivosPersonalizados(): Promise<MotivoPersonalizado[]> {
  const { data, error } = await supabase
    .from('motivos_perda_personalizados')
    .select('id, nome, ativo')
    .order('nome')
  if (error) return []
  return data || []
}

// Lista combinada (padrão + personalizados ativos) pra exibir num seletor.
export async function fetchTodosMotivosPerdaAtivos(): Promise<string[]> {
  const personalizados = await fetchMotivosPersonalizados()
  return [...MOTIVOS_PERDA_PADRAO, ...personalizados.filter((m) => m.ativo).map((m) => m.nome)]
}
