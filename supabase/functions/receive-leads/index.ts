import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

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
const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!
const waVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || Deno.env.get('META_VERIFY_TOKEN')!
const metaPageToken = Deno.env.get('META_PAGE_ACCESS_TOKEN') || waToken!

const SYSTEM_PROMPT = `Você é o Luiz, SDR digital da Carro e Cia Motors.
Responda sempre em formato JSON válido com as seguintes chaves:
{
  "reply": "Sua resposta amigável e direta ao cliente (máx 3 linhas)",
  "temperature": "frio", "morno" ou "quente",
  "trade_in_car": "Modelo do carro de troca mencionado ou null",
  "payment_method": "Forma de pagamento mencionada (financiamento, a vista, consorcio) ou null"
}
Regra: Foco em agendar visitas à loja; NUNCA ofereça descontos. Seja prestativo.`

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
    generationConfig: { responseMimeType: 'application/json' },
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
  if (!waToken) return
  const cleanPhone = to.replace(/\D/g, '')

  // VALIDAÇÃO RÍGIDA DE TELEFONE (Fator de Sucesso para evitar o erro de 'Invalid WhatsApp number')
  if (cleanPhone.length < 10 || isNaN(Number(cleanPhone))) {
    console.warn(`Disparo de WhatsApp cancelado: o número '${to}' é inválido para envio comercial.`)
    return
  }

  try {
    console.log(
      `Enviando mensagem de WhatsApp para ${cleanPhone} usando o ID de telefone: ${waPhoneId}...`,
    )
    const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
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
  } catch (e) {
    console.error('Erro ao enviar mensagem via requisição HTTP do Meta:', e)
  }
}

// Envia resposta ativa de volta para o Messenger ou Instagram Direct
async function sendPageMessage(
  platform: 'instagram' | 'messenger',
  recipientId: string,
  text: string,
) {
  try {
    const url = `https://graph.facebook.com/v20.0/me/messages`
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${metaPageToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text: text },
      }),
    })
    const data = await res.json()
    if (!res.ok) console.error(`Erro ao disparar mensagem para ${platform}:`, JSON.stringify(data))
  } catch (e) {
    console.error(`Falha técnica de comunicação no envio do ${platform}:`, e)
  }
}

