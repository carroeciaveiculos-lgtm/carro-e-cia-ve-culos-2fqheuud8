import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SITE_URL = 'https://www.carroeciamotors.com.br'

function respondGeneric() {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Se esse e-mail estiver cadastrado, enviamos um link de redefinição.',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'E-mail é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // generateLink (admin) só GERA o link, não manda e-mail nenhum — quem
    // manda é a gente, pelo Resend, pra manter tudo no mesmo remetente
    // verificado das outras notificações do sistema.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${SITE_URL}/admin/redefinir-senha` },
    })

    if (error || !data?.properties?.action_link) {
      // Não revela se o e-mail existe ou não (evita enumeração de contas) —
      // só loga pro diagnóstico interno.
      console.error('Falha ao gerar link de redefinição:', error?.message)
      return respondGeneric()
    }

    if (RESEND_API_KEY) {
      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0D47A1;padding:20px;text-align:center">
            <h1 style="color:white;margin:0">Carro e Cia Veículos</h1>
            <p style="color:#fff;margin:5px 0">Redefinição de senha — Painel Administrativo</p>
          </div>
          <div style="padding:30px;background:#f9f9f9">
            <p>Alguém (esperamos que você) pediu pra redefinir a senha do painel administrativo.</p>
            <p style="text-align:center;margin:24px 0">
              <a href="${data.properties.action_link}" style="display:inline-block;background:#1565C0;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Redefinir senha</a>
            </p>
            <p style="font-size:13px;color:#666">Se não foi você, ignore este e-mail — sua senha continua a mesma.</p>
          </div>
          <div style="background:#1A1A1A;padding:15px;text-align:center">
            <p style="color:#888;font-size:12px;margin:0">Carro e Cia Veículos — Uberaba, MG</p>
          </div>
        </div>
      `
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Carro e Cia Veículos <contato@carroeciamotors.com.br>',
          to: email,
          subject: 'Redefinição de senha — Carro e Cia',
          html: htmlBody,
        }),
      })
      if (!emailRes.ok) {
        console.error(
          'Resend recusou o e-mail de redefinição:',
          emailRes.status,
          await emailRes.text(),
        )
      }
    } else {
      console.error('RESEND_API_KEY não configurada — link de redefinição não enviado')
    }

    return respondGeneric()
  } catch (e) {
    console.error('Erro em esqueci-senha:', e)
    return respondGeneric()
  }
})
