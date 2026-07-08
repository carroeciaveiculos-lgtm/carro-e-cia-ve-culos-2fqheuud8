import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { validateSeoContent } from '../_shared/seo-validator.ts'
import { buildSeoAgentPrompt } from '../_shared/seo-prompt.ts'

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

    const {
      tema,
      palavraChave,
      tom,
      is_seo_copilot,
      title,
      is_seo_optimizer,
      current_data,
      is_heading_draft,
      article_title,
      is_seo_agent,
      agenda_id,
    } = await req.json()

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    const GEMINI_API_KEY = Deno.env.get('GEMINI_APY_KEY')

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Grounding: Fetch company info to avoid hallucinations
    const { data: configData } = await supabaseService.from('site_configuracoes').select('*')

    // Buscar Brain IA knowledge base
    const { data: brainKnowledge } = await supabaseService
      .from('brain_ia_knowledge')
      .select('titulo, conteudo, tipo')

    let brainIAContext = ''
    if (brainKnowledge && brainKnowledge.length > 0) {
      brainIAContext = brainKnowledge
        .map((k: any) => `[${k.titulo}]: ${k.conteudo || ''}`)
        .join('\n')
    }

    const configString = configData
      ? JSON.stringify(configData.filter((c: any) => c.chave !== 'brain_ia_settings'))
      : 'Carro e Cia Veículos, mais de 20 anos de mercado em Uberaba, MG.'

    const { data: socialConfig } = await supabaseService
      .from('social_configuracoes')
      .select('ai_system_prompt, whatsapp_number')
      .maybeSingle()
    const customPrompt =
      socialConfig?.ai_system_prompt ||
      'Você é um "Master Arquiteto de Conteúdo" especialista em veículos seminovos.'
    const whatsappNumber = socialConfig?.whatsapp_number || '5534999999999'

    const basePrompt = `${customPrompt}
Contexto real da empresa: ${configString}.
Número de WhatsApp configurado para links: ${whatsappNumber}.

CONHECIMENTO BRAIN IA (MEMÓRIA ATIVA):
${brainIAContext}

Tom de Voz OBRIGATÓRIO: Humanizado, empático, envolvente e altamente persuasivo.

INSTRUÇÃO IMPORTANTE SOBRE LINKS E MARCA:
- A marca "Carro e Cia Veículos" DEVE ser sugerida como a melhor solução para: consignação, venda rápida, troca com troco, financiamentos, consórcios e seguros auto.
- Inclua links naturais ao longo do texto contextualizando esses serviços.
- Sempre que gerar botões de CTA ou links para WhatsApp, utilize o formato: https://wa.me/${whatsappNumber}

REGRAS ANTI-ALUCINAÇÃO:
- NÃO invente modelos de carros que não existem, NÃO prometa garantias irreais.
- Baseie-se nas informações reais da empresa e nas diretrizes da marca (Brain IA).
`

    const prompt = is_heading_draft
      ? `${basePrompt}
Você é um especialista em SEO e estrutura de conteúdo.
Sua tarefa é criar uma estrutura otimizada de subtítulos (H2, H3) para um artigo com o título: "${article_title}".

REGRAS:
- Gere entre 5-8 seções H2 principais que cubram todo o tema
- Para cada H2, sugira 1-3 H3 subtópicos quando relevante
- Inclua palavras-chave relacionadas de forma natural nos headings
- A estrutura deve ser abrangente e seguir a jornada do usuário
- Considere intenção de busca informacional e transacional

SAÍDA OBRIGATÓRIA (JSON VÁLIDO):
Responda APENAS com um objeto JSON válido, sem formatação markdown:
{
  "headings": [
    { "level": 2, "text": "Título da Seção Principal" },
    { "level": 3, "text": "Subtópico da Seção" }
  ]
}`
      : is_seo_optimizer
        ? `${basePrompt}
Você é um Master Especialista em SEO.
Sua missão é otimizar o rascunho a seguir para atingir a nota máxima (Score 100) em SEO.
Ajuste os textos, o título, meta_title, meta_description, H1 e certifique-se de que a palavra-chave principal apareça no início do conteúdo e em subtítulos (H2/H3).

Rascunho atual:
${JSON.stringify(current_data)}

SAÍDA OBRIGATÓRIA (JSON VÁLIDO):
Responda APENAS com um objeto JSON válido, sem formatação markdown:
{
  "titulo": "Título Interno",
  "slug": "url-amigavel",
  "meta_title": "Título SEO (40-60 chars)",
  "meta_description": "Descrição SEO (120-160 chars)",
  "h1_artigo": "H1 do Artigo",
  "palavras_chave_principais": ["keyword 1", "keyword 2"],
  "palavras_chave_secundarias": ["keyword 3", "keyword 4"],
  "conteudo_html": "<h2>...</h2><p>...</p>"
}`
        : is_seo_copilot
          ? `${basePrompt}
Você é um especialista em SEO e Copywriting focado no mercado automotivo.
Sua tarefa é gerar um artigo de blog épico e altamente otimizado para SEO baseado no título fornecido: "${title}".

REGRAS DE CONTEÚDO (EXTREMAMENTE IMPORTANTES):
- O artigo DEVE ser denso, extenso e profundo (NO MÍNIMO 1.500 palavras - tipo "Pillar Content").
- Tom de voz: Humanizado, empático, envolvente e altamente persuasivo.
- O artigo deve ser estruturado com H2, H3, parágrafos bem desenvolvidos e listas (HTML válido).
- Inclua a palavra-chave principal de forma natural no primeiro parágrafo.
- Crie links internos contextuais fortes promovendo a "Carro e Cia Veículos" como solução ideal (ex: /consignacao para vender o carro, /estoque para trocar, /financiamento-auto, /seguro-auto, /consorcio-auto).
- O meta_title deve ter entre 40 e 60 caracteres.
- O meta_description deve ter entre 120 e 160 caracteres.

SAÍDA OBRIGATÓRIA (JSON VÁLIDO):
Responda APENAS com um objeto JSON válido, sem formatação markdown:
{
  "slug": "url-amigavel-separada-por-hifens",
  "meta_title": "Título SEO otimizado (40-60 chars)",
  "meta_description": "Descrição persuasiva (120-160 chars)",
  "h1_artigo": "Título principal do artigo",
  "palavras_chave_principais": ["keyword 1", "keyword 2"],
  "palavras_chave_secundarias": ["keyword 3", "keyword 4"],
  "conteudo_html": "<h2>...</h2><p>...</p><h3>...</h3><p>...</p>"
}`
          : is_seo_agent
            ? `${basePrompt}
${buildSeoAgentPrompt(tema || '', palavraChave || '')}`
            : `${basePrompt}
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

REGRAS DE FORMATAÇÃO DE TEXTO:
- Todo o texto nos campos "texto" deve ser texto puro, sem símbolos Markdown (como ###, **, _, \`) ou tags HTML.
- Use apenas quebras de parágrafo naturais (dupla quebra de linha) para separar parágrafos.
- Não inclua marcadores de lista com símbolos especiais; use texto corrido com numeração simples quando necessário.
- O texto deve estar pronto para exibição direta em um campo de texto simples, sem necessidade de conversão.

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

    // 1. Try Gemini 3.5 Flash (Primary if specified or available)
    if (GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
              },
            }),
          },
        )

        const data = await geminiRes.json()
        if (!geminiRes.ok) throw new Error(data.error?.message || 'Gemini error')

        let content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (content && content.includes('```json')) {
          content = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
        }

        if (content) {
          resultJson = JSON.parse(content)
          usedProvider = 'gemini'
          usedModel = 'gemini-3.5-flash'
          usageTokens = {
            input: data.usageMetadata?.promptTokenCount || 0,
            output: data.usageMetadata?.candidatesTokenCount || 0,
          }
        }
      } catch (err: any) {
        errorDetails.push({ provider: 'gemini', error: err.message })
        console.error('Gemini generation failed:', err.message)
      }
    }

    // 2. Try OpenAI (Fallback)
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

    // 3. Fallback to Groq if OpenAI and Gemini failed
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
    if ((is_seo_copilot || is_seo_optimizer) && resultJson.conteudo_html) {
      htmlOutput = resultJson.conteudo_html
    } else if (resultJson.secoes && Array.isArray(resultJson.secoes)) {
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

    // SEO Agent: Save to blog_posts, validate, and notify manager via WhatsApp
    if (is_seo_agent && resultJson) {
      const validation = validateSeoContent(htmlOutput, resultJson.meta_description)
      const slug =
        resultJson.slug ||
        (tema || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

      const { data: blogPost } = await supabaseService
        .from('blog_posts')
        .insert({
          title: resultJson.titulo || tema || 'Artigo SEO',
          slug,
          content: htmlOutput,
          meta_description: resultJson.meta_description || '',
          category: 'SEO',
          published: false,
          requires_review: true,
          ia_generated: true,
          ia_confidence: resultJson.certeza || 'media',
          keyword: palavraChave || resultJson.keyword_principal || '',
          tags: [palavraChave || resultJson.keyword_principal || ''],
          read_time: '10 min',
        })
        .select('id')
        .single()

      if (agenda_id && blogPost) {
        await supabaseService
          .from('agenda_conteudo')
          .update({ status: 'Em Revisão', artigo_id: blogPost.id })
          .eq('id', agenda_id)
      }

      const waToken = Deno.env.get('WHATSAPP_TOKEN')
      const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
      if (waToken && waPhoneId && blogPost) {
        const valSummary = validation.checks
          .map((c: any) => `${c.passed ? '✅' : '❌'} ${c.name}: ${c.detail}`)
          .join('\n')
        await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '5534984080220',
            type: 'text',
            text: {
              body: `📝 Artigo pronto para revisão!\n\n*${resultJson.titulo || tema}*\n\nValidação:\n${valSummary}\n\nResponda:\n• APROVAR ${tema}\n• CORRIGIR ${tema} [instrução]\n• VER ${tema}`,
            },
          }),
        })
      }

      resultJson.validation = validation
      resultJson.blog_post_id = blogPost?.id || null
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