// Consulta de forma inteligente o nome real e avatar do perfil do Instagram ou Facebook do cliente
async function fetchMetaProfile(platform: 'instagram' | 'messenger', userId: string) {
  try {
    const fields =
      platform === 'instagram' ? 'username,name,profile_pic' : 'first_name,last_name,profile_pic'
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${userId}?fields=${fields}&access_token=${metaPageToken}`,
    )
    const data = await res.json()
    if (platform === 'instagram') {
      return {
        name: data.name || data.username || 'Cliente Instagram',
        pic: data.profile_pic || null,
      }
    } else {
      return {
        name: `${data.first_name || 'Cliente'} ${data.last_name || 'Messenger'}`.trim(),
        pic: data.profile_pic || null,
      }
    }
  } catch (e) {
    console.error(`Erro ao consultar perfil do ${platform}:`, e)
    return { name: `Cliente ${platform === 'instagram' ? 'Instagram' : 'Messenger'}`, pic: null }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method === 'GET') {
    const url = new URL(req.url)
    if (
      url.searchParams.get('hub.mode') === 'subscribe' &&
      url.searchParams.get('hub.verify_token') === waVerifyToken
    ) {
      return new Response(url.searchParams.get('hub.challenge'), { status: 200 })
    }
    return new Response('Token inválido', { status: 403 })
  }

  const body = await req.json()
  console.log("Nova requisição POST recebida na rota 'receive-leads':", JSON.stringify(body))

  const isWa = body.object === 'whatsapp_business_account'
  const isPage = body.object === 'page'
  const isInstagram = body.object === 'instagram'

  const processWebhook = async () => {
    try {
      // A. Webhook de Comentários e Mensagens do Instagram / Messenger
      if (isPage || isInstagram) {
        const entry = body.entry?.[0]
        const changes = entry?.changes?.[0]

        // Comentários do Facebook (feed) ou Instagram (comments)
        if (changes?.field === 'feed' || changes?.field === 'comments') {
          const val = changes.value
          const isComment = val.item === 'comment' || changes.field === 'comments'
          const verb = val.verb || 'add'

          if (isComment && (verb === 'add' || !val.verb)) {
            const platform = isInstagram ? 'instagram' : 'facebook'
            await supabase.from('social_comments').insert({
              platform: platform,
              post_id: val.post_id || val.media?.id,
              comment_id: val.comment_id || val.id,
              from_name: val.from?.name || val.from?.username || 'Usuário',
              from_id: val.from?.id,
              message: val.message || val.text,
            })
            console.log(`Comentário de ${platform} registrado no banco com sucesso.`)
          }
          return
        }

        // Mensagens Privadas (DMs de Instagram e Facebook Messenger)
        const messagingEvent = entry?.messaging?.[0]
        if (messagingEvent && messagingEvent.message) {
          const senderId = messagingEvent.sender.id
          const platform = isInstagram ? 'instagram' : 'messenger'

          let messageText = messagingEvent.message.text

          // SUPORTE A RESPOSTAS DE STORIES E REAÇÕES NO INSTAGRAM (Fator de Sucesso)
          if (!messageText && messagingEvent.message.reply_to?.story) {
            console.log('Mensagem sem texto detectada como uma resposta de Story do Instagram.')
            messageText = '[Reagiu ao Story / Mencionou você em um Story]'
          }

          console.log(`DM recebida via ${platform}. Remetente: ${senderId}, Texto: ${messageText}`)

          if (!messageText) return

          // Buscar ou Criar Lead de forma segura pelo ID de rede social
          let { data: lead, error: selectError } = await supabase
            .from('leads')
            .select('*')
            .eq('external_lead_id', senderId)
            .maybeSingle()

          if (selectError) console.error('Erro na busca de lead:', selectError)

          if (!lead) {
            console.log(`Buscando nome do perfil comercial do Meta para o ID: ${senderId}...`)
            const profile = await fetchMetaProfile(platform, senderId)

            const { data: newLead, error: insertError } = await supabase
              .from('leads')
              .insert({
                nome: profile.name,
                origem: platform,
                source: platform,
                tipo: 'compra',
                status: 'novo',
                external_lead_id: senderId,
              })
              .select()
              .maybeSingle()

            if (insertError) console.error('Erro ao inserir lead de rede social:', insertError)
            lead = newLead
          }

          if (!lead) return

          // Salvar mensagem recebida
          await supabase.from('conversation_history').insert({
            lead_id: lead.id,
            sender: 'client',
            message_text: messageText,
          })

          // Montar histórico para o Gemini
          const { data: history } = await supabase
            .from('conversation_history')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at')

          const geminiHistory = (history || []).map((m: any) => ({
            role: m.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: m.message_text }],
          }))

          const aiRes = await runGemini(geminiHistory)
          console.log('Resposta bruta gerada pelo Gemini:', JSON.stringify(aiRes))

          let responseText = 'Como posso te ajudar hoje?'
          let temp = lead.temperatura
          let tradeIn = lead.trade_in_car
          let payMethod = lead.payment_method

          try {
            const rawText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const jsonStr = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)?.[1] || rawText
            const parsed = JSON.parse(jsonStr)
            if (parsed.reply) responseText = parsed.reply
            if (parsed.temperature) temp = parsed.temperature
            if (parsed.trade_in_car) tradeIn = parsed.trade_in_car
            if (parsed.payment_method) payMethod = parsed.payment_method
          } catch (e) {
            console.error('Failed to parse Gemini JSON')
          }

          // Atualizar ficha do lead
          await supabase
            .from('leads')
            .update({
              temperatura: temp,
              trade_in_car: tradeIn,
              payment_method: payMethod,
            })
            .eq('id', lead.id)

          // Gravar resposta no banco
          await supabase.from('conversation_history').insert({
            lead_id: lead.id,
            sender: 'bot',
            message_text: responseText,
          })

          // Enviar resposta de volta para o Direct
          await sendPageMessage(platform, senderId, responseText)
          console.log(`Resposta enviada com sucesso de volta ao ${platform}!`)
          return
        }
      }

      // B. Webhook de Mensagens do WhatsApp
      if (isWa) {
        const entry = body.entry?.[0]?.changes?.[0]?.value
        if (!entry?.messages) return

        const message = entry.messages[0]
        const phone = message.from
        const profileName = entry.contacts?.[0]?.profile?.name || 'Cliente'
        let text = message.text?.body

        // Processar Mensagens de Áudio com Mime-Type Sanitizado
        let audioData = null
        if (message.type === 'audio') {
          console.log('Mensagem de áudio recebida do WhatsApp. Baixando mídia...')
          const mediaId = message.audio.id
          const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${waToken}` },
          })
          const mediaObj = await mediaRes.json()
          if (mediaObj.url) {
            const audioRes = await fetch(mediaObj.url, {
              headers: { Authorization: `Bearer ${waToken}` },
            })
            const buffer = await audioRes.arrayBuffer()
            audioData = encodeBase64(new Uint8Array(buffer))
          }
        }

        if (!text && !audioData) return

        let { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('telefone', phone)
          .maybeSingle()

        if (!lead) {
          const { data: newLead, error: insertError } = await supabase
            .from('leads')
            .insert({
              nome: profileName,
              telefone: phone,
              origem: 'whatsapp',
              tipo: 'compra',
              status: 'novo',
            })
            .select()
            .maybeSingle()

          if (insertError) console.error('Erro ao inserir lead de WhatsApp:', insertError)
          lead = newLead
        }

        if (!lead) return

        await supabase.from('conversation_history').insert({
          lead_id: lead.id,
          sender: 'client',
          message_text: text || '[Mensagem de Áudio]',
        })

        const { data: history } = await supabase
          .from('conversation_history')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at')

        const geminiHistory = (history || []).map((m: any) => ({
          role: m.sender === 'bot' ? 'model' : 'user',
          parts: [{ text: m.message_text }],
        }))

        if (audioData) {
          // Sanitização do Mime-Type (Garante compatibilidade com o Gemini)
          const cleanMimeType = (message.audio.mime_type || 'audio/ogg').split(';')[0].trim()

          geminiHistory[geminiHistory.length - 1] = {
            role: 'user',
            parts: [
              { inlineData: { mimeType: cleanMimeType, data: audioData } },
              { text: 'Transcreva e responda a este áudio.' },
            ],
          }
        }

        const aiRes = await runGemini(geminiHistory)
        let responseText = 'Como posso te ajudar hoje?'
        let temp = lead.temperatura
        let tradeIn = lead.trade_in_car
        let payMethod = lead.payment_method

        try {
          const rawText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const jsonStr = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)?.[1] || rawText
          const parsed = JSON.parse(jsonStr)
          if (parsed.reply) responseText = parsed.reply
          if (parsed.temperature) temp = parsed.temperature
          if (parsed.trade_in_car) tradeIn = parsed.trade_in_car
          if (parsed.payment_method) payMethod = parsed.payment_method
        } catch (e) {
          console.error('Failed to parse Gemini JSON')
        }

        await supabase
          .from('leads')
          .update({
            temperatura: temp,
            trade_in_car: tradeIn,
            payment_method: payMethod,
          })
          .eq('id', lead.id)

        await supabase.from('conversation_history').insert({
          lead_id: lead.id,
          sender: 'bot',
          message_text: responseText,
        })

        await sendWhatsApp(phone, responseText)
        return
      }

      // C. Webhook de Portais (Webmotors, iCarros, OLX, Site)
      const nome = body.nome?.trim()
      const portalPhoneRaw = body.telefone || body.phone
      const portalPhone = portalPhoneRaw ? String(portalPhoneRaw).replace(/\D/g, '').trim() : ''
      const source = body.origem || body.source || 'site'
      const veiculo = body.veiculo || body.veiculo_interesse || ''

      if (body.ping === 'pong' || body.test === true || body.action === 'ping') {
        return
      }

      if (!nome || nome === 'Cliente' || !portalPhone || portalPhone.length < 8) {
        return
      }

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
        .maybeSingle()

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
    } catch (error) {
      console.error('Erro no processamento do webhook:', error)
    }
  }

  // Resposta imediata de 200 OK para o Meta para evitar duplicações por timeout
  if (isWa || isPage || isInstagram) {
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

  await processWebhook()
  return new Response('ok', { headers: corsHeaders })
})
