import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

// Retomada automática da Clara (pedido da Adriana, 11/11/2026).
//
// Quando um atendente responde por TEXTO no painel, send-whatsapp PAUSA a Clara e grava a hora
// em leads.ai_desligada_auto_em. Este cron (a cada 10 min) procura esses leads e, se a última
// mensagem real da conversa é do CLIENTE e está sem resposta há 2 h ou mais, religa a Clara e
// pede ao ai-sdr que responda. Desligar pelo BOTÃO deixa a coluna nula — nunca volta sozinho.
//
// Corpo opcional (só para teste manual, com o mesmo segredo interno):
//   { "ensaio": true }                      -> só lista quem retomaria, não muda nada
//   { "lead_id": "<uuid>", "ignorar_prazo": true } -> processa só esse lead, sem esperar 2 h

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type, x-internal-secret',
}

const PRAZO_MS = 2 * 60 * 60 * 1000
// Janela do WhatsApp para texto livre é 24 h desde a última mensagem do cliente. Com folga:
// passou de 22 h, religa a Clara mas NÃO responde (a Meta recusaria/está perto de recusar).
const LIMITE_JANELA_MS = 22 * 60 * 60 * 1000

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  let opcoes: { ensaio?: boolean; lead_id?: string; ignorar_prazo?: boolean } = {}
  try {
    opcoes = await req.json()
  } catch {
    // sem corpo (chamada do cron) — segue com o padrão
  }
  const ensaio = opcoes.ensaio === true
  const ignorarPrazo = opcoes.ignorar_prazo === true && typeof opcoes.lead_id === 'string'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    let consulta = supabase
      .from('leads')
      .select('id, nome, telefone, ai_desligada_auto_em')
      .eq('ai_enabled', false)
      .not('ai_desligada_auto_em', 'is', null)
      .order('ai_desligada_auto_em', { ascending: true })
      .limit(50)
    if (opcoes.lead_id) consulta = consulta.eq('id', opcoes.lead_id)
    const { data: pausados, error } = await consulta
    if (error) throw error

    const resultado: Array<Record<string, unknown>> = []

    for (const lead of pausados || []) {
      try {
        const { data: ultima } = await supabase
          .from('conversation_history')
          .select('sender, message_text, created_at')
          .eq('lead_id', lead.id)
          .neq('sender', 'internal_note')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Só retoma se quem está esperando é o cliente.
        if (!ultima || ultima.sender !== 'client') continue
        const esperaMs = Date.now() - new Date(ultima.created_at).getTime()
        if (!ignorarPrazo && esperaMs < PRAZO_MS) continue

        const foraDaJanela = esperaMs >= LIMITE_JANELA_MS
        const horas = Math.floor(esperaMs / 3_600_000)
        const item: Record<string, unknown> = {
          lead_id: lead.id,
          nome: lead.nome,
          espera_horas: horas,
          vai_responder: !foraDaJanela,
        }
        resultado.push(item)
        if (ensaio) continue

        // Religa com trava: só um processo consegue (e só se ninguém mexeu no lead desde a leitura).
        const { data: religado } = await supabase
          .from('leads')
          .update({ ai_enabled: true, ai_desligada_auto_em: null })
          .eq('id', lead.id)
          .eq('ai_enabled', false)
          .not('ai_desligada_auto_em', 'is', null)
          .select('id')
        if (!religado || religado.length === 0) {
          item.pulado = 'lead mudou enquanto processava'
          continue
        }

        await supabase.from('conversation_history').insert({
          lead_id: lead.id,
          sender: 'internal_note',
          message_text: `clara_retomada:${foraDaJanela ? 'sem_resposta_janela' : 'respondeu'}`,
        })

        const nome = lead.nome || 'cliente'
        await supabase.from('notificacoes').insert({
          usuario_id: null,
          tipo: 'clara_retomou',
          titulo: '🤖 Clara retomou o atendimento',
          mensagem: foraDaJanela
            ? `${nome} ficou mais de 22 h sem resposta. A Clara foi religada, mas não respondeu (a janela de 24 h do WhatsApp está fechando). Responda pelo painel, se precisar.`
            : `${nome} ficou ${horas} h sem resposta do atendente. A Clara foi religada e respondeu. Para manter com você, desligue a Clara no botão do lead.`,
        })

        if (!foraDaJanela && lead.telefone) {
          const { data: resposta, error: erroIa } = await supabase.functions.invoke('ai-sdr', {
            body: {
              action: 'continue_conversation',
              lead_id: lead.id,
              mensagem: ultima.message_text || '',
              retomada_automatica: true,
            },
          })
          item.ia = erroIa ? `erro: ${erroIa.message}` : resposta?.skipped || 'respondeu'
        }
      } catch (err: any) {
        console.error(`Erro na retomada da Clara do lead ${lead.id}:`, err?.message)
        await supabase.from('logs_integracao').insert({
          portal: 'clara_retomada',
          status: 'error',
          payload_erro: { error: err?.message, lead_id: lead.id },
        })
      }
    }

    return json({ success: true, ensaio, pausados: pausados?.length ?? 0, retomados: resultado })
  } catch (err: any) {
    console.error('Erro geral em clara-retomada-cron:', err?.message)
    return json({ success: false, error: err?.message }, 500)
  }
})
