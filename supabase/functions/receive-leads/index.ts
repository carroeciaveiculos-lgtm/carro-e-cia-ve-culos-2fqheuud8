import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Meta Webhook Verification Token
const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'carro_e_cia_verify_123'
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '1231947963330780'
const WHATSAPP_WABA_ID = Deno.env.get('WHATSAPP_WABA_ID') || '1530053735172401'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!')
      return new Response(challenge, { status: 200 })
    } else {
      return new Response('Forbidden', { status: 403 })
    }
  }

  try {
    const payload = await req.json()
    console.log('Received payload:', JSON.stringify(payload))

    const platform =
      payload.object === 'instagram'
        ? 'instagram'
        : payload.object === 'whatsapp_business_account'
          ? 'whatsapp'
          : 'facebook'

    await supabase.from('meta_webhook_logs').insert({
      platform,
      event_type: payload.object,
      payload,
      processed: true,
    })

    if (
      payload.object === 'page' ||
      payload.object === 'instagram' ||
      payload.object === 'whatsapp_business_account'
    ) {
      const entries = payload.entry || []

      for (const entry of entries) {
        const changes = entry.changes || []

        for (const change of changes) {
          const field = change.field
          const value = change.value

          // 1. Handle Public Comments / Feed -> Moderador Dashboard
          if (field === 'feed' || field === 'comments') {
            if (value.item === 'comment' && value.verb !== 'remove') {
              await supabase.from('social_comments').insert({
                post_id: value.post_id || '',
                comment_id: value.comment_id || '',
                from_id: value.from?.id || '',
                from_name: value.from?.name || 'Unknown',
                message: value.message || '',
                platform: platform,
                is_replied: false,
              })
              console.log('Public comment logged to social_comments.')
            }
            continue // Skip lead generation for public comments
          }

          // 2. Handle Private Messages (DMs / WhatsApp) -> CRM
          if (field === 'messages') {
            if (payload.object === 'whatsapp_business_account') {
              console.log(
                `Processing WhatsApp message for Phone ID: ${WHATSAPP_PHONE_NUMBER_ID}, WABA ID: ${WHATSAPP_WABA_ID}`,
              )

              const messages = value.messages || []
              const contacts = value.contacts || []

              for (const msg of messages) {
                const contact = contacts.find((c: any) => c.wa_id === msg.from)
                const senderName = contact?.profile?.name || 'Cliente WhatsApp'
                const senderPhone = msg.from
                const messageText = msg.text?.body || ''

                const { data: leads } = await supabase
                  .from('leads')
                  .select('id')
                  .eq('telefone', senderPhone)
                  .limit(1)

                let leadId = leads?.[0]?.id

                if (!leadId) {
                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      nome: senderName,
                      telefone: senderPhone,
                      origem: 'whatsapp',
                      source: 'whatsapp',
                      tipo: 'compra',
                      status: 'novo',
                    })
                    .select()
                    .single()
                  leadId = newLead?.id
                }

                if (leadId) {
                  await supabase.from('conversation_history').insert({
                    lead_id: leadId,
                    sender: senderName,
                    message_text: messageText,
                  })

                  // Lógica para o Skip IA integrar no tratamento da resposta do Gemini em 'receive-leads'
                  /*
                  try {
                    const aiRes = await callGeminiAI(messageText);
                    const rawText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || ''
                    const jsonStr = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)?.[1] || rawText
                    const parsed = JSON.parse(jsonStr)
                    
                    // NOVA ATUALIZAÇÃO: Se o Gemini capturar dados cadastrais, atualiza o Lead no Supabase
                    if (parsed.extracted_data) {
                      const dataUpdate: any = {}
                      if (parsed.extracted_data.nome_completo) dataUpdate.nome = parsed.extracted_data.nome_completo
                      if (parsed.extracted_data.cpf) dataUpdate.cpf = parsed.extracted_data.cpf
                      if (parsed.extracted_data.email) dataUpdate.email = parsed.extracted_data.email
                      if (parsed.extracted_data.cep) dataUpdate.observacoes = `CEP: ${parsed.extracted_data.cep}`
                      if (parsed.extracted_data.valor_entrada) dataUpdate.faixa_preco = `Entrada de R$ ${parsed.extracted_data.valor_entrada}`
                      
                      if (Object.keys(dataUpdate).length > 0) {
                        console.log("Atualizando dados cadastrais capturados pela IA:", JSON.stringify(dataUpdate));
                        await supabase.from('leads').update(dataUpdate).eq('id', leadId)
                      }
                    }
                  } catch(e) {
                    console.error('Failed to parse Gemini JSON')
                  }
                  */
                }
              }
            } else {
              const senderId = value.sender?.id
              const messageText = value.message?.text

              if (senderId && messageText) {
                const { data: leads } = await supabase
                  .from('leads')
                  .select('id')
                  .eq('external_lead_id', senderId)
                  .limit(1)

                let leadId = leads?.[0]?.id

                if (!leadId) {
                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      nome: `Lead ${platform}`,
                      external_lead_id: senderId,
                      origem: platform,
                      source: platform,
                      status: 'novo',
                    })
                    .select()
                    .single()
                  leadId = newLead?.id
                }

                if (leadId) {
                  await supabase.from('conversation_history').insert({
                    lead_id: leadId,
                    sender: 'Lead',
                    message_text: messageText,
                  })
                }
              }
            }
          }
        }
      }
    }

    if (payload.nome && payload.telefone && !payload.object) {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          nome: payload.nome,
          telefone: payload.telefone,
          email: payload.email,
          origem: payload.origem || 'site',
          veiculo_interesse: payload.veiculo_interesse,
          status: 'novo',
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, lead: newLead }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
