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

// Sincroniza de forma inteligente com os dois padrões de variáveis salvas no Supabase Secrets
const geminiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')!
const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!
const waVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || Deno.env.get('META_VERIFY_TOKEN')!

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`
  const reqBody = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history,
    tools: [{ functionDeclarations: tools }],
  }

  console.log('Chamando a API do Gemini...')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  })
  return res.json()
}

async function handleFunctionCall(call: any) {
  const args = call.args || {}
  console.log('IA solicitou consulta de estoque com parâmetros:', JSON.stringify(args))

  if (call.name === 'consultar_estoque') {
    let query = supabase
      .from('veiculos')
      .select('marca, modelo, preco_venda, ano_fabricacao, is_consignado')
      .eq('status', 'disponivel')
    if (args.marca) query = query.ilike('marca', `%${args.marca}%`)
    if (args.modelo) query = query.ilike('modelo', `%${args.modelo}%`)
    if (args.preco_maximo) query = query.lte('preco_venda', args.preco_maximo)

    const { data, error } = await query.limit(5)
    if (error) {
      console.error('Erro na tabela de veiculos:', error)
    }
    return { result: data || [] }
  }

  return { error: 'Função não encontrada.' }
}

async function sendWhatsApp(to: string, text: string) {
  if (!waToken) {
    console.log('Token do WhatsApp ausente. Mocked WA to:', to, 'Msg:', text)
    return
  }
  console.log(`Enviando mensagem de WhatsApp para ${to} usando o ID de telefone: ${waPhoneId}...`)
  const res = await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
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

  const resData = await res.json()
  if (!res.ok) {
    console.error('Erro retornado pelo WhatsApp do Meta:', JSON.stringify(resData))
  } else {
    console.log('Mensagem de WhatsApp enviada com sucesso!')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === waVerifyToken) {
      console.log('Handshake do Meta recebido e aprovado com sucesso via GET.')
      return new Response(challenge, { status: 200 })
    }
    return new Response('Token de verificação inválido', { status: 403 })
  }

  const body = await req.json()
  console.log("Nova requisição POST recebida na rota 'receive-leads':", JSON.stringify(body))

  const isMetaWebhook = body.object === 'whatsapp_business_account'
  const platform = isMetaWebhook ? 'whatsapp' : 'portal'
  const eventType = body.entry?.[0]?.changes?.[0]?.field || 'lead'

  // Registrar o webhook no banco para auditoria e evitar timeout (Meta exige resposta rápida)
  const { data: logEntry, error: logError } = await supabase
    .from('meta_webhook_logs')
    .insert({
      platform,
      event_type: eventType,
      payload: body,
      processed: false,
    })
    .select('id')
    .maybeSingle()

  if (logError) {
    console.error('Erro ao registrar webhook log:', logError)
  }

  const logId = logEntry?.id

  const processWebhook = async () => {
    try {
      // 1. Webhook do WhatsApp (Mensagem do Cliente)
      if (isMetaWebhook) {
        const entry = body.entry?.[0]?.changes?.[0]?.value
        if (!entry?.messages) {
          console.log(
            'Evento recebido do WhatsApp, mas não é uma nova mensagem (ex: confirmação de leitura).',
          )
          if (logId)
            await supabase.from('meta_webhook_logs').update({ processed: true }).eq('id', logId)
          return { response: new Response('ok', { headers: corsHeaders }) }
        }

        const message = entry.messages[0]
        const contact = entry.contacts?.[0]
        const phone = message.from
        const text = message.text?.body
        const profileName = contact?.profile?.name || 'Cliente'

        console.log(`WhatsApp detectado. Telefone: ${phone}, Nome: ${profileName}, Texto: ${text}`)

        if (!phone || !text) {
          console.log('Mensagem sem texto ou telefone ignorada.')
          if (logId)
            await supabase
              .from('meta_webhook_logs')
              .update({ processed: true, error: 'Mensagem sem texto ou telefone' })
              .eq('id', logId)
          return { response: new Response('ok', { headers: corsHeaders }) }
        }

        // Buscar Lead de forma segura (using maybeSingle)
        console.log(`Buscando lead com o telefone ${phone} no banco de dados...`)
        let { data: lead, error: selectError } = await supabase
          .from('leads')
          .select('*')
          .eq('telefone', phone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() // maybeSingle impede falha silenciosa se não houver registros

        if (selectError) {
          console.error('Erro na busca de lead no banco de dados:', selectError)
        }

        if (!lead) {
          console.log('Lead inexistente. Cadastrando novo lead...')
          const { data: newLead, error: insertError } = await supabase
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
            .maybeSingle()

          if (insertError) {
            console.error('Erro crítico na inserção do novo lead no banco:', insertError)
          } else {
            console.log('Lead criado com sucesso no banco:', JSON.stringify(newLead))
          }
          lead = newLead
        } else {
          console.log('Lead já existente carregado do banco:', JSON.stringify(lead))
        }

        if (!lead) {
          console.error(
            'Aviso: O processo foi interrompido porque o lead não pôde ser encontrado nem criado no banco.',
          )
          if (logId)
            await supabase
              .from('meta_webhook_logs')
              .update({ error: 'Lead não encontrado ou criado' })
              .eq('id', logId)
          return { response: new Response('ok', { headers: corsHeaders }) }
        }

        // Salvar mensagem do cliente
        console.log("Registrando mensagem do cliente na tabela 'conversation_history'...")
        const { error: historyError } = await supabase.from('conversation_history').insert({
          lead_id: lead.id,
          sender: 'client',
          message_text: text,
        })

        if (historyError) {
          console.error(
            'Erro crítico ao gravar histórico da mensagem do cliente no banco:',
            historyError,
          )
        }

        // Montar histórico para o Gemini
        const { data: history, error: historyFetchError } = await supabase
          .from('conversation_history')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: true })

        if (historyFetchError) {
          console.error('Erro ao recuperar o histórico de conversas do banco:', historyFetchError)
        }

        const geminiHistory = (history || []).map((m) => ({
          role: m.sender === 'bot' ? 'model' : 'user',
          parts: [{ text: m.message_text }],
        }))

        console.log('Enviando histórico de conversas compilado ao Gemini...')
        const aiRes = await runGemini(geminiHistory)
        console.log('Resposta bruta gerada pelo Gemini:', JSON.stringify(aiRes))

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

        console.log('Resposta final que será enviada ao cliente:', responseText)

        // Salvar resposta e enviar
        const { error: botHistoryError } = await supabase.from('conversation_history').insert({
          lead_id: lead.id,
          sender: 'bot',
          message_text: responseText,
        })

        if (botHistoryError) {
          console.error('Erro ao gravar histórico da resposta da IA no banco:', botHistoryError)
        }

        await sendWhatsApp(phone, responseText)

        if (logId)
          await supabase.from('meta_webhook_logs').update({ processed: true }).eq('id', logId)
        return { response: new Response('ok', { headers: corsHeaders }) }
      }

      // 2. Webhook de Portais (Webmotors, iCarros, Site)
      console.log('Portal externo detectado. Iniciando validação de lead...')
      
      const nome = body.nome?.trim()
      const portalPhoneRaw = body.telefone || body.phone
      const portalPhone = portalPhoneRaw ? String(portalPhoneRaw).replace(/\D/g, '').trim() : ''
      const source = body.origem || body.source || 'site'
      const veiculo = body.veiculo || body.veiculo_interesse || ''
      
      // Capturar dados opcionais de rastreamento de origem (UTMs)
      const utmSource = body.utm_source || body.ref || null
      const utmMedium = body.utm_medium || null
      const utmCampaign = body.utm_campaign || null

      // FILTRAGEM: Ignorar requisições de teste/ping de portais para não poluir o CRM
      if (body.ping === 'pong' || body.test === true || body.action === 'ping') {
        console.log('Ping de teste de portal detectado. Ignorando gravação de lead no banco de dados.')
        if (logId) {
          await supabase.from('meta_webhook_logs').update({ processed: true }).eq('id', logId)
        }
        return {
          response: new Response(JSON.stringify({ success: true, message: 'pong' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          })
        }
      }

      // VALIDAÇÃO ESTRITA: Se o nome for vazio, genérico ou o telefone tiver menos de 8 dígitos, bloqueia imediatamente
      if (!nome || nome === 'Cliente' || !portalPhone || portalPhone.length < 8) {
        console.warn('Requisição de lead recusada por falta de dados mínimos obrigatórios:', JSON.stringify(body))
        if (logId) {
          await supabase
            .from('meta_webhook_logs')
            .update({ processed: true, error: 'Rejeitado por dados insuficientes (Nome/Telefone)' })
            .eq('id', logId)
        }
        return {
          response: new Response(JSON.stringify({ success: false, error: 'Nome e telefone válidos são necessários para registro de leads.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          })
        }
      }

      // Inserir lead validado no banco com segurança
      const { data: lead, error: portalInsertError } = await supabase
        .from('leads')
        .insert({
          nome,
          telefone: portalPhone,
          source: source,
          origem: source,
          veiculo_interesse: veiculo,
          tipo: 'compra',
          status: 'novo',
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign
        })
        .select()
        .maybeSingle()

      if (portalInsertError) {
        console.error('Erro crítico ao registrar lead vindo de portal externo:', portalInsertError)
      }

      if (lead) {
        console.log(
          'Lead de portal criado com sucesso. Iniciando saudação por inteligência artificial...',
        )
        const initText = `Novo lead recebido do portal ${source}. O cliente se chama ${nome} e tem interesse no veículo: ${veiculo}. Inicie a conversa se apresentando como Luiz, SDR da loja, e puxe assunto para agendar uma visita.`

        const aiRes = await runGemini([{ role: 'user', parts: [{ text: initText }] }])
        const responseText =
          aiRes.candidates?.[0]?.content?.parts?.[0]?.text ||
          `Olá ${nome}! Sou o Luiz, consultor digital da Carro e Cia. Vi que você tem interesse no ${veiculo}. Gostaria de agendar uma visita?`

        await supabase
          .from('conversation_history')
          .insert({ lead_id: lead.id, sender: 'bot', message_text: responseText })
        
        // Disparar o WhatsApp somente se o telefone de contato existir
        if (portalPhone) {
          await sendWhatsApp(portalPhone, responseText)
        }
      }

      if (logId)
        await supabase.from('meta_webhook_logs').update({ processed: true }).eq('id', logId)

      return {
        response: new Response(JSON.stringify({ success: true, lead_id: lead?.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }),
      }
    } catch (err: any) {
      console.error('Erro não tratado durante o processamento do webhook:', err)
      if (logId)
        await supabase.from('meta_webhook_logs').update({ error: err.message }).eq('id', logId)
      return { response: new Response('error', { status: 500, headers: corsHeaders }) }
    }
  }

  // Se for Meta Webhook, responde imediatamente e processa em background para evitar timeouts
  if (isMetaWebhook) {
    if (
      typeof (globalThis as any).EdgeRuntime !== 'undefined' &&
      typeof (globalThis as any).EdgeRuntime.waitUntil === 'function'
    ) {
      ;(globalThis as any).EdgeRuntime.waitUntil(processWebhook())
    } else {
      processWebhook().catch(console.error)
    }
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  // Se não for Meta Webhook, processa sincronamente (para retornar o ID do lead)
  const { response } = await processWebhook()
  return response
})