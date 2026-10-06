import { supabase } from '@/lib/supabase/client'
import { agendarPost, horarioDeAprovacao } from '@/services/social-posts'

// Esteira de postagens (05/10/2026): cria UM item por vez (veículo + tipo) na aba Aprovações, com os
// rascunhos de Instagram e Facebook juntos. Nunca aprova sozinha. Tabelas esteira_config e
// social_esteira (ainda não estão em lib/supabase/types.ts, por isso o cliente é tratado como genérico).
const db = supabase as unknown as { from: (tabela: string) => any }

export type EsteiraConfig = { ativa: boolean; posts_por_dia: number; horarios: string }

export type ItemEsteira = {
  id: string
  veiculo_id: string
  tipo: 'carrossel' | 'video'
  ordem: number
  estado: 'fila' | 'em_aprovacao' | 'concluido' | 'pulado' | 'bloqueado'
  motivo: string | null
  post_ids: string[]
  veiculos?: {
    marca: string | null
    modelo: string | null
    placa: string | null
    versao: string | null
  } | null
}

export type PostDoItem = { id: string; rede: string | null; status: string }

export type PainelEsteira = {
  config: EsteiraConfig
  contagem: Record<ItemEsteira['estado'], number>
  atual: (ItemEsteira & { posts: PostDoItem[] }) | null
  proximos: ItemEsteira[]
  bloqueados: ItemEsteira[]
}

const SELECT_ITEM = '*, veiculos(marca, modelo, placa, versao)'

export const nomeDoItem = (i: ItemEsteira) =>
  [i.veiculos?.marca, i.veiculos?.modelo, i.veiculos?.versao].filter(Boolean).join(' ') || 'Veículo'

export const rotuloTipo = (t: ItemEsteira['tipo']) =>
  t === 'carrossel' ? 'Carrossel de fotos' : 'Vídeo'

export async function obterPainel(): Promise<{ data: PainelEsteira | null; erro: string | null }> {
  const { data: cfg, error: erroCfg } = await db
    .from('esteira_config')
    .select('ativa, posts_por_dia, horarios')
    .eq('id', 1)
    .maybeSingle()
  if (erroCfg || !cfg) return { data: null, erro: erroCfg?.message ?? 'Esteira não configurada.' }

  const { data: todos, error } = await db
    .from('social_esteira')
    .select(SELECT_ITEM)
    .order('ordem', { ascending: true })
    .limit(500)
  if (error) return { data: null, erro: error.message }
  const itens = (todos ?? []) as ItemEsteira[]

  const contagem = { fila: 0, em_aprovacao: 0, concluido: 0, pulado: 0, bloqueado: 0 }
  for (const i of itens) contagem[i.estado]++

  const emAprovacao = itens.find((i) => i.estado === 'em_aprovacao') ?? null
  let atual: PainelEsteira['atual'] = null
  if (emAprovacao) {
    const { data: posts } = await db
      .from('social_posts')
      .select('id, rede, status')
      .in('id', emAprovacao.post_ids)
    atual = { ...emAprovacao, posts: (posts ?? []) as PostDoItem[] }
  }
  return {
    data: {
      config: cfg as EsteiraConfig,
      contagem,
      atual,
      proximos: itens.filter((i) => i.estado === 'fila').slice(0, 6),
      bloqueados: itens.filter((i) => i.estado === 'bloqueado'),
    },
    erro: null,
  }
}

export async function definirAtiva(ativa: boolean): Promise<{ erro: string | null }> {
  const { error } = await db
    .from('esteira_config')
    .update({ ativa, atualizado_em: new Date().toISOString() })
    .eq('id', 1)
  return { erro: error?.message ?? null }
}

// Pede à Edge Function o próximo item (ou pula o atual). Devolve a frase de erro em português.
export async function chamarEsteira(
  acao: 'proximo' | 'pular' = 'proximo',
  itemId?: string,
): Promise<{ erro: string | null; resposta?: { acao?: string; erro?: string } }> {
  const { data, error } = await supabase.functions.invoke('esteira-proximo-post', {
    body: { acao, item_id: itemId },
  })
  if (error) {
    try {
      const corpo = await (error as { context?: Response }).context?.json()
      if (corpo?.error) return { erro: String(corpo.error) }
    } catch {
      /* usa a mensagem genérica abaixo */
    }
    return { erro: 'Não foi possível falar com a esteira. Tente de novo.' }
  }
  if (data?.error) return { erro: String(data.error) }
  return { erro: null, resposta: data }
}

// Aprova os rascunhos do item (Instagram + Facebook) num MESMO horário livre comum às duas redes
export async function aprovarItem(
  posts: PostDoItem[],
): Promise<{ erro: string | null; horario?: Date; aprovados: number }> {
  const pendentes = posts.filter((p) => p.status === 'Rascunho')
  if (pendentes.length === 0) return { erro: null, aprovados: 0 }
  const redes = Array.from(new Set(pendentes.map((p) => p.rede).filter((r): r is string => !!r)))
  const horario = await horarioDeAprovacao(redes)
  for (const p of pendentes) {
    const { erro } = await agendarPost(p.id, { horario })
    if (erro) return { erro, aprovados: 0 }
  }
  return { erro: null, horario, aprovados: pendentes.length }
}
