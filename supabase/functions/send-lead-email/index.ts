import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_gNKcmAnQ_NyzW7K8kj1Mgbf7AnJzXGoQj'
const TO_EMAIL = 'contato@carroeciamotors.com.br'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.json()
  const nome = body.nome ?? ''
  const telefone = body.telefone ?? ''
  const email = body.email ?? 'Nao informado'
  const mensagem = body.mensagem ?? 'Sem mensagem'
  const origem = body.origem ?? ''
  const veiculo = body.veiculo ?? 'Nao informado'

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
    '<div style="background:#C0392B;padding:20px;text-align:center">' +
    '<h1 style="color:white;margin:0">Carro e Cia Veiculos</h1>' +
    '<p style="color:#fff;margin:5px 0">Novo contato pelo site!</p>' +
    '</div>' +
    '<div style="padding:30px;background:#f9f9f9">' +
    '<h2 style="color:#C0392B">Dados do Lead</h2>' +
    '<p><b>Nome:</b> ' +
    nome +
    '</p>' +
    '<p><b>Telefone:</b> ' +
    telefone +
    '</p>' +
    '<p><b>E-mail:</b> ' +
    email +
    '</p>' +
    '<p><b>Veiculo:</b> ' +
    veiculo +
    '</p>' +
    '<p><b>Mensagem:</b> ' +
    mensagem +
    '</p>' +
    '<p><b>Origem:</b> ' +
    origem +
    '</p>' +
    '</div>' +
    '<div style="background:#1A1A1A;padding:15px;text-align:center">' +
    '<p style="color:#888;font-size:12px;margin:0">Carro e Cia Veiculos - Uberaba, MG</p>' +
    '</div>' +
    '</div>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: TO_EMAIL,
      subject: 'Novo Lead - ' + origem + ' | Carro e Cia',
      html: htmlBody,
    }),
  })

  const data = await res.json()

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
