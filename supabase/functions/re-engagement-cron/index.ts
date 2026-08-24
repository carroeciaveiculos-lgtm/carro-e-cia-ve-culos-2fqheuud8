import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // PAUSADO em 24/08/2026 (achado real, confirmado via logs_integracao): o
    // template 'reengajamento_frio' usado abaixo NUNCA existiu de verdade na
    // conta aprovada da Meta — toda tentativa falhava com erro 132001
    // ("template name does not exist"), silenciosamente, desde sempre. Dois
    // templates novos (reengajamento_quente, reengajamento_pos_visita) já
    // foram submetidos pra aprovação da Meta (24/08/2026, status PENDING).
    // Reative trocando REENGAJAMENTO_PAUSADO pra false E trocando o nome do
    // template no corpo da função pelo nome aprovado de verdade, assim que a
    // Meta aprovar.
    const REENGAJAMENTO_PAUSADO = true
    if (REENGAJAMENTO_PAUSADO) {
      return new Response(
        JSON.stringify({
          success: true,
          paused: true,
          motivo:
            "Reengajamento pausado — template 'reengajamento_frio' não existe na conta aprovada da Meta. Ver comentário no código.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Busca leads frios inativos de forma controlada (limitado a 30 por execução para evitar timeouts)
    const { data: leadsFrios, error: errorFrios } = await supabase
      .from('leads')
      .select('id, telefone, nome, status, temperatura')
      .eq('temperatura', 'frio')
      .neq('status', 'perdido')
      .neq('status', 'fechado')
      .lt('updated_at', sevenDaysAgo.toISOString())
      .limit(30) // Garantia de estabilidade e prevenção contra quedas de execução

    if (errorFrios) throw errorFrios

    // Item F (24/08/2026, pedido da Adriana): lead frio espera 7 dias pra
    // reengajar, mas um lead que já esquentou (morno/quente) e foi pro
    // silêncio merece retorno bem mais rápido — 48h — porque ele já
    // demonstrou interesse real; silêncio nessa faixa é sinal de abandono
    // no meio do processo, não só "ainda não decidiu". Reusa o MESMO
    // template já aprovado (reengajamento_frio) pra não depender de um novo
    // ciclo de aprovação da Meta — o texto do template não foi revisado pra
    // esse caso específico, então se soar frio demais pra um lead quente,
    // vale considerar pedir um template novo mais pra frente. Exclui
    // agendamento/visita porque esses leads já têm um próximo passo marcado
    // — reengajar de novo seria confuso.
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { data: leadsMornoQuente, error: errorMornoQuente } = await supabase
      .from('leads')
      .select('id, telefone, nome, status, temperatura')
      .in('temperatura', ['morno', 'quente'])
      .not('status', 'in', '(perdido,fechado,agendamento,visita)')
      .lt('updated_at', twoDaysAgo.toISOString())
      .limit(20)

    if (errorMornoQuente) throw errorMornoQuente

    const leadsCandidatos = [...(leadsFrios || []), ...(leadsMornoQuente || [])]

    // Limite de reengajamentos por lead (12/08/2026, pedido da Adriana): sem
    // isso, um lead que nunca esquenta recebe o mesmo template a cada 7 dias
    // pra sempre. Mandar template pra quem não responde repetidamente piora a
    // "quality rating" do número no WhatsApp Business (métrica da Meta que
    // pode restringir o número de enviar mais mensagens) — por isso o limite,
    // não é só spam pro cliente. Contado via conversation_history (sem
    // migration nova): cada envio anterior já grava o marcador abaixo.
    const MAX_REENGAJAMENTOS_FRIO = 3
    // Item F: cap mais baixo pra morno/quente — se um lead que já esquentou
    // não responde a 2 tentativas, o caminho certo é virar tarefa humana
    // (ver item de encaminhamento humano), não continuar insistindo por
    // automação.
    const MAX_REENGAJAMENTOS_QUENTE = 2
    const MARCADOR_REENGAJAMENTO = '[Template Automático de Reengajamento Enviado]'
    const maxReengajamentosPara = (l: { temperatura: string }) =>
      l.temperatura === 'frio' ? MAX_REENGAJAMENTOS_FRIO : MAX_REENGAJAMENTOS_QUENTE

    const idsCandidatos = leadsCandidatos.map((l) => l.id)
    let leads = leadsCandidatos
    if (idsCandidatos.length > 0) {
      const { data: historico } = await supabase
        .from('conversation_history')
        .select('lead_id')
        .in('lead_id', idsCandidatos)
        .eq('message_text', MARCADOR_REENGAJAMENTO)

      const contagemPorLead = new Map<string, number>()
      for (const h of historico || []) {
        contagemPorLead.set(h.lead_id, (contagemPorLead.get(h.lead_id) || 0) + 1)
      }

      const noLimite = leadsCandidatos.filter(
        (l) => (contagemPorLead.get(l.id) || 0) >= maxReengajamentosPara(l),
      )
      if (noLimite.length > 0) {
        console.log(
          `${noLimite.length} lead(s) já atingiram o limite de reengajamentos, pulando: ${noLimite.map((l) => l.id).join(', ')}`,
        )
      }
      leads = leadsCandidatos.filter(
        (l) => (contagemPorLead.get(l.id) || 0) < maxReengajamentosPara(l),
      )
    }

    console.log(`Iniciando envio de lote de reengajamento para ${leads?.length || 0} leads...`)

    let sentCount = 0

    for (const lead of leads || []) {
      if (lead.telefone) {
        try {
          const waToken =
            Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
          const waPhoneId =
            Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!

          const cleanPhone = lead.telefone.replace(/\D/g, '')

          const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'template',
              template: {
                name: 'reengajamento_frio',
                language: { code: 'pt_BR' },
                components: [
                  { type: 'body', parameters: [{ type: 'text', text: lead.nome || 'Cliente' }] },
                ],
              },
            }),
          })

          const errorData = await res.json()
          if (!res.ok) {
            throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`)
          }

          // Grava no histórico do CRM o disparo do template
          await supabase.from('conversation_history').insert({
            lead_id: lead.id,
            sender: 'bot',
            message_text: MARCADOR_REENGAJAMENTO,
          })

          // Atualiza o updated_at imediatamente para garantir que ele não caia no filtro de reengajamento novamente
          await supabase
            .from('leads')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', lead.id)

          sentCount++
          console.log(`Template enviado com sucesso para o lead: ${lead.nome} (${cleanPhone})`)
        } catch (err: any) {
          console.error(`Erro ao processar reengajamento do lead ${lead.id}:`, err.message)

          await supabase.from('logs_integracao').insert({
            portal: 'whatsapp_reengagement',
            status: 'error',
            payload_erro: { error: err.message, lead_id: lead.id },
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: leads?.length, sent: sentCount }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (err: any) {
    console.error('Erro geral na função re-engagement-cron:', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
