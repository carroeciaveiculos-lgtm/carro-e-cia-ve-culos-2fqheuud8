import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { veiculo_id, marca, modelo, ano_modelo, preco_venda, placa } = await req.json()

    if (!marca || !modelo) {
      return new Response(JSON.stringify({ error: 'Missing vehicle data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formattedPrice = Number(preco_venda || 0).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL',
    })

    const message = [
      `🚗 *NOVO VEÍCULO NO ESTOQUE!*`,
      ``,
      `*${marca} ${modelo}*`,
      `Ano: ${ano_modelo || 'N/A'}`,
      `Placa: ${placa || 'N/A'}`,
      `Preço: ${formattedPrice}`,
      ``,
      `Acesse o painel administrativo para mais detalhes.`,
    ].join('\n')

    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') || ''
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || ''
    const salesTeamPhone = (Deno.env.get('WHATSAPP_SALES_TEAM_PHONE') || '5534997384177').replace(/\D/g, '')

    if (waToken && waPhoneId) {
      const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: salesTeamPhone,
          type: 'text',
          text: { body: message },
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('WhatsApp notification error:', JSON.stringify(errData))
      }
    } else {
      console.warn('WhatsApp credentials not configured for vehicle notification')
    }

    return new Response(JSON.stringify({ success: true, veiculo_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
