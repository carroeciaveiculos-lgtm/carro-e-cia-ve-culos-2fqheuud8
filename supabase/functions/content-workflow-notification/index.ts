import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, authorName, authorEmail, link } = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not found. Skipping email.')
      return new Response(JSON.stringify({ message: 'Email skipped, no API key' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Revisão de Conteúdo Pendente</h2>
        <p>Olá, equipe!</p>
        <p>Um novo conteúdo foi enviado para revisão e aguarda aprovação no painel administrativo.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Título:</strong> ${title}</p>
          <p style="margin: 0 0 10px 0;"><strong>Autor:</strong> ${authorName} (${authorEmail})</p>
          <p style="margin: 0;"><strong>Status:</strong> Em Revisão</p>
        </div>
        
        <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Revisar Conteúdo
        </a>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Notificações Carro e Cia <no-reply@carroeciamotors.com.br>',
        to: ['adriana.araujo@kmzero.com.br', authorEmail].filter(Boolean),
        subject: `Revisão Pendente: ${title}`,
        html,
      }),
    })

    if (!res.ok) {
      throw new Error(`Resend error: ${await res.text()}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
