import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const geminiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')!
const waToken = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
const waPhoneId = Deno.env.get('META_PHONE_NUMBER_ID')!
const waVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!

const SYSTEM_PROMPT = `Você é o Luiz, SDR digital da Carro e Cia Motors.
Identidade: SDR da Carro e Cia.
Estilo: Mensagens curtas, amigáveis, usando quebras de linha e emojis mínimos.
Regra: Foco exclusivo em agendar visitas à loja; NUNCA ofereça descontos.
Use consultar_estoque sempre que precisar verificar veículos disponíveis.`

const tools = [
  {
    name: 'consultar_estoque',
    description: 'Busca veículos disponíveis no estoque.',
    parameters: {
      type: 'OBJECT',
      properties: {
        marca: { type: 'STRING' },
        modelo: { type: 'STRING' },
        preco_maximo: { type: 'NUMBER' },
      },
    },
  },
]

async function runGemini(history: any[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
  const reqBody = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history,
    tools: [{ functionDeclarations: tools }],
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  })
  return res.json()
}

async function handleFunctionCall(call: any) {
  const args = call.args || {}

  if (call.name === 'consultar_estoque') {
    let query = supabase
      .from('veiculos')
      .select('marca, modelo, preco_venda, ano_fabricacao, is_consignado')
      .eq('status', 'disponivel')
    if (args.marca) query = query.ilike('marca', `%${args.marca}%`)
    if (args.modelo) query = query.ilike('modelo', `%${args.modelo}%`)
    if (args.preco_maximo) query = query.lte('preco_venda', args.preco_maximo)

    const { data } = await query.limit(5)
    return { result: data || [] }
  }

  return { error: 'Função não encontrada.' }
}

async function sendWhatsApp(to: string, text: string) {
  if (!waToken) return console.log('Mocked WA to:', to, 'Msg:', text)
  await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text },
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === waVerifyToken) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Token de verificação inválido', { status: 403 })
  }

  const body = await req.json()

  // 1. Webhook do WhatsApp (Mensagem do Cliente)
  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0]?.changes?.[0]?.value
    if (!entry?.messages) return new Response('ok')

    const message = entry.messages[0]
    const contact = entry.contacts?.[0]
    const phone = message.from
    const text = message.text?.body
    const profileName = contact?.profile?.name || 'Cliente'

    if (!phone || !text) return new Response('ok')

    // Buscar Lead
    let { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('telefone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lead) {
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          nome: profileName,
          telefone: phone,
          origem: 'whatsapp',
          source: 'whatsapp',
          tipo: 'compra',
          status: 'novo',
        })
        .select()
        .single()
      lead = newLead
    }

    if (!lead) return new Response('ok')

    // Salvar mensagem do cliente
    await supabase
      .from('conversation_history')
      .insert({ lead_id: lead.id, sender: 'client', message_text: text })

    // Montar histórico para o Gemini
    const { data: history } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })

    const geminiHistory = history!.map((m) => ({
      role: m.sender === 'bot' ? 'model' : 'user',
      parts: [{ text: m.message_text }],
    }))

    const aiRes = await runGemini(geminiHistory)
    let responseText = ''

    // Lidar com Function Calling
    if (aiRes.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const call = aiRes.candidates[0].content.parts[0].functionCall
      const toolResult = await handleFunctionCall(call)

      geminiHistory.push(aiRes.candidates[0].content)
      geminiHistory.push({
        role: 'function',
        parts: [{ functionResponse: { name: call.name, response: toolResult } }],
      })

      const followUp = await runGemini(geminiHistory)
      responseText =
        followUp.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Gostaria de agendar uma visita para conversarmos melhor?'
    } else {
      responseText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || 'Como posso ajudar?'
    }

    // Salvar resposta e enviar
    await supabase
      .from('conversation_history')
      .insert({ lead_id: lead.id, sender: 'bot', message_text: responseText })
    await sendWhatsApp(phone, responseText)

    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Webhook de Portais (Webmotors, iCarros, Site)
  const nome = body.nome || 'Cliente'
  const portalPhone = body.telefone || body.phone
  const source = body.origem || 'site'
  const veiculo = body.veiculo || body.veiculo_interesse || ''

  const { data: lead } = await supabase
    .from('leads')
    .insert({
      nome,
      telefone: portalPhone,
      source: source,
      origem: source,
      veiculo_interesse: veiculo,
      tipo: 'compra',
      status: 'novo',
    })
    .select()
    .single()

  if (lead) {
    const initText = `Novo lead recebido do portal ${source}. O cliente se chama ${nome} e tem interesse no veículo: ${veiculo}. Inicie a conversa se apresentando como Luiz, SDR da loja, e puxe assunto para agendar uma visita.`

    const aiRes = await runGemini([{ role: 'user', parts: [{ text: initText }] }])
    const responseText =
      aiRes.candidates?.[0]?.content?.parts?.[0]?.text ||
      `Olá ${nome}! Sou o Luiz, consultor digital da Carro e Cia. Vi que você tem interesse no ${veiculo}. Gostaria de agendar uma visita?`

    await supabase
      .from('conversation_history')
      .insert({ lead_id: lead.id, sender: 'bot', message_text: responseText })
    if (portalPhone) {
      await sendWhatsApp(portalPhone, responseText)
    }
  }

  return new Response(JSON.stringify({ success: true, lead_id: lead?.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
