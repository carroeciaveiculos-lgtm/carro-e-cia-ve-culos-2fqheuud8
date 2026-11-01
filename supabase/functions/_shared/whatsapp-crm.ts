import { createClient } from 'jsr:@supabase/supabase-js@2'
import { VALIDADE_MINUTOS, type Preparo } from './whatsapp-confirmacao.ts'

type SupabaseClient = ReturnType<typeof createClient>

export interface CommandContext {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseServiceKey: string
  waToken: string
  waPhoneId: string
  fromPhone: string
}

export async function handleLeads(ctx: CommandContext): Promise<string> {
  const { data, error } = await ctx.supabase
    .from('leads')
    .select('nome, origem, veiculo_interesse, status')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !data || data.length === 0) return '❌ Nenhum lead encontrado.'

  const list = data
    .map(
      (l, i) =>
        `${i + 1}. *${l.nome}*\n   Origem: ${l.origem || 'N/A'}\n   Interesse: ${l.veiculo_interesse || 'N/A'}\n   Status: ${l.status || 'N/A'}`,
    )
    .join('\n\n')

  return `📋 *5 Leads Mais Recentes:*\n\n${list}`
}

export async function handleQuentes(ctx: CommandContext): Promise<string> {
  const { data, error } = await ctx.supabase
    .from('leads')
    .select('nome, telefone, veiculo_interesse, temperatura, ai_score')
    // Achado 19/08/2026: filtro tinha 'Quente' maiúsculo, mas o valor real
    // salvo (ver ai-sdr, atualizar_estagio_lead) sempre é minúsculo — nunca
    // batia com nenhum lead.
    .or('temperatura.eq.quente,ai_score.gte.70')
    .order('ai_score', { ascending: false, nullsFirst: false })
    .limit(10)

  if (error || !data || data.length === 0) return '❌ Nenhum lead quente encontrado no momento.'

  const list = data
    .map(
      (l, i) =>
        `${i + 1}. *${l.nome}*\n   📞 ${l.telefone || 'N/A'}\n   Interesse: ${l.veiculo_interesse || 'N/A'}\n   Temp: ${l.temperatura || 'N/A'} | Score: ${l.ai_score || 0}`,
    )
    .join('\n\n')

  return `🔥 *Leads Quentes:*\n\n${list}`
}

export async function handleHoje(ctx: CommandContext): Promise<string> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await ctx.supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday)

  if (error) return '❌ Erro ao buscar leads de hoje.'

  return `📅 *Leads das últimas 24h:*\n\nTotal: ${count || 0} leads recebidos.`
}

// PREPARA (nao envia nada): acha o lead e mostra pra quem vai e o que vai.
export async function prepararResponder(rest: string, ctx: CommandContext): Promise<Preparo> {
  const parts = rest.trim().split(/\s+/)
  if (parts.length < 2) return { resposta: '❌ Use: RESPONDER [nome] [mensagem]' }

  const searchTerm = parts[0].replace(/[%,()*\\]/g, '')
  const message = parts.slice(1).join(' ')
  if (!searchTerm) return { resposta: '❌ Use: RESPONDER [nome] [mensagem]' }

  const { data: leads } = await ctx.supabase
    .from('leads')
    .select('nome, telefone')
    .ilike('nome', `%${searchTerm}%`)
    .limit(5)

  if (!leads || leads.length === 0) return { resposta: `❌ Lead não encontrado: "${searchTerm}"` }
  if (leads.length > 1) {
    const linhas = leads.map((l, i) => `${i + 1}. ${l.nome}`).join('\n')
    return {
      resposta: `⚠️ Mais de um lead bate com "${searchTerm}". Use um trecho mais específico do nome:\n\n${linhas}`,
    }
  }
  const lead = leads[0]
  if (!lead.telefone) return { resposta: `❌ ${lead.nome} não tem telefone cadastrado.` }

  const leadPhone = lead.telefone.replace(/\D/g, '')
  return {
    pedido: {
      comando: 'RESPONDER',
      alvo: { nome: lead.nome, telefone: leadPhone, mensagem: message },
      resumo: `RESPONDER ${lead.nome}`,
      pergunta: `💬 Quer realmente enviar esta mensagem a um *cliente*?\n\nPara: *${lead.nome}* (${leadPhone})\nMensagem: "${message}"\n\nResponda *SIM* ou *NÃO* (vale por ${VALIDADE_MINUTOS} minutos).`,
    },
  }
}

// EXECUTA. Limite honesto: a Meta responde "aceita", nao "entregue". Texto
// livre so chega ao cliente se ele falou com a Clara nas ultimas 24 h.
export async function executarResponder(
  alvo: Record<string, any>,
  ctx: CommandContext,
): Promise<string> {
  if (!ctx.waToken || !ctx.waPhoneId) {
    return '❌ Não enviei: credenciais do WhatsApp não configuradas no servidor.'
  }
  let res: Response
  try {
    res = await fetch(`https://graph.facebook.com/v20.0/${ctx.waPhoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: alvo.telefone,
        type: 'text',
        text: { body: alvo.mensagem },
      }),
    })
  } catch {
    return `❌ Não consegui falar com a Meta. A mensagem para ${alvo.nome} NÃO foi enviada.`
  }
  const corpo = await res.json().catch(() => ({}))
  if (!res.ok) {
    return `❌ A Meta recusou o envio para ${alvo.nome}${corpo?.error?.message ? `: ${corpo.error.message}` : ''}.`
  }
  const idMsg = corpo?.messages?.[0]?.id ? String(corpo.messages[0].id).slice(-8) : null
  return `✅ A Meta *aceitou* a mensagem para *${alvo.nome}* (${alvo.telefone})${idMsg ? ` — protocolo …${idMsg}` : ''}.\n\n"${alvo.mensagem}"\n\nℹ️ Aceita não é entregue: se o cliente não falou com a Clara nas últimas 24 h, o WhatsApp pode não entregar.`
}
