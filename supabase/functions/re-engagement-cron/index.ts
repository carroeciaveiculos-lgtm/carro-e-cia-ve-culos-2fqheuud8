import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: leads } = await supabase
    .from('leads')
    .select('id, telefone, nome, status, temperatura')
    .eq('temperatura', 'frio')
    .neq('status', 'perdido')
    .neq('status', 'fechado')
    .lt('updated_at', sevenDaysAgo.toISOString())

  for (const lead of leads || []) {
    if (lead.telefone) {
      const waToken = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') || Deno.env.get('WHATSAPP_TOKEN')!
      const waPhoneId =
        Deno.env.get('META_PHONE_NUMBER_ID') || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!

      await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: lead.telefone.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: 'reengajamento_frio',
            language: { code: 'pt_BR' },
            components: [{ type: 'body', parameters: [{ type: 'text', text: lead.nome }] }],
          },
        }),
      })

      await supabase.from('conversation_history').insert({
        lead_id: lead.id,
        sender: 'bot',
        message_text: '[Template Automático de Reengajamento Enviado]',
      })

      await supabase
        .from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', lead.id)
    }
  }

  return new Response(JSON.stringify({ success: true, count: leads?.length }), {
    headers: corsHeaders,
  })
})
