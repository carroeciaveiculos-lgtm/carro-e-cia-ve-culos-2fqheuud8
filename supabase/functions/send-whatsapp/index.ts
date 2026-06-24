import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const payload = await req.json()
    const { action, to, templateName, components, documentUrl, filename, text, leadId } = payload

    // 1. Validação de segurança básica de dados de entrada
    if (!to) {
      return new Response(
        JSON.stringify({ error: "O parâmetro 'to' (número de telefone) é obrigatório." }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanTo = String(to).replace(/\D/g, '')

    // Sincroniza dinamicamente as secrets do Supabase
    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let body: any = {
      messaging_product: 'whatsapp',
      to: cleanTo,
    }

    // 2. Mapeamento Inteligente de Mídias e Ações
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
    } else if (action === 'image') {
      // NOVA MELHORIA: Enviar fotos do estoque diretamente do CRM para o WhatsApp!
      body.type = 'image';
      body.image = {
        link: documentUrl, // Recebe a URL da imagem salva no seu Supabase Storage
        caption: text || ''
      }
    } else if (action === 'audio') {
      // NOVA MELHORIA: Suporte para enviar mensagens de áudio gravadas
      body.type = 'audio';
      body.audio = {
        link: documentUrl
      }
    } else {
      body.type = 'text';
      body.text = { body: text }
    }

    // 3. Disparar a mensagem para a API oficial do Meta
    console.log(`Disparando ação '${action}' para o WhatsApp ${cleanTo}...`);
    const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    
    if (!res.ok) {
      console.error("Erro retornado pela API do Meta:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Meta API Error", details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Se o envio deu certo e há um leadId, salva no histórico do CRM com a tag 'human'
    if (leadId) {
      let msgText = text || `[Template: ${templateName}]`
      if (action === 'document') msgText = `[Documento Enviado: ${filename}] ${text || ''}`
      if (action === 'image') msgText = `[Imagem Enviada] ${text || ''}`
      if (action === 'audio') msgText = `[Áudio Enviado]`

      console.log(`Gravando mensagem enviada pelo vendedor no histórico do lead ${leadId}...`);
      const { error: dbError } = await supabase.from('conversation_history').insert({
        lead_id: leadId,
        sender: 'human', // Identifica na Central de Comando como mensagem do vendedor
        message_text: msgText
      })

      if (dbError) {
        console.error("Erro ao gravar mensagem humana na tabela conversation_history:", dbError);
      }
    }

    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("Erro geral na função send-whatsapp:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})