import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { action, to, templateName, components, documentUrl, filename, text, leadId } = payload

    if (!to) {
      return new Response(JSON.stringify({ error: "O número 'to' é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cleanTo = String(to).replace(/\D/g, '')
    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
    const waPhoneId =
      Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let body: any = {
      messaging_product: 'whatsapp',
      to: cleanTo,
    }

    if (action === 'template') {
      body.type = 'template'
      body.template = {
        name: templateName,
        language: { code: 'pt_BR' },
        components: components || [],
      }
    } else if (action === 'document') {
      body.type = 'document'
      body.document = {
        link: documentUrl,
        filename: filename || 'documento.pdf',
        caption: text || '',
      }
    } else if (action === 'image') {
      // Permite o envio de fotos do estoque pelo chat do CRM
      body.type = 'image'
      body.image = {
        link: documentUrl,
        caption: text || '',
      }
    } else if (action === 'video') {
      // Adicionado em 12/08/2026 pra Clara mandar vídeo do veículo — espelha
      // o branch 'image' acima.
      body.type = 'video'
      body.video = {
        link: documentUrl,
        caption: text || '',
      }
    } else {
      body.type = 'text'
      body.text = { body: text }
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Erro retornado pelo WhatsApp do Meta:', JSON.stringify(data))
      return new Response(JSON.stringify({ error: 'Meta API Error', details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (leadId) {
      let msgText = text || `[Template: ${templateName}]`
      if (action === 'document') msgText = `[Documento Enviado: ${filename}] ${text || ''}`
      if (action === 'image') msgText = `[Imagem Enviada] ${text || ''}`

      const { error: dbError } = await supabase.from('conversation_history').insert({
        lead_id: leadId,
        sender: 'human',
        message_text: msgText,
      })
      if (dbError) console.error('Erro ao gravar histórico do vendedor:', dbError)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
