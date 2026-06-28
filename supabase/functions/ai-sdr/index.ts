import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_APY_KEY')!
const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID') || 'default_id'

async function getSystemPrompt() {
  const { data } = await supabase
    .from('social_configuracoes')
    .select('ai_system_prompt, whatsapp_number')
    .maybeSingle()
  
  const basePrompt = data?.ai_system_prompt || 'Você é o Luiz, SDR digital da Carro e Cia Motors.'
  const waNumber = data?.whatsapp_number || ''

  const { data: brainKnowledge } = await supabase.from('brain_ia_knowledge').select('titulo, conteudo, tipo').limit(10)
  
  let memoryContext = ''
  if (brainKnowledge && brainKnowledge.length > 0) {
    memoryContext = '\nConhecimento (Memória Ativa):\n' + brainKnowledge.map((k: any) => `[${k.titulo}]: ${k.conteudo || k.tipo}`).join('\n')
  }

  return `${basePrompt}${memoryContext}
Tom: Empático, consultivo e ágil (máx 3-4 linhas por mensagem). Use emojis moderadamente.
Objetivos principais: 
1. Qualificar a forma de pagamento (financiamento, à vista, consórcio). 
2. Verificar se o cliente tem carro na troca (pegar modelo e ano). 
3. Agendar uma visita à loja.
Quando qualificado e o cliente demonstrar intenção real, use a função solicitar_atendimento_humano.
${waNumber ? `O número oficial de WhatsApp da loja é: ${waNumber}. Se for necessário enviar um link direto, use https://wa.me/${waNumber}` : ''}
Use consultar_estoque sempre que precisar verificar veículos disponíveis.`
}

async function runGemini(history: any[]) {
  const systemPrompt = await getSystemPrompt()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`
  const reqBody = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: history,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  })
  return res.json()
}

async function sendWhatsApp(to: string, text: string) {
  if (!waToken) return console.log('Mocked WA to:', to, 'Msg:', text)
  await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text },
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()

    if (body.action === 'init_conversation') {
      const { lead_id, source, veiculo } = body

      // Uso seguro de maybeSingle() para evitar quebras de execução
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .maybeSingle()
        
      if (leadError) console.error("Erro ao carregar dados do lead:", leadError);

      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead não localizado.' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const nome = lead.nome || 'Cliente'
      const v = veiculo || 'nosso estoque'
      const initText = `Novo lead recebido do portal ${source}. O cliente se chama ${nome} e tem interesse no veículo: ${v}. Inicie a conversa se apresentando como Luiz, SDR da loja, e puxe assunto para qualificar a venda de forma amigável.`

      const aiRes = await runGemini([{ role: 'user', parts: [{ text: initText }] }])
      const responseText =
        aiRes.candidates?.[0]?.content?.parts?.[0]?.text ||
        `Olá ${nome}! Sou o Luiz, consultor digital da Carro e Cia. Vi que você tem interesse no ${v}. Como posso te ajudar hoje?`

      await supabase
        .from('conversation_history')
        .insert({ lead_id: lead.id, sender: 'bot', message_text: responseText })

      if (lead.telefone) {
        await sendWhatsApp(lead.telefone, responseText)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})