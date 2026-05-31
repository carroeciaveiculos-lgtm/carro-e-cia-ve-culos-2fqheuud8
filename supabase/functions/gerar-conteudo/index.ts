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

    const { tema, palavraChave, tom } = await req.json()

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Grounding: Fetch company info to avoid hallucinations
    const { data: configData } = await supabaseService.from('site_configuracoes').select('*')
    const configString = configData
      ? JSON.stringify(configData)
      : 'Carro e Cia Veículos, mais de 20 anos de mercado em Uberaba, MG.'

    const prompt = `Você é um redator SEO especialista em veículos seminovos. Escreva um artigo sobre "${tema}".
    Palavra-chave principal: "${palavraChave}".
    Tom: ${tom || 'Conversacional'}.
    Contexto real da empresa (Base de conhecimento): ${configString}.
    Regras anti-alucinação: NÃO invente modelos de carros que não existem, NÃO prometa garantias que não existem, limite-se a informações verdadeiras baseadas no contexto fornecido.
    Responda APENAS com um objeto JSON válido, sem markdown:
    {
      "titulo": "Título H1 otimizado (50-60 chars)",
      "slug": "url-amigavel-separada-por-hifens",
      "meta_description": "Meta description (150-160 chars)",
      "texto_html": "Conteúdo do artigo formatado em HTML (com tags h2, h3, p, ul, li). Mínimo de 300 palavras.",
      "keyword_principal": "palavra-chave",
      "certeza": "alta"
    }`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado que gera JSONs perfeitos.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        top_p: 0.1,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'OpenAI error')

    const resultJson = JSON.parse(data.choices[0].message.content)

    // Log the request
    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_conteudo',
      provider: 'openai',
      modelo: data.model,
      tokens_input: data.usage.prompt_tokens,
      tokens_output: data.usage.completion_tokens,
      status: 'sucesso',
      certeza_reportada: resultJson.certeza,
    })

    return new Response(JSON.stringify({ success: true, data: resultJson }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
