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
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

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

    const messages = [
      { role: 'system', content: 'Você é um assistente especializado que gera JSONs perfeitos.' },
      { role: 'user', content: prompt },
    ]

    let resultJson = null
    let usedProvider = ''
    let usedModel = ''
    let usageTokens = { input: 0, output: 0 }
    const errorDetails: any[] = []

    // 1. Try Groq (Primary)
    if (GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.2,
            top_p: 0.1,
          }),
        })

        const data = await groqRes.json()
        if (!groqRes.ok) throw new Error(data.error?.message || 'Groq error')

        let content = data.choices[0].message.content
        if (content.includes('```json')) {
          content = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
        }

        resultJson = JSON.parse(content)
        usedProvider = 'groq'
        usedModel = data.model || 'llama-3.3-70b-versatile'
        usageTokens = {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
        }
      } catch (err: any) {
        errorDetails.push({ provider: 'groq', error: err.message })
        console.error('Groq generation failed:', err.message)
      }
    } else {
      errorDetails.push({ provider: 'groq', error: 'GROQ_API_KEY not configured' })
    }

    // 2. Fallback to OpenAI if Groq failed
    if (!resultJson && OPENAI_API_KEY) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.2,
            top_p: 0.1,
          }),
        })

        const data = await openAiRes.json()
        if (!openAiRes.ok) throw new Error(data.error?.message || 'OpenAI error')

        let content = data.choices[0].message.content
        if (content.includes('```json')) {
          content = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
        }

        resultJson = JSON.parse(content)
        usedProvider = 'openai'
        usedModel = data.model || 'gpt-4o-mini'
        usageTokens = {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
        }
      } catch (err: any) {
        errorDetails.push({ provider: 'openai', error: err.message })
        console.error('OpenAI generation failed:', err.message)
      }
    } else if (!resultJson && !OPENAI_API_KEY) {
      errorDetails.push({ provider: 'openai', error: 'OPENAI_API_KEY not configured' })
    }

    // If both failed, log error and return 503
    if (!resultJson) {
      await supabaseService.from('logs_ia').insert({
        usuario_id: user.id,
        acao: 'gerar_conteudo',
        provider: 'fallback_chain',
        modelo: 'multiple',
        status: 'erro',
        alertas: errorDetails,
      })

      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: 'IA temporariamente indisponível (limite de cota atingido)',
          detalhes: JSON.stringify(errorDetails),
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // On Success
    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_conteudo',
      provider: usedProvider,
      modelo: usedModel,
      tokens_input: usageTokens.input,
      tokens_output: usageTokens.output,
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
