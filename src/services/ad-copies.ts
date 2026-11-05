import { supabase } from '@/lib/supabase/client'
import type { CanalAnuncio, TipoAnuncio } from '@/lib/ad-limites'

// Toda a conversa do Criador de Anúncios com o Supabase mora aqui. As funções devolvem
// { data, error } e NÃO lançam exceção — quem chama trata o error.
//
// A tabela `ad_copies` é nova (migration 20261105223858_ad_copies.sql) e ainda não está em
// `src/lib/supabase/types.ts`. Depois de aplicar a migration, regenerar os tipos e trocar o
// `tabela()` abaixo por `supabase.from('ad_copies')` tipado.

export type StatusAdCopy = 'rascunho' | 'aprovado' | 'descartado'

// Uma variação devolvida pela IA. Só os campos do canal pedido vêm preenchidos.
export interface VariacaoAnuncio {
  texto_principal?: string
  titulo?: string
  descricao?: string
  cta?: string
  cartoes?: { titulo: string }[]
  titulos?: string[]
  descricoes?: string[]
  legenda?: string
  hashtags?: string[]
  observacoes?: string
}

export interface AdCopy {
  id: string
  veiculo_id: string | null
  produto: string
  canal: CanalAnuncio
  tipo_anuncio: TipoAnuncio | null
  tom: string | null
  publico: string | null
  conteudo: VariacaoAnuncio
  fotos_selecionadas: string[]
  video_url: string | null
  status: StatusAdCopy
  criado_em: string
}

export interface PedidoAnuncio {
  veiculo_id?: string
  canal: CanalAnuncio
  tipo_anuncio?: TipoAnuncio
  num_cartoes?: number
  product: string
  audience: string
  tone: string
}

export interface RespostaAnuncio {
  variations: VariacaoAnuncio[]
  avisos?: string[]
}

const tabela = () => (supabase as any).from('ad_copies')

// Quando a function responde com erro, o supabase-js esconde a mensagem em `context`.
// Tenta ler o texto em português que a function mandou; se não der, usa o erro padrão.
const mensagemDaFunction = async (error: any): Promise<string> => {
  try {
    const corpo = await error?.context?.json?.()
    if (corpo?.error) return String(corpo.error)
  } catch {
    // corpo ilegível: cai na mensagem padrão abaixo
  }
  return error?.message || 'Não foi possível gerar o anúncio'
}

export const gerarAnuncio = async (pedido: PedidoAnuncio) => {
  const { data, error } = await supabase.functions.invoke('ad-copy-generator', { body: pedido })
  if (error) return { data: null, error: new Error(await mensagemDaFunction(error)) }
  if (data?.error) return { data: null, error: new Error(String(data.error)) }
  return { data: (data?.data ?? null) as RespostaAnuncio | null, error: null }
}

// Lista leve do estoque para o seletor (sem carregar fotos nem descrição de todo mundo).
export const listarVeiculosParaAnuncio = async () => {
  const { data, error } = await supabase
    .from('veiculos')
    .select('id, marca, modelo, versao, ano_modelo, placa, preco_venda')
    .eq('status', 'disponivel')
    .order('marca', { ascending: true })
    .order('modelo', { ascending: true })
  return { data, error }
}

export interface NovoAdCopy {
  veiculo_id: string | null
  produto: string
  canal: CanalAnuncio
  tipo_anuncio: TipoAnuncio | null
  tom: string
  publico: string
  conteudo: VariacaoAnuncio
  fotos_selecionadas: string[]
  video_url: string | null
}

export const salvarAdCopy = async (novo: NovoAdCopy) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await tabela()
    .insert({ ...novo, criado_por: user?.id ?? null })
    .select()
    .single()
  return { data: data as AdCopy | null, error }
}

export const listarAdCopies = async (veiculoId: string) => {
  const { data, error } = await tabela()
    .select('*')
    .eq('veiculo_id', veiculoId)
    .order('criado_em', { ascending: false })
  return { data: (data ?? []) as AdCopy[], error }
}

export const atualizarStatusAdCopy = async (id: string, status: StatusAdCopy) => {
  const { error } = await tabela()
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { error }
}
