import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Reengajamento rápido (21/09/2026, pedido da Adriana) — cobre o intervalo
// que o re-engagement-cron não cobria (esse só age a partir de 48h). Aqui:
// cliente parou de responder pouco depois da última mensagem da Clara,
// ainda dentro da janela livre de 24h do WhatsApp (não precisa de template
// aprovado pra texto solto nessa janela — só a etapa de 24h+ abaixo exige).
// Rastreio sem migration nova: marcador em conversation_history
// (sender='internal_note', mesmo padrão do midia_enviada em ai-sdr),
// contado a partir da última mensagem real da Clara pra esse lead.
const MARCADOR_PREFIXO = 'followup2h:'

interface Etapa {
  tentativa: number
  elapsedMinMs: number
}

const ETAPAS: Etapa[] = [
  { tentativa: 1, elapsedMinMs: 2 * 60 * 60 * 1000 },
  { tentativa: 2, elapsedMinMs: 4 * 60 * 60 * 1000 },
  { tentativa: 3, elapsedMinMs: 6 * 60 * 60 * 1000 },
]
// Etapa 4 (fora da janela de 24h, exige template aprovado pela Meta).
const ELAPSED_MIN_TEMPLATE_MS = 24 * 60 * 60 * 1000

function textoTentativa1(nome: string, veiculo: string | null): string {
  const sobreVeiculo = veiculo ? ` sobre o ${veiculo}` : ''
  return `Oi, ${nome}! Ainda por aqui? Fico à disposição se quiser continuar vendo${sobreVeiculo} 😊`
}

function textoTentativa2(nome: string, veiculo: string | null): string {
  const sobreVeiculo = veiculo ? ` sobre o ${veiculo}` : ''
  return `Oi, ${nome}! Só passando pra saber se ficou com alguma dúvida${sobreVeiculo} — é só me chamar quando puder! 😊`
}

function textoTentativa3(nome: string, veiculo: string | null): string {
  const sobreVeiculo = veiculo ? ` sobre o ${veiculo}` : ''
  return `Oi, ${nome}! Notei que você ficou um tempo sem responder. Quer continuar nosso atendimento${sobreVeiculo}, ou prefere que eu pare por aqui?`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Pool de candidatos: leads ativos, IA ligada, com telefone, ordenados
    // pelos mais recentemente tocados primeiro (os relevantes pra uma janela
    // de 2-24h estão sempre entre os mais recentes). Limite pragmático, mesmo
    // padrão de re-engagement-cron/agendamento-no-show-cron.
    const { data: candidatos, error: errorCandidatos } = await supabase
      .from('leads')
      .select('id, telefone, nome, veiculo_interesse, status, ai_enabled')
      .eq('ai_enabled', true)
      .not('status', 'in', '(fechado,perdido,agendamento,visita)')
      .not('telefone', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (errorCandidatos) throw errorCandidatos

    let enviados = 0
    let avaliados = 0

    for (const lead of candidatos || []) {
      try {
        const { data: ultimaMsg } = await supabase
          .from('conversation_history')
          .select('sender, created_at')
          .eq('lead_id', lead.id)
          .neq('sender', 'internal_note')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Cliente já respondeu por último, ou não tem histórico — nada a fazer.
        if (!ultimaMsg || ultimaMsg.sender !== 'bot') continue
        avaliados++

        const elapsedMs = Date.now() - new Date(ultimaMsg.created_at).getTime()

        const { data: marcadores } = await supabase
          .from('conversation_history')
          .select('message_text')
          .eq('lead_id', lead.id)
          .eq('sender', 'internal_note')
          .gt('created_at', ultimaMsg.created_at)
          .like('message_text', `${MARCADOR_PREFIXO}%`)

        const textos = (marcadores || []).map((m) => m.message_text)
        const jaEnviouTemplate = textos.includes(`${MARCADOR_PREFIXO}template`)
        const jaEnviados = textos.filter((t) => t !== `${MARCADOR_PREFIXO}template`).length
        const nome = lead.nome || 'Cliente'
        const veiculo = lead.veiculo_interesse || null

        if (jaEnviouTemplate) continue

        // Etapa 4 (24h+, exige template já aprovado) — dispara assim que a
        // janela livre fechar, mesmo que as 3 tentativas em texto livre não
        // tenham dado tempo de rodar todas (ex: lead que já estava parado há
        // dias antes desse cron existir) — evita ficar tentando texto livre
        // fora da janela, que a Meta sempre recusaria.
        if (elapsedMs >= ELAPSED_MIN_TEMPLATE_MS) {
          const res = await supabase.functions.invoke('send-whatsapp', {
            body: {
              action: 'template',
              to: lead.telefone,
              templateName: 'retomar_conversa',
              components: [{ type: 'body', parameters: [{ type: 'text', text: nome }] }],
              leadId: lead.id,
              origem: 'clara',
            },
          })
          if (res.error) throw new Error(res.error.message || 'Falha ao enviar template retomar_conversa')

          await supabase.from('conversation_history').insert({
            lead_id: lead.id,
            sender: 'internal_note',
            message_text: `${MARCADOR_PREFIXO}template`,
          })
          enviados++
          continue
        }

        // Já mandou as 3 tentativas em texto livre e ainda não chegou em 24h
        // — nada a fazer por enquanto, espera a janela fechar pra etapa 4.
        if (jaEnviados >= ETAPAS.length) continue

        const etapa = ETAPAS[jaEnviados]
        if (elapsedMs < etapa.elapsedMinMs) continue

        if (etapa.tentativa < 3) {
          const texto = etapa.tentativa === 1 ? textoTentativa1(nome, veiculo) : textoTentativa2(nome, veiculo)
          const res = await supabase.functions.invoke('send-whatsapp', {
            body: { action: 'text', to: lead.telefone, text: texto, leadId: lead.id, origem: 'clara' },
          })
          if (res.error) throw new Error(res.error.message || 'Falha ao enviar follow-up')
        } else {
          // Tentativa 3 (decisiva): botões "Continuar" / "Não, obrigado" — a
          // resposta do cliente chega como texto normal (ver receive-leads,
          // tratamento de interactive/button_reply) e a Clara decide o que
          // fazer via instrução no prompt (encerrar com educação se recusar).
          const res = await supabase.functions.invoke('send-whatsapp', {
            body: {
              action: 'buttons',
              to: lead.telefone,
              text: textoTentativa3(nome, veiculo),
              buttons: ['Continuar', 'Não, obrigado'],
              leadId: lead.id,
              origem: 'clara',
            },
          })
          if (res.error) throw new Error(res.error.message || 'Falha ao enviar follow-up decisivo')
        }

        await supabase.from('conversation_history').insert({
          lead_id: lead.id,
          sender: 'internal_note',
          message_text: `${MARCADOR_PREFIXO}${etapa.tentativa}`,
        })
        enviados++
      } catch (err: any) {
        console.error(`Erro ao processar follow-up 2h do lead ${lead.id}:`, err.message)
        await supabase.from('logs_integracao').insert({
          portal: 'whatsapp_followup_2h',
          status: 'error',
          payload_erro: { error: err.message, lead_id: lead.id },
        })
      }
    }

    return new Response(JSON.stringify({ success: true, avaliados, enviados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Erro geral em follow-up-2h-cron:', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
