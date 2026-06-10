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

    const prompt = `Você é um "Master Arquiteto de Conteúdo" especialista em veículos seminovos.
Contexto real da empresa: ${configString}.

Sua tarefa é gerar conteúdo para o tema "${tema}" com foco na palavra-chave "${palavraChave}".
Tom: ${tom || 'Conversacional'}.

REGRAS DE CONTEÚDO (HARD LIMITS):
- Hero Section: H1 (max 60 chars), Subtitle (max 120 chars), CTA (max 25 chars).
- Institucional: H2 (max 50 chars), Paragraphs (max 300 chars, max 2 paragraphs).
- Serviços/Cards: H3 (max 40 chars), Description (max 100 chars), Bullets (max 3 items, 50 chars each).
- Prova Social: Nome (max 30 chars), Testimonial (max 150 chars).
- Artigos de Blog (SEO): Defina o tipo: Rápido (3k-5k chars), Padrão (6k-10k chars) ou Pilar (12k-20k chars). Inclua 3-5 links internos contextuais para outras páginas por 1000 palavras com anchor texts naturais.
- Reescreva automaticamente qualquer texto que exceda esses limites antes de retornar.

REGRAS DE MÍDIA E IMAGENS:
- Imagens: Forneça descrições ("prompt_geracao_ia_ingles") SEMPRE EM INGLÊS.
- Estilo: "Realistic Photography" (fotos de veículos reais, pessoas e lojas. Evite 3D/vetores).
- Aspect Ratio: 16:9 para Hero, 1:1 ou 4:5 para Institucional, 3:2 para Serviços.

REGRAS ANTI-ALUCINAÇÃO:
- NÃO invente modelos de carros que não existem, NÃO prometa garantias irreais.
- Baseie-se nas informações reais da empresa fornecidas.

SAÍDA OBRIGATÓRIA (JSON VÁLIDO):
Responda APENAS com um objeto JSON válido, sem formatação markdown:
{
  "titulo": "Título H1 otimizado (50-60 chars)",
  "slug": "url-amigavel-separada-por-hifens",
  "meta_description": "Meta description (150-160 chars)",
  "keyword_principal": "palavra-chave",
  "certeza": "alta|media|baixa",
  "secoes": [
    {
      "nome_da_secao": "Hero|Institucional|Servicos|Conteudo|etc",
      "layout_diretrizes": {
        "alinhamento": "centro|esquerda",
        "grid_mobile": "1 coluna",
        "grid_desktop": "2 colunas"
      },
      "conteudo": [
        {
          "tipo_elemento": "h1|h2|h3|p|cta|card",
          "texto": "texto gerado respeitando os limites",
          "caracteres_utilizados": 55,
          "estilo_sugerido": "bold|normal"
        }
      ],
      "midia": [
        {
          "tipo": "imagem",
          "formato_aspecto": "16:9|1:1|4:5|3:2",
          "prompt_geracao_ia_ingles": "Realistic photography of..."
        }
      ]
    }
  ]
}`

    const messages = [
      {
        role: 'system',
        content:
          'Você é um assistente especializado que gera JSONs perfeitos estruturados conforme solicitado.',
      },
      { role: 'user', content: prompt },
    ]

    let resultJson = null
    let usedProvider = ''
    let usedModel = ''
    let usageTokens = { input: 0, output: 0 }
    const errorDetails: any[] = []

    // 1. Try OpenAI (Primary)
    if (OPENAI_API_KEY) {
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
            temperature: 0.3,
            top_p: 0.2,
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
    } else {
      errorDetails.push({ provider: 'openai', error: 'OPENAI_API_KEY not configured' })
    }

    // 2. Fallback to Groq if OpenAI failed
    if (!resultJson && GROQ_API_KEY) {
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
            temperature: 0.3,
            top_p: 0.2,
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
    } else if (!resultJson && !GROQ_API_KEY) {
      errorDetails.push({ provider: 'groq', error: 'GROQ_API_KEY not configured' })
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
          erro: 'IA temporariamente indisponível (limites de cota atingidos ou erro de API)',
          detalhes: errorDetails,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Convert new JSON schema to HTML for frontend compatibility
    let htmlOutput = ''
    if (resultJson.secoes && Array.isArray(resultJson.secoes)) {
      for (const secao of resultJson.secoes) {
        const secaoClass = secao.nome_da_secao?.toLowerCase().replace(/\s+/g, '-') || 'geral'
        htmlOutput += `\n<section class="secao-${secaoClass}">\n`

        if (secao.conteudo && Array.isArray(secao.conteudo)) {
          for (const item of secao.conteudo) {
            const tag = item.tipo_elemento?.toLowerCase() || 'p'
            let contentStr = item.texto || ''

            if (item.estilo_sugerido === 'bold') contentStr = `<strong>${contentStr}</strong>`

            if (tag === 'cta') {
              htmlOutput += `  <a href="#" class="cta-button">${contentStr}</a>\n`
            } else if (tag === 'card') {
              htmlOutput += `  <div class="card-item">${contentStr}</div>\n`
            } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'li'].includes(tag)) {
              htmlOutput += `  <${tag}>${contentStr}</${tag}>\n`
            } else {
              htmlOutput += `  <p>${contentStr}</p>\n`
            }
          }
        }

        if (secao.midia && Array.isArray(secao.midia)) {
          for (const media of secao.midia) {
            htmlOutput += `  <!-- Image IA Prompt: ${media.prompt_geracao_ia_ingles} | Aspect: ${media.formato_aspecto} -->\n`
          }
        }

        htmlOutput += `</section>\n`
      }
    } else if (resultJson.texto_html) {
      htmlOutput = resultJson.texto_html
    } else {
      htmlOutput = '<p>Conteúdo gerado não possui seções válidas.</p>'
    }

    resultJson.texto_html = htmlOutput.trim()

    // On Success
    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_conteudo',
      provider: usedProvider,
      modelo: usedModel,
      tokens_input: usageTokens.input,
      tokens_output: usageTokens.output,
      status: 'sucesso',
      certeza_reportada: resultJson.certeza || 'nao_informado',
      alertas: { secoes_geradas: resultJson.secoes?.length || 0 },
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
