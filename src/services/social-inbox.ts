import { supabase } from '@/lib/supabase/client'

// Central de Mensagens (04/10/2026): direct do Instagram e Messenger do Facebook, SEPARADOS do CRM de
// leads da Clara (que é só de WhatsApp). Tabelas social_conversas / social_mensagens.
// (Ainda não estão em lib/supabase/types.ts, por isso o cliente é tratado como genérico aqui.)
const db = supabase as unknown as { from: (tabela: string) => any }

export const JANELA_RESPOSTA_HORAS = 24

export type Conversa = {
  id: string
  plataforma: 'instagram' | 'facebook'
  contato_id: string
  contato_nome: string | null
  ultima_mensagem: string | null
  ultima_mensagem_em: string
  ultima_do_cliente_em: string | null
  nao_lidas: number
  status: 'aberta' | 'resolvida'
}

export type Mensagem = {
  id: string
  conversa_id: string
  direcao: 'entrada' | 'saida'
  origem: 'cliente' | 'equipe_app' | 'painel'
  texto: string
  criado_em: string
}

export const nomeDaConversa = (c: Pick<Conversa, 'contato_nome' | 'contato_id' | 'plataforma'>) =>
  c.contato_nome ||
  `Cliente ${c.plataforma === 'instagram' ? 'Instagram' : 'Facebook'} ···${c.contato_id.slice(-4)}`

// Milissegundos que ainda restam para responder (<= 0: a Meta não aceita mais resposta por aqui)
export const msRestantesParaResponder = (
  c: Pick<Conversa, 'ultima_do_cliente_em'>,
  agora = Date.now(),
) => {
  if (!c.ultima_do_cliente_em) return 0
  return new Date(c.ultima_do_cliente_em).getTime() + JANELA_RESPOSTA_HORAS * 3_600_000 - agora
}

export const listarConversas = async (status: 'aberta' | 'resolvida' | 'todas') => {
  let q = db
    .from('social_conversas')
    .select('*')
    .order('ultima_mensagem_em', { ascending: false })
    .limit(200)
  if (status !== 'todas') q = q.eq('status', status)
  const { data, error } = await q
  return { data: (data ?? []) as Conversa[], error }
}

export const listarMensagens = async (conversaId: string) => {
  const { data, error } = await db
    .from('social_mensagens')
    .select('*')
    .eq('conversa_id', conversaId)
    .order('criado_em', { ascending: true })
    .limit(500)
  return { data: (data ?? []) as Mensagem[], error }
}

export const marcarComoLida = async (conversaId: string) => {
  const { error } = await db.from('social_conversas').update({ nao_lidas: 0 }).eq('id', conversaId)
  return { error }
}

export const definirStatusConversa = async (conversaId: string, status: 'aberta' | 'resolvida') => {
  const { error } = await db.from('social_conversas').update({ status }).eq('id', conversaId)
  return { error }
}

// Total de mensagens de clientes ainda sem resposta (selo da aba "Mensagens")
export const contarNaoLidas = async () => {
  const { data } = await db
    .from('social_conversas')
    .select('nao_lidas')
    .gt('nao_lidas', 0)
    .limit(500)
  return ((data ?? []) as { nao_lidas: number }[]).reduce((soma, c) => soma + c.nao_lidas, 0)
}

// Envia a resposta pela Meta (Edge Function social-mensagens). Devolve a frase de erro já em português.
export const enviarResposta = async (
  conversaId: string,
  texto: string,
): Promise<{ erro: string | null }> => {
  const { data, error } = await supabase.functions.invoke('social-mensagens', {
    body: { conversa_id: conversaId, texto },
  })
  if (error) {
    // Respostas 4xx/5xx da function chegam como erro: o texto amigável vem no corpo
    try {
      const corpo = await (error as { context?: Response }).context?.json()
      if (corpo?.error) return { erro: String(corpo.error) }
    } catch {
      /* usa a mensagem genérica abaixo */
    }
    return { erro: 'Não foi possível enviar a mensagem. Tente de novo.' }
  }
  if (data?.error) return { erro: String(data.error) }
  return { erro: null }
}
