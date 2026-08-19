import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { processWhatsAppCommand, AUTHORIZED_PHONE } from '../_shared/whatsapp-commands.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Meta Webhook Verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe') {
      const verifyToken = Deno.env.get('META_VERIFY_TOKEN') || 'kmzero_meta_token'
      if (token === verifyToken) {
        return new Response(challenge, { status: 200 })
      }
      return new Response('Forbidden', { status: 403 })
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const portal = url.searchParams.get('portal') || 'Desconhecido'

    const bodyText = await req.text()
    let body: any = {}
    if (bodyText) {
      try {
        body = JSON.parse(bodyText)
      } catch (e) {
        console.error('Invalid JSON body', e)
      }
    }

    // Check if it's Meta Webhook
    if (body.object && ['instagram', 'page', 'whatsapp_business_account'].includes(body.object)) {
      // Log event
      await supabase.from('meta_webhook_logs').insert({
        platform: body.object,
        event_type: 'webhook_event',
        payload: body,
        processed: false,
      })

      // Process Entries
      for (const entry of body.entry || []) {
        // WhatsApp Business
        if (body.object === 'whatsapp_business_account') {
          for (const change of entry.changes || []) {
            if (change.value && change.value.messages) {
              for (const msg of change.value.messages) {
                const cleanPhone = msg.from.replace(/\D/g, '')
                const contact = change.value.contacts?.find((c: any) => c.wa_id === msg.from)
                const clienteNome = contact?.profile?.name || 'Cliente WhatsApp'

                // Find or create conversa
                let { data: conversa } = await supabase
                  .from('crm_conversas')
                  .select('id')
                  .eq('cliente_telefone', cleanPhone)
                  .eq('platform', 'whatsapp')
                  .maybeSingle()

                if (!conversa) {
                  const { data: newConversa } = await supabase
                    .from('crm_conversas')
                    .insert({
                      cliente_telefone: cleanPhone,
                      cliente_nome: clienteNome,
                      platform: 'whatsapp',
                      status: 'novo',
                    })
                    .select('id')
                    .single()
                  conversa = newConversa
                }

                if (conversa) {
                  let textContent = ''
                  if (msg.type === 'text') textContent = msg.text.body
                  else if (msg.type === 'image') textContent = '[Imagem]'
                  else if (msg.type === 'document') textContent = '[Documento]'
                  else textContent = `[Mensagem de tipo: ${msg.type}]`

                  await supabase.from('crm_mensagens').insert({
                    conversa_id: conversa.id,
                    direcao: 'inbound',
                    tipo: msg.type || 'texto',
                    conteudo: textContent,
                    meta_message_id: msg.id,
                    status: 'recebida',
                  })

                  if (cleanPhone === AUTHORIZED_PHONE && msg.type === 'text' && msg.text?.body) {
                    const cmdResponse = await processWhatsAppCommand(
                      msg.text.body,
                      cleanPhone,
                      Deno.env.get('SUPABASE_URL') ?? '',
                      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
                    )
                    if (cmdResponse) {
                      await supabase.from('agente_interacoes').insert({
                        usuario_telefone: cleanPhone,
                        mensagem_usuario: msg.text.body,
                        resposta_agente: cmdResponse,
                      })
                    }
                  }
                }
              }
            }
          }
        }

        // Instagram / Messenger
        if (['instagram', 'page'].includes(body.object)) {
          for (const messaging of entry.messaging || []) {
            if (messaging.message) {
              const senderId = messaging.sender.id
              const messageText = messaging.message.text || ''
              const messageId = messaging.message.mid

              // Handle story replies
              let finalMessageText = messageText
              if (messaging.message.reply_to && messaging.message.reply_to.story) {
                finalMessageText = `[Respondeu ao Story] ${messageText}`
                if (messaging.message.reply_to.story.url) {
                  finalMessageText += `\nLink do Story: ${messaging.message.reply_to.story.url}`
                }
              }

              if (finalMessageText) {
                let { data: conversa } = await supabase
                  .from('crm_conversas')
                  .select('id')
                  .eq('cliente_psid', senderId)
                  .eq('platform', body.object)
                  .maybeSingle()

                if (!conversa) {
                  const { data: newConversa } = await supabase
                    .from('crm_conversas')
                    .insert({
                      cliente_psid: senderId,
                      cliente_nome: `Cliente ${body.object === 'instagram' ? 'Instagram' : 'Facebook'}`,
                      platform: body.object,
                      status: 'novo',
                    })
                    .select('id')
                    .single()
                  conversa = newConversa
                }

                if (conversa) {
                  await supabase.from('crm_mensagens').insert({
                    conversa_id: conversa.id,
                    direcao: 'inbound',
                    tipo: 'texto',
                    conteudo: finalMessageText,
                    meta_message_id: messageId,
                    status: 'recebida',
                  })
                }
              }
            }
          }
        }
      }

      // Return 200 OK so Meta stops sending retries
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Authentication for Google Meu Negocio
    if (portal === 'GoogleMeuNegocio') {
      const authHeader = req.headers.get('authorization')
      const apiKeyHeader = req.headers.get('x-api-key')
      const expectedKey = 'GMN_LEAD_CARROCIA_BF939'

      const hasValidToken =
        authHeader === `Bearer ${expectedKey}` ||
        authHeader === expectedKey ||
        apiKeyHeader === expectedKey ||
        url.searchParams.get('key') === expectedKey ||
        body.google_key === expectedKey

      if (!hasValidToken) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Invalid or missing Webhook Key.' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // Map fields robustly
    let nome = body.name || body.displayName || body.cliente || ''
    let telefone = body.phoneNumber || body.phone || body.telefone || ''
    let email = body.email || ''

    if (body.user_column_data && Array.isArray(body.user_column_data)) {
      body.user_column_data.forEach((col: any) => {
        if (col.column_id === 'FULL_NAME') {
          nome = col.string_value || nome
        } else if (col.column_id === 'EMAIL') {
          email = col.string_value || email
        } else if (col.column_id === 'PHONE_NUMBER') {
          telefone = col.string_value || telefone
        }
      })
    }

    if (!nome) nome = 'Lead Portal'

    // Lead Validation: Basic format checking for phone numbers
    telefone = telefone.replace(/\D/g, '')

    const observacoes = JSON.stringify(body, null, 2)

    const { error } = await supabase.from('leads').insert({
      nome,
      telefone,
      email,
      origem: portal.toLowerCase(),
      tipo: 'comprador',
      status: 'novo',
      temperatura: 'morno',
      observacoes,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
