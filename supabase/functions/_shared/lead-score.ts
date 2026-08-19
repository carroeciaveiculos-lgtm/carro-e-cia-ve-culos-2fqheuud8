import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

// Achado 19/08/2026 (auditoria de leads quentes): `atualizar_estagio_lead` e
// `agendar_visita` — as únicas ferramentas que a Clara tem pra marcar
// temperatura/status — praticamente nunca são chamadas na prática, mesmo em
// conversas reais e longas (achado: lead com 36 mensagens trocadas, depois
// da correção de 12/08 que fez function calling funcionar de verdade, ainda
// com status='novo', temperatura='frio', ai_score=0 — e `agendamentos_visita`
// tem 0 registro no banco inteiro). `ai_score` deixa de depender da IA
// lembrar de calcular — roda sempre, com sinais objetivos que já temos,
// independente de qualquer decisão do modelo.
export async function recalcularAiScore(supabase: SupabaseClient, leadId: string): Promise<number> {
  const { data: lead } = await supabase
    .from('leads')
    .select('veiculo_interesse, email, origem, utm_campaign, gclid')
    .eq('id', leadId)
    .maybeSingle()
  if (!lead) return 0

  const { count: mensagens } = await supabase
    .from('conversation_history')
    .select('id', { count: 'exact', head: true })
    .eq('lead_id', leadId)

  const { count: agendamentos } = await supabase
    .from('agendamentos_visita')
    .select('id', { count: 'exact', head: true })
    .eq('lead_id', leadId)

  let score = 0
  if (lead.veiculo_interesse) score += 20
  if ((mensagens || 0) >= 5) score += 15
  if (lead.email) score += 10
  if ((agendamentos || 0) > 0) score += 40
  if (lead.origem === 'facebook_ads' || lead.origem === 'instagram_ads' || lead.gclid || lead.utm_campaign)
    score += 10

  score = Math.min(score, 100)

  await supabase.from('leads').update({ ai_score: score }).eq('id', leadId)
  return score
}
