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

export async function handleAnuncios(ctx: CommandContext): Promise<string> {
  const { data, error } = await ctx.supabase
    .from('ads_audit_logs')
    .select('plataforma, acao, status, detalhes, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) return '❌ Nenhum log de anúncios encontrado.'

  const byPlatform: Record<string, number> = {}
  data.forEach((log) => {
    const p = log.plataforma || 'unknown'
    byPlatform[p] = (byPlatform[p] || 0) + 1
  })

  const summary = Object.entries(byPlatform)
    .map(([platform, count]) => `• ${platform}: ${count} ações`)
    .join('\n')

  const recentActions = data
    .slice(0, 5)
    .map((l, i) => `${i + 1}. [${l.plataforma}] ${l.acao} - ${l.status || 'N/A'}`)
    .join('\n')

  return `📊 *Resumo de Anúncios:*\n\n${summary}\n\n*Ações Recentes:*\n${recentActions}`
}

export async function handlePausar(nome: string, ctx: CommandContext): Promise<string> {
  if (!nome) return '❌ Use: PAUSAR [nome da campanha]'

  try {
    await fetch(`${ctx.supabaseUrl}/functions/v1/ads-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        action: 'toggle_status',
        platform: 'meta',
        params: { campaign_id: nome, new_status: 'PAUSED' },
      }),
    })
    return `⏸️ Solicitação de pausa enviada para a campanha:\n\n*${nome}*`
  } catch {
    return `❌ Erro ao pausar campanha "${nome}".`
  }
}

export async function handleOrcamento(rest: string, ctx: CommandContext): Promise<string> {
  const parts = rest.trim().split(/\s+/)
  if (parts.length < 2) return '❌ Use: ORÇAMENTO [nome] [valor]'

  const nome = parts[0]
  const valor = parseFloat(parts[1].replace(',', '.'))

  if (isNaN(valor)) return '❌ Valor inválido. Use: ORÇAMENTO [nome] [valor]'

  try {
    await fetch(`${ctx.supabaseUrl}/functions/v1/ads-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        action: 'update_budget',
        platform: 'meta',
        params: { campaign_id: nome, new_budget: valor },
      }),
    })
    return `💰 Orçamento atualizado:\n\nCampanha: *${nome}*\nNovo valor: R$ ${valor.toFixed(2)}/dia`
  } catch {
    return `❌ Erro ao atualizar orçamento da campanha "${nome}".`
  }
}
