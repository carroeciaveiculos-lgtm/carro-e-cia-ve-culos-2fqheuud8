import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'
import { isEquipePhone } from '../_shared/whatsapp-commands.ts'

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

// Tentativas em texto livre: cada uma sai 2 h depois da anterior (2h/4h/6h
// desde a última fala real da Clara). A 4ª etapa é o template aprovado.
const TENTATIVAS_TEXTO = 3
const INTERVALO_MS = 2 * 60 * 60 * 1000
// Janela de 24 h do WhatsApp: conta a partir da última mensagem do CLIENTE.
// Fora dela, texto livre é recusado pela Meta (131047) — só template.
const JANELA_WHATSAPP_MS = 24 * 60 * 60 * 1000
// Retorno rápido só para silêncio RECENTE: até 3 dias depois da última fala
// da Clara. Mais antigo que isso é com o re-engagement-cron (48 h / 7 dias).
// Sem este limite, ao religar o cron (desligado de 24/09 a 24/11/2026), todo
// lead parado desde setembro receberia o template de uma vez.
const SILENCIO_MAXIMO_MS = 3 * 24 * 60 * 60 * 1000

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

  // Modo ensaio (24/11/2026): { "ensaio": true } só lista quem receberia o
  // quê, sem enviar nada nem gravar marcador. Usado antes de religar o cron.
  let opcoes: { ensaio?: boolean } = {}
  try {
    opcoes = await req.json()
  } catch {
    opcoes = {}
  }
  const ensaio = opcoes?.ensaio === true
  const previstos: { lead_id: string; acao: string }[] = []

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
      // Número interno (Adriana/Fernando) nunca recebe retorno automático.
      if (isEquipePhone(lead.telefone || '')) continue
      try {
        const { data: ultimaMsg } = await supabase
          .from('conversation_history')
          .select('sender, created_at, message_text')
          .eq('lead_id', lead.id)
          .neq('sender', 'internal_note')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Cliente já respondeu por último, ou não tem histórico — nada a fazer.
        // ('human' = vendedor escreveu por último: a conversa está com a equipe.)
        if (!ultimaMsg || ultimaMsg.sender !== 'bot') continue
        if (Date.now() - new Date(ultimaMsg.created_at).getTime() > SILENCIO_MAXIMO_MS) continue
        // Achado no ensaio de 24/11/2026: se a última mensagem 'bot' já é um
        // template automático (ex.: "[Template Automático de Reengajamento
        // Enviado]" do re-engagement-cron), o cliente acabou de ser procurado —
        // o follow-up mandaria um 2º template logo atrás. Nada a fazer.
        if ((ultimaMsg.message_text || '').startsWith('[Template')) continue
        avaliados++

        // CORREÇÃO 24/11/2026 — causa do laço de 21–24/09 (cliente recebia a
        // "tentativa 2" a cada 4 h, até 12 vezes): o send-whatsapp grava o
        // próprio follow-up como mensagem 'bot', e a versão antiga contava as
        // tentativas só DEPOIS da última mensagem 'bot' — ou seja, depois do
        // follow-up que ela mesma tinha mandado —, então a contagem voltava a 1.
        // Agora tudo é contado desde a última mensagem do CLIENTE.
        const { data: ultimaDoCliente } = await supabase
          .from('conversation_history')
          .select('created_at')
          .eq('lead_id', lead.id)
          .eq('sender', 'client')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        // Lead que nunca escreveu (veio de formulário): não há conversa a retomar.
        if (!ultimaDoCliente) continue
        const desde = ultimaDoCliente.created_at

        const { data: marcadores } = await supabase
          .from('conversation_history')
          .select('message_text, created_at')
          .eq('lead_id', lead.id)
          .eq('sender', 'internal_note')
          .gt('created_at', desde)
          .like('message_text', `${MARCADOR_PREFIXO}%`)
          .order('created_at', { ascending: true })

        const lista = marcadores || []
        const jaEnviouTemplate = lista.some((m) => m.message_text === `${MARCADOR_PREFIXO}template`)
        const textosEnviados = lista.filter((m) => m.message_text !== `${MARCADOR_PREFIXO}template`)
        const nome = lead.nome || 'Cliente'
        const veiculo = lead.veiculo_interesse || null
        const agora = Date.now()

        // Um silêncio do cliente = no máximo 3 textos + 1 template, nunca mais.
        if (jaEnviouTemplate) continue

        const janelaFechada = agora - new Date(desde).getTime() >= JANELA_WHATSAPP_MS

        let acao: 'template' | 1 | 2 | 3 | null = null
        if (janelaFechada) {
          acao = 'template'
        } else if (textosEnviados.length < TENTATIVAS_TEXTO) {
          // 1ª tentativa: 2 h depois da última fala real da Clara (a última
          // mensagem 'bot', já que nenhum follow-up saiu desde o cliente).
          // Seguintes: 2 h depois do marcador anterior.
          const referencia =
            textosEnviados.length === 0
              ? ultimaMsg.created_at
              : textosEnviados[textosEnviados.length - 1].created_at
          if (agora - new Date(referencia).getTime() >= INTERVALO_MS) {
            acao = (textosEnviados.length + 1) as 1 | 2 | 3
          }
        }
        if (acao === null) continue

        if (ensaio) {
          previstos.push({
            lead_id: lead.id,
            acao: acao === 'template' ? 'template retomar_conversa' : `tentativa ${acao}`,
          })
          continue
        }

        if (acao === 'template') {
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
          if (res.error)
            throw new Error(res.error.message || 'Falha ao enviar template retomar_conversa')
        } else if (acao < 3) {
          const texto = acao === 1 ? textoTentativa1(nome, veiculo) : textoTentativa2(nome, veiculo)
          const res = await supabase.functions.invoke('send-whatsapp', {
            body: {
              action: 'text',
              to: lead.telefone,
              text: texto,
              leadId: lead.id,
              origem: 'clara',
            },
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
          message_text: `${MARCADOR_PREFIXO}${acao}`,
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

    return new Response(JSON.stringify({ success: true, ensaio, avaliados, enviados, previstos }), {
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
