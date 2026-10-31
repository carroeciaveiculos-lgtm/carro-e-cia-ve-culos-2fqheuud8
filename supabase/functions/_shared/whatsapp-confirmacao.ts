import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

interface CtxConfirmacao {
  supabase: SupabaseClient
  fromPhone: string
}

// Pedido que o handler monta ao "preparar" um comando que altera algo.
// `alvo` ja leva tudo resolvido (ids, nomes, valores) -- o "sim" executa
// exatamente o que foi mostrado, sem reinterpretar o texto.
export interface PedidoConfirmacao {
  comando: string
  alvo: Record<string, unknown>
  resumo: string
  pergunta: string
}

export type Preparo = { resposta: string } | { pedido: PedidoConfirmacao }

export interface Pendente {
  id: string
  tipo: 'confirmacao' | 'lista'
  comando: string | null
  alvo: Record<string, any>
  resumo: string | null
}

export const VALIDADE_MINUTOS = 10

// Chave do telefone = ultimos 8 digitos. O wa_id da Meta as vezes chega sem o
// 9o digito (achado 12/09/2026), entao o numero inteiro nao serve de chave.
function chaveTelefone(fromPhone: string): string {
  return (fromPhone || '').replace(/\D/g, '').slice(-8)
}

// Um pedido pendente por telefone: salvar um novo cancela o anterior do mesmo tipo.
export async function salvarPendente(
  ctx: CtxConfirmacao,
  tipo: 'confirmacao' | 'lista',
  comando: string,
  alvo: Record<string, unknown>,
  resumo: string,
): Promise<boolean> {
  const telefone = chaveTelefone(ctx.fromPhone)
  await ctx.supabase
    .from('comandos_pendentes_whatsapp')
    .update({ status: 'cancelado' })
    .eq('telefone', telefone)
    .eq('tipo', tipo)
    .eq('status', 'pendente')

  const { error } = await ctx.supabase.from('comandos_pendentes_whatsapp').insert({
    telefone,
    tipo,
    comando,
    alvo,
    resumo,
    expira_em: new Date(Date.now() + VALIDADE_MINUTOS * 60 * 1000).toISOString(),
  })
  return !error
}

export async function buscarPendente(
  ctx: CtxConfirmacao,
  tipo: 'confirmacao' | 'lista',
): Promise<Pendente | null> {
  const telefone = chaveTelefone(ctx.fromPhone)
  const agora = new Date().toISOString()

  // Marca como expirado o que passou da validade (limpeza preguicosa).
  await ctx.supabase
    .from('comandos_pendentes_whatsapp')
    .update({ status: 'expirado' })
    .eq('telefone', telefone)
    .eq('tipo', tipo)
    .eq('status', 'pendente')
    .lte('expira_em', agora)

  const { data } = await ctx.supabase
    .from('comandos_pendentes_whatsapp')
    .select('id, tipo, comando, alvo, resumo')
    .eq('telefone', telefone)
    .eq('tipo', tipo)
    .eq('status', 'pendente')
    .gt('expira_em', agora)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as Pendente | null) ?? null
}

// Uso unico: so devolve true pra UMA chamada. Um "sim" repetido (ou duas
// mensagens chegando juntas) nao executa duas vezes -- o UPDATE condicional
// e a trava, feita ANTES de executar a acao.
export async function consumirPendente(ctx: CtxConfirmacao, id: string): Promise<boolean> {
  const { data } = await ctx.supabase
    .from('comandos_pendentes_whatsapp')
    .update({ status: 'usado' })
    .eq('id', id)
    .eq('status', 'pendente')
    .gt('expira_em', new Date().toISOString())
    .select('id')
  return Array.isArray(data) && data.length === 1
}

export async function cancelarPendente(ctx: CtxConfirmacao, id: string): Promise<void> {
  await ctx.supabase
    .from('comandos_pendentes_whatsapp')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .eq('status', 'pendente')
}
