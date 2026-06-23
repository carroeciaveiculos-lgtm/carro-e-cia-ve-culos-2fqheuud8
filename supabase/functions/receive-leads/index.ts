import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeBase64 } from "jsr:@std/encoding/base64"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const geminiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')!
const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!
const waVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || Deno.env.get('META_VERIFY_TOKEN')!

const SYSTEM_PROMPT = `Você é o Luiz, SDR digital da Carro e Cia Motors.
Responda sempre em formato JSON válido com as seguintes chaves:
{
  "reply": "Sua resposta amigável e direta ao cliente (máx 3 linhas)",
  "temperature": "frio", "morno" ou "quente",
  "trade_in_car": "Modelo do carro de troca mencionado ou null",
  "payment_method": "Forma de pagamento mencionada (financiamento, a vista, consorcio) ou null"
}
Regra: Foco em agendar visitas à loja; NUNCA ofereça descontos. Seja prestativo.`

async function runGemini(history: any[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
  const reqBody = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history,
    generationConfig: { responseMimeType: "application/json" }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  })
  return res.json()
}

async function sendWhatsApp(to: string, text: string) {
  if (!waToken) return
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

  if (req.method === 'GET') {
    const url = new URL(req.url)
    if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === waVerifyToken) {
      return new Response(url.searchParams.get('hub.challenge'), { status: 200 })
    }
    return new Response('Token inválido', { status: 403 })
  }

  const body = await req.json()
  const isWa = body.object === 'whatsapp_business_account'
  const isPage = body.object === 'page' || body.object === 'instagram'

  if (isPage) {
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    
    // Facebook/Instagram Comments Webhook
    if (changes?.field === 'feed') {
      const val = changes.value
      if (val.item === 'comment' && val.verb === 'add') {
        await supabase.from('social_comments').insert({
          platform: 'facebook',
          post_id: val.post_id,
          comment_id: val.comment_id,
          from_name: val.from.name,
          from_id: val.from.id,
          message: val.message
        })
      }
      return new Response('ok', { headers: corsHeaders, status: 200 })
    }
  }

  if (isWa) {
    const entry = body.entry?.[0]?.changes?.[0]?.value
    if (!entry?.messages) return new Response('ok', { headers: corsHeaders, status: 200 })

    const message = entry.messages[0]
    const phone = message.from
    const profileName = entry.contacts?.[0]?.profile?.name || 'Cliente'
    let text = message.text?.body

    // Handle Voice Messages
    let audioData = null
    if (message.type === 'audio') {
      const mediaId = message.audio.id
      const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, { headers: { Authorization: `Bearer ${waToken}` } })
      const mediaObj = await mediaRes.json()
      if (mediaObj.url) {
        const audioRes = await fetch(mediaObj.url, { headers: { Authorization: `Bearer ${waToken}` } })
        const buffer = await audioRes.arrayBuffer()
        audioData = encodeBase64(new Uint8Array(buffer))
      }
    }

    if (!text && !audioData) return new Response('ok', { headers: corsHeaders })

    let { data: lead } = await supabase.from('leads').select('*').eq('telefone', phone).maybeSingle()

    if (!lead) {
      const { data: newLead } = await supabase.from('leads').insert({
        nome: profileName, telefone: phone, origem: 'whatsapp', tipo: 'compra', status: 'novo'
      }).select().single()
      lead = newLead
    }

    await supabase.from('conversation_history').insert({
      lead_id: lead.id, sender: 'client', message_text: text || '[Mensagem de Áudio]'
    })

    const { data: history } = await supabase.from('conversation_history').select('*').eq('lead_id', lead.id).order('created_at')

    const geminiHistory: any[] = (history || []).map((m: any) => ({
      role: m.sender === 'bot' ? 'model' : 'user',
      parts: [{ text: m.message_text }],
    }))

    if (audioData) {
      geminiHistory[geminiHistory.length - 1] = {
        role: 'user',
        parts: [
          { inlineData: { mimeType: message.audio.mime_type || 'audio/ogg', data: audioData } },
          { text: 'Transcreva e responda a este áudio.' }
        ]
      }
    }

    const aiRes = await runGemini(geminiHistory)
    let responseText = "Como posso te ajudar hoje?"
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
    } catch(e) {
      console.error('Failed to parse Gemini JSON')
    }

    await supabase.from('leads').update({
      temperatura: temp, trade_in_car: tradeIn, payment_method: payMethod
    }).eq('id', lead.id)

    await supabase.from('conversation_history').insert({
      lead_id: lead.id, sender: 'bot', message_text: responseText
    })

    await sendWhatsApp(phone, responseText)
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  return new Response('ok', { headers: corsHeaders })
})
