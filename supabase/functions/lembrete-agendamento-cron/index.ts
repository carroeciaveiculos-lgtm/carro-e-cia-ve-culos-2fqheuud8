import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Bloco 4 do fluxo de agendamentos (13/08/2026, pedido da Adriana). Roda de
// hora em hora (cron); janela de 1h a 3h à frente garante que todo
// agendamento seja pego uma vez, mesmo com granularidade horária. Usa o
// template lembrete_agendamento (aprovado pela Meta) porque pode já ter
// passado mais de 24h desde a última mensagem do cliente — texto livre
// falharia nesse caso.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
    const waPhoneId =
      Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!

    const agora = new Date()
    const janelaInicio = new Date(agora.getTime() + 60 * 60 * 1000)
    const janelaFim = new Date(agora.getTime() + 3 * 60 * 60 * 1000)

    const { data: agendamentos, error } = await supabase
      .from('agendamentos_visita')
      .select('id, data_hora, leads(nome, telefone)')
      .eq('status', 'agendado')
      .is('lembrete_enviado_em', null)
      .gte('data_hora', janelaInicio.toISOString())
      .lte('data_hora', janelaFim.toISOString())

    if (error) throw error

    let enviados = 0
    for (const ag of agendamentos || []) {
      const lead = (ag as any).leads
      if (!lead?.telefone) continue

      const horaFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      })

      try {
        const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: lead.telefone.replace(/\D/g, ''),
            type: 'template',
            template: {
              name: 'lembrete_agendamento',
              language: { code: 'pt_BR' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: lead.nome || 'Cliente' },
                    { type: 'text', text: horaFormatada },
                  ],
                },
              ],
            },
          }),
        })
        const responseData = await res.json()
        if (!res.ok) throw new Error(JSON.stringify(responseData))

        await supabase
          .from('agendamentos_visita')
          .update({ lembrete_enviado_em: new Date().toISOString() })
          .eq('id', ag.id)
        enviados++
      } catch (err: any) {
        console.error(`Erro ao enviar lembrete do agendamento ${ag.id}:`, err.message)
        await supabase.from('logs_integracao').insert({
          portal: 'whatsapp_lembrete_agendamento',
          status: 'error',
          payload_erro: { error: err.message, agendamento_id: ag.id },
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, candidatos: agendamentos?.length || 0, enviados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('Erro geral em lembrete-agendamento-cron:', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
