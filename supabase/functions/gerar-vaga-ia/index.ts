import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { cargo, palavrasChave } = await req.json()
    if (!cargo) throw new Error('Informe o cargo da vaga')

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_APY_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada')

    const prompt = `Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG, com mais de 20 anos de mercado. Redija um anúncio de vaga de emprego para o cargo "${cargo}"${palavrasChave ? `, considerando também: ${palavrasChave}` : ''}.

Tom: profissional, acolhedor, direto. Sem promessas irreais de salário ou benefícios que não foram informados.

Responda APENAS com um JSON válido, sem formatação markdown, no formato:
{
  "titulo": "título curto e claro da vaga (até 60 caracteres)",
  "descricao": "descrição completa da vaga em texto corrido com parágrafos (use \\n\\n para separar), cobrindo: o que a pessoa vai fazer no dia a dia, requisitos desejados, e um parágrafo convidando a pessoa a se candidatar pelo formulário do site"
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
        }),
      },
    )

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Erro na API do Gemini')

    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()

    const resultJson = JSON.parse(content)

    return new Response(JSON.stringify({ success: true, data: resultJson }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
