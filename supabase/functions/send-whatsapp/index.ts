import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const R2_BASE_URL = 'https://imagens.carroeciamotors.com.br'

// Achado 15/09/2026: fotos sincronizadas do Google Drive nao passam pelo
// resize que o formulario de cadastro ja faz (src/lib/image-resize.ts) --
// ficam no tamanho bruto da camera do celular, as vezes >5MB. WhatsApp
// recusa qualquer imagem acima de 5MB (erro 131053 "Media upload error"),
// e a falha e assincrona/silenciosa -- ninguem ficava sabendo que a foto
// nao chegou no cliente. Redimensiona via Cloudflare Image Resizing (zona
// ja habilitada, mesmo mecanismo usado no site -- ver
// src/lib/image-utils.ts, applyCloudflareResize) antes de mandar pro Meta.
// Nao mexe em URL que nao seja da nossa zona R2 (link externo passa direto).
function otimizarImagemParaWhatsApp(url: string): string {
  if (!url || !url.startsWith(R2_BASE_URL)) return url
  if (url.includes('/cdn-cgi/image/')) return url
  const pathAndQuery = url.slice(R2_BASE_URL.length)
  return `${R2_BASE_URL}/cdn-cgi/image/width=1280,quality=75,format=jpeg${pathAndQuery}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { action, to, templateName, components, documentUrl, filename, text, leadId } = payload
    // origem declara quem está chamando esta function, pra gravar o sender
    // certo no histórico e decidir se desliga a Clara pro lead (ver abaixo).
    // Default 'sistema' é a opção mais segura pra chamada antiga sem esse
    // campo — nunca desliga a IA por engano.
    const origem: 'atendente' | 'clara' | 'sistema' =
      payload.origem === 'atendente' || payload.origem === 'clara' ? payload.origem : 'sistema'

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
        link: otimizarImagemParaWhatsApp(documentUrl),
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

    let iaDesligadaAgora = false
    if (leadId) {
      let msgText = text || `[Template: ${templateName}]`
      if (action === 'document') msgText = `[Documento Enviado: ${filename}] ${text || ''}`
      // Achado 23/08/2026: gravava só o rótulo "[Imagem Enviada]", sem a
      // URL — o painel não tinha como mostrar a imagem de volta, só o
      // texto. Usa o mesmo formato [IMAGEM]<url> que receive-leads grava
      // pra foto recebida do cliente, pra ConversationPanel.tsx renderizar
      // os dois lados da conversa igual.
      if (action === 'image') msgText = `[IMAGEM]${documentUrl}${text ? '\n' + text : ''}`

      // Achado 17/09/2026: antes desta correção, todo envio por aqui gravava
      // sender:'human' sem checar quem chamou — a foto/vídeo de veículo que
      // a própria Clara manda (ai-sdr, enviar_midia_veiculo) e a mensagem de
      // boas-vindas automática do ml-webhook ficavam com o rótulo errado.
      const { error: dbError } = await supabase.from('conversation_history').insert({
        lead_id: leadId,
        sender: origem === 'atendente' ? 'human' : 'bot',
        message_text: msgText,
      })
      if (dbError) console.error('Erro ao gravar histórico do vendedor:', dbError)

      // Atendente respondendo texto de verdade pelo painel = assumiu a
      // conversa, desliga a Clara pra esse lead. Foto/documento/template
      // avulsos do mesmo atendente NÃO desligam (decisão da Adriana,
      // 17/09/2026) — só resposta de texto conta.
      const ehTextoLivre = !['template', 'document', 'image', 'video'].includes(action)
      if (origem === 'atendente' && ehTextoLivre) {
        const { error: aiOffError } = await supabase
          .from('leads')
          .update({ ai_enabled: false })
          .eq('id', leadId)
        if (aiOffError) console.error('Erro ao desligar IA do lead:', aiOffError)
        else iaDesligadaAgora = true
      }
    }

    // `ia_desligada_agora` avisa o painel que essa chamada específica foi a
    // que desligou a Clara (pedido da Adriana, 17/09/2026) — o toggle já
    // reflete o estado via realtime, mas sem isso o atendente só percebe se
    // olhar o toggle depois.
    return new Response(JSON.stringify({ ...data, ia_desligada_agora: iaDesligadaAgora }), {
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
