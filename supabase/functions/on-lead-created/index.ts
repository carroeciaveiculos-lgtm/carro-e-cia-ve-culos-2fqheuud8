import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

  try {
    const body = await req.json()
    const record = body.record || body

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { nome, email, telefone } = record

    // 1. E-mail de Boas-Vindas Automático (Resend)
    if (email) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_API_KEY) {
        const htmlBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:10px;overflow:hidden">
            <div style="background:#C0392B;padding:20px;text-align:center">
              <h1 style="color:white;margin:0">Carro e Cia Veículos</h1>
            </div>
            <div style="padding:30px;background:#f9f9f9">
              <h2 style="color:#C0392B;margin-top:0">Olá ${nome},</h2>
              <p style="font-size:16px;line-height:1.5">A Carro e Cia recebeu seus dados com sucesso. Nosso especialista já está analisando as informações do seu veículo e entrará em contato com você em menos de 15 minutos com a melhor proposta do mercado.</p>
              <p style="font-size:16px;line-height:1.5">Obrigado por confiar na equipe que mais entende de carros em Uberaba!</p>
            </div>
          </div>
        `
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'emailmarketing@carroeciamotors.com.br',
            to: email,
            subject: 'Recebemos seus dados! | Carro e Cia',
            html: htmlBody,
          }),
        }).catch(console.error)
      }
    }

    // 2. Injeção Direta no Brevo (Assíncrono e Resiliente)
    if (email) {
      const { data: config } = await supabase
        .from('configuracoes_api')
        .select('*')
        .eq('portal', 'Brevo')
        .single()

      if (config && config.ativo && config.api_key && config.auth_token) {
        const listId = parseInt(config.auth_token, 10)
        if (!isNaN(listId)) {
          const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'api-key': config.api_key,
            },
            body: JSON.stringify({
              email: email,
              attributes: {
                NOME: nome,
                WHATSAPP: telefone,
              },
              listIds: [listId],
              updateEnabled: true,
            }),
          })

          if (!brevoRes.ok) {
            const err = await brevoRes.text()
            // Logar falha de integração silenciosamente sem travar o lead
            await supabase.from('logs_integracao').insert({
              portal: 'Brevo',
              status: 'falha',
              payload_erro: { error: err, email },
            })
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
