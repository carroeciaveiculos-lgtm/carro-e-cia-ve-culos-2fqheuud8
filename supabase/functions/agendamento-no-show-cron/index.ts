import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Bloco 5 do fluxo de agendamentos (13/08/2026, pedido da Adriana). Roda de
// hora em hora; considera "não compareceu" quem passou 2h do horário
// marcado ainda em status 'agendado' — tolerância pra loja ter tempo de
// marcar "compareceu" manualmente antes do robô decidir por ela. Reabrir
// (voltar pra 'agendado') continua disponível na tela /admin/agendamentos
// se o robô errar (ex: a loja esqueceu de marcar presença na hora).
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

    const limite = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const { data: agendamentos, error } = await supabase
      .from('agendamentos_visita')
      .select('id, data_hora, tipo, leads(nome, telefone)')
      .eq('status', 'agendado')
      .lt('data_hora', limite.toISOString())

    if (error) throw error

    const { data: config } = await supabase
      .from('social_configuracoes')
      .select('whatsapp_number')
      .maybeSingle()
    const ownerPhone = config?.whatsapp_number || '5534999484285'

    let processados = 0
    for (const ag of agendamentos || []) {
      const lead = (ag as any).leads
      try {
        await supabase
          .from('agendamentos_visita')
          .update({ status: 'nao_compareceu', follow_up_enviado_em: new Date().toISOString() })
          .eq('id', ag.id)

        if (lead?.telefone) {
          const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: lead.telefone.replace(/\D/g, ''),
              type: 'template',
              template: {
                name: 'agendamento_reagendar',
                language: { code: 'pt_BR' },
                components: [
                  { type: 'body', parameters: [{ type: 'text', text: lead.nome || 'Cliente' }] },
                ],
              },
            }),
          })
          const responseData = await res.json()
          if (!res.ok) throw new Error(JSON.stringify(responseData))
        }

        if (waToken && waPhoneId) {
          const tipoTexto = ag.tipo === 'avaliacao' ? 'avaliação' : 'visita'
          const texto = `⚠️ ${lead?.nome || 'Cliente'}${lead?.telefone ? ` (${lead.telefone})` : ''} não compareceu à ${tipoTexto} marcada. Reagendamento oferecido automaticamente.`
          await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: ownerPhone.replace(/\D/g, ''),
              type: 'text',
              text: { body: texto },
            }),
          })
        }

        processados++
      } catch (err: any) {
        console.error(`Erro ao processar no-show do agendamento ${ag.id}:`, err.message)
        await supabase.from('logs_integracao').insert({
          portal: 'whatsapp_agendamento_no_show',
          status: 'error',
          payload_erro: { error: err.message, agendamento_id: ag.id },
        })
      }
    }

    return new Response(JSON.stringify({ success: true, processados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Erro geral em agendamento-no-show-cron:', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
