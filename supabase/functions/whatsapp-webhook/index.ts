import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { processWhatsAppCommand, AUTHORIZED_PHONE } from '../_shared/whatsapp-commands.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe') {
      const verifyToken =
        Deno.env.get('WHATSAPP_VERIFY_TOKEN') ||
        Deno.env.get('META_VERIFY_TOKEN') ||
        'kmzero_meta_token'
      if (token === verifyToken) return new Response(challenge, { status: 200 })
      return new Response('Forbidden', { status: 403 })
    }
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    const waToken = Deno.env.get('WHATSAPP_TOKEN') ?? ''
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''

    const body = await req.json()

    if (body.object !== 'whatsapp_business_account') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (!change.value?.messages) continue

        for (const msg of change.value.messages) {
          const fromPhone = msg.from?.replace(/\D/g, '')
          if (!fromPhone) continue

          const contact = change.value.contacts?.find((c: any) => c.wa_id === msg.from)
          const clienteNome = contact?.profile?.name || 'Cliente'
          let textContent = ''
          if (msg.type === 'text') textContent = msg.text?.body || ''

          if (fromPhone === AUTHORIZED_PHONE && textContent) {
            const response = await processWhatsAppCommand(
              textContent,
              fromPhone,
              supabaseUrl,
              supabaseKey,
            )

            await supabase.from('agente_interacoes').insert({
              usuario_telefone: fromPhone,
              mensagem_usuario: textContent,
              resposta_agente: response || '',
            })

            if (response && waToken && waPhoneId) {
              await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: fromPhone,
                  type: 'text',
                  text: { body: response },
                }),
              })
            }
            continue
          }

          if (textContent) {
            let { data: conversa } = await supabase
              .from('crm_conversas')
              .select('id')
              .eq('cliente_telefone', fromPhone)
              .eq('platform', 'whatsapp')
              .maybeSingle()

            if (!conversa) {
              const { data: newConv } = await supabase
                .from('crm_conversas')
                .insert({
                  cliente_telefone: fromPhone,
                  cliente_nome: clienteNome,
                  platform: 'whatsapp',
                  status: 'novo',
                })
                .select('id')
                .single()
              conversa = newConv
            }

            if (conversa) {
              await supabase.from('crm_mensagens').insert({
                conversa_id: conversa.id,
                direcao: 'inbound',
                tipo: 'text',
                conteudo: textContent,
                meta_message_id: msg.id,
                status: 'recebida',
              })
            }
          }
        }
      }
    }

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
