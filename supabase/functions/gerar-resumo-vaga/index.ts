import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Teto absoluto = limite real do Instagram pra legenda (2200 caracteres),
// o mais apertado entre Facebook/Instagram — nunca deixa passar disso,
// mesmo que a IA ignore a instrução de tamanho (achado 23/08/2026). Isso é
// trava técnica de plataforma, não faz parte da regra editável no banco.
const LIMITE_CARACTERES_RESUMO = 2200

// Fallback só pro caso raro da linha 'gerar_resumo_vaga' sumir do banco —
// no dia a dia, quem manda é o prompt_text editável em ai_prompts_config
// (Fase 3 da unificação de regras de IA, 28/08/2026).
const PROMPT_PADRAO = `Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG. Resuma a vaga informada num texto pronto pra postar no Facebook e Instagram, no MÁXIMO 450 caracteres (conte os caracteres, é um limite rígido).

Regras do resumo:
- Direto e convidativo, foco nos pontos mais atrativos (o que a pessoa vai fazer + 1 ou 2 requisitos principais).
- NÃO use tags HTML, markdown, asteriscos ou links.
- NÃO repita o cargo várias vezes.
- Pode usar 1 ou 2 emojis, sem exagero.
- NÃO inclua "candidate-se" nem link no final — isso é adicionado depois, fora do resumo.`

const FORMATO_PADRAO = `Responda APENAS com um JSON válido, sem formatação markdown, no formato:
{"resumo": "texto do resumo aqui"}`

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

    const { titulo, descricao } = await req.json()
    if (!titulo) throw new Error('Informe o título da vaga')
    if (!descricao) throw new Error('Informe a descrição da vaga')

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_APY_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada')

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data: promptRow } = await supabaseService
      .from('ai_prompts_config')
      .select('prompt_text, formato_resposta')
      .eq('slug', 'gerar_resumo_vaga')
      .maybeSingle()
    const regraResumo = promptRow?.prompt_text || PROMPT_PADRAO
    const formatoResumo = promptRow?.formato_resposta || FORMATO_PADRAO

    const prompt = `${regraResumo}

Cargo: ${titulo}

Descrição completa da vaga:
${descricao}

${formatoResumo}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
        }),
      },
    )

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Erro na API do Gemini')

    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()

    let resumo = ''
    try {
      resumo = JSON.parse(content).resumo || ''
    } catch {
      // Se a IA não devolver JSON válido por algum motivo, usa o texto cru
      // em vez de falhar — melhor um resumo "menos limpo" do que nenhum.
      resumo = content
    }

    // Cinto de segurança: nunca deixa passar do limite real da plataforma,
    // independente do que a IA devolveu.
    if (resumo.length > LIMITE_CARACTERES_RESUMO) {
      resumo = `${resumo.slice(0, LIMITE_CARACTERES_RESUMO - 1)}…`
    }

    return new Response(JSON.stringify({ success: true, resumo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
