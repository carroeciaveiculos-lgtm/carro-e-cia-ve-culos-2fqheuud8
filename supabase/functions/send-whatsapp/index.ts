import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const { action, to, templateName, components, documentUrl, filename, text, leadId } = await req.json()
  const waToken = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') || Deno.env.get('WHATSAPP_TOKEN')!
  const waPhoneId = Deno.env.get('META_PHONE_NUMBER_ID') || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let body: any = {
    messaging_product: 'whatsapp',
    to: to.replace(/\D/g, ''),
  }

  if (action === 'template') {
    body.type = 'template';
    body.template = {
      name: templateName,
      language: { code: 'pt_BR' },
      components: components || []
    }
  } else if (action === 'document') {
    body.type = 'document';
    body.document = {
      link: documentUrl,
      filename: filename || 'documento.pdf',
      caption: text || ''
    }
  } else {
    body.type = 'text';
    body.text = { body: text }
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await res.json()
  
  if (res.ok && leadId) {
    let msgText = text || `[Template: ${templateName}]`
    if (action === 'document') msgText = `[Documento Enviado: ${filename}] ${text||''}`
    await supabase.from('conversation_history').insert({
      lead_id: leadId,
      sender: 'human',
      message_text: msgText
    })
  }

  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
