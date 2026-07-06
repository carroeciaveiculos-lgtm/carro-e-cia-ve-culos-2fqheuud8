import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    .or('temperatura.eq.Quente,ai_score.gte.70')
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

export async function handleResponder(rest: string, ctx: CommandContext): Promise<string> {
  const parts = rest.trim().split(/\s+/)
  if (parts.length < 2) return '❌ Use: RESPONDER [nome] [mensagem]'

  const searchTerm = parts[0]
  const message = parts.slice(1).join(' ')

  const { data: leads } = await ctx.supabase
    .from('leads')
    .select('nome, telefone')
    .ilike('nome', `%${searchTerm}%`)
    .limit(1)

  if (!leads || leads.length === 0) return `❌ Lead não encontrado: "${searchTerm}"`
  if (!leads[0].telefone) return `❌ ${leads[0].nome} não tem telefone cadastrado.`

  const leadPhone = leads[0].telefone.replace(/\D/g, '')

  if (ctx.waToken && ctx.waPhoneId) {
    const res = await fetch(`https://graph.facebook.com/v20.0/${ctx.waPhoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: leadPhone,
        type: 'text',
        text: { body: message },
      }),
    })
    if (!res.ok) return `❌ Erro ao enviar mensagem para ${leads[0].nome}.`
  }

  return `✅ Mensagem enviada para *${leads[0].nome}* (${leadPhone}):\n\n"${message}"`
}
