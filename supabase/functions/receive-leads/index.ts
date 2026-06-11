import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_APY_KEY')!
const waToken = Deno.env.get('META_WHATSAPP_TOKEN')!
const waPhoneId = Deno.env.get('WHATSAPP_PHONE_ID') || 'default_id'

const SYSTEM_PROMPT = `Você é o Pedro, SDR digital da Carro e Cia Motors.
Tom: Empático, consultivo e ágil (máx 3-4 linhas por mensagem). Use emojis moderadamente.
Objetivos principais: 
1. Qualificar a forma de pagamento (financiamento, à vista, consórcio). 
2. Verificar se o cliente tem carro na troca (pegar modelo e ano). 
3. Agendar uma visita à loja.
Quando qualificado e o cliente demonstrar intenção real, use a função solicitar_atendimento_humano.
Use consultar_estoque sempre que precisar verificar veículos disponíveis.`

const tools = [
  {
    name: 'consultar_estoque',
    description: 'Busca veículos disponíveis no estoque (disponível ou consignado).',
    parameters: {
      type: 'OBJECT',
      properties: {
        marca: { type: 'STRING' },
        modelo: { type: 'STRING' },
        preco_maximo: { type: 'NUMBER' },
      },
    },
  },
  {
    name: 'atualizar_dados_lead',
    description: 'Atualiza informações valiosas do lead no CRM.',
    parameters: {
      type: 'OBJECT',
      properties: {
        trade_in_car: {
          type: 'STRING',
          description: 'O veículo que o cliente deseja dar na troca',
        },
        payment_method: { type: 'STRING', description: 'Forma de pagamento desejada' },
      },
    },
  },
  {
    name: 'solicitar_atendimento_humano',
    description: 'Marca o lead como qualificado e aciona um humano.',
    parameters: {
      type: 'OBJECT',
      properties: {
        resumo: { type: 'STRING', description: 'Breve resumo da negociação' },
      },
    },
  },
]

async function runGemini(history: any[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
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

async function handleFunctionCall(call: any, leadId: string) {
  const args = call.args || {}

  if (call.name === 'consultar_estoque') {
    let query = supabase
      .from('veiculos')
      .select('marca, modelo, preco_venda, ano_fabricacao')
      .in('status', ['disponivel', 'consignado'])
    if (args.marca) query = query.ilike('marca', `%${args.marca}%`)
    if (args.modelo) query = query.ilike('modelo', `%${args.modelo}%`)
    if (args.preco_maximo) query = query.lte('preco_venda', args.preco_maximo)

    const { data } = await query.limit(5)
    return { result: data || [] }
  }

  if (call.name === 'atualizar_dados_lead') {
    const updatePayload: any = {}
    if (args.trade_in_car) updatePayload.trade_in_car = args.trade_in_car
    if (args.payment_method) updatePayload.forma_pagamento = args.payment_method

    await supabase.from('leads').update(updatePayload).eq('id', leadId)
    return { success: true }
  }

  if (call.name === 'solicitar_atendimento_humano') {
    await supabase
      .from('leads')
      .update({ status: 'qualificado', notas_internas: args.resumo })
      .eq('id', leadId)
    return { success: true, message: 'Humano notificado com sucesso.' }
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
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text },
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const body = await req.json()

  // 1. Webhook do WhatsApp (Mensagem do Cliente)
  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0]?.changes?.[0]?.value
    if (!entry?.messages) return new Response('ok')

    const phone = entry.contacts[0].wa_id
    const text = entry.messages[0].text.body

    // Buscar Lead
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('telefone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
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
      const toolResult = await handleFunctionCall(call, lead.id)

      geminiHistory.push(aiRes.candidates[0].content)
      geminiHistory.push({
        role: 'function',
        parts: [{ functionResponse: { name: call.name, response: toolResult } }],
      })

      const followUp = await runGemini(geminiHistory)
      responseText =
        followUp.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Vou pedir para um de nossos especialistas te chamar.'
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
  const phone = body.telefone || body.phone
  const source = body.origem || 'site'
  const veiculo = body.veiculo || body.veiculo_interesse || ''

  const { data: lead } = await supabase
    .from('leads')
    .insert({
      nome,
      telefone: phone,
      source: source,
      origem: source,
      veiculo_interesse: veiculo,
      tipo: 'compra',
      status: 'em_atendimento',
    })
    .select()
    .single()

  if (lead) {
    const initText = `Novo lead recebido do portal ${source}. O cliente se chama ${nome} e tem interesse no veículo: ${veiculo}. Inicie a conversa se apresentando como Pedro, SDR da loja, e puxe assunto para qualificar a venda de forma amigável.`

    const aiRes = await runGemini([{ role: 'user', parts: [{ text: initText }] }])
    const responseText =
      aiRes.candidates?.[0]?.content?.parts?.[0]?.text ||
      `Olá ${nome}! Sou o Pedro, consultor digital da Carro e Cia. Vi que você tem interesse no ${veiculo}. Como posso te ajudar hoje?`

    await supabase
      .from('conversation_history')
      .insert({ lead_id: lead.id, sender: 'bot', message_text: responseText })
    await sendWhatsApp(phone, responseText)
  }

  return new Response(JSON.stringify({ success: true, lead_id: lead?.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
