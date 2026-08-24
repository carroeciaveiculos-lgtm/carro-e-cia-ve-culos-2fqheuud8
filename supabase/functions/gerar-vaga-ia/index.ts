import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Estrutura de referência (achado 24/08/2026, pedido da Adriana): baseada na
// vaga de "Representante de Desenvolvimento de Vendas (SDR)" que ela mesma
// escreveu à mão e gostou do resultado — usada aqui só como MODELO DE
// ESTRUTURA/TOM pra IA seguir, não é copiada literalmente em cada vaga nova.
const ESTRUTURA_MODELO = `1. Um parágrafo de abertura apresentando a Carro e Cia e convidando pro cargo.
2. "Principais Responsabilidades" — lista do que a pessoa faz no dia a dia.
3. "Requisitos e Qualificações" — o que é obrigatório.
4. "Diferenciais Desejáveis" — o que é bônus, não obrigatório.
5. "Perfil Comportamental Esperado" — que tipo de pessoa se encaixa.
6. "Benefícios, Remuneração e Horário" — só o que for genérico/seguro afirmar (salário fixo + comissões, sem inventar valor exato).
7. "Informações Finais e Chamada para Candidatura" — parágrafo convidando a se candidatar pelo formulário do site.`

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

    // Achado 24/08/2026, testado numa function de diagnóstico temporária
    // antes de usar aqui: `google_search` (busca de verdade, não só o
    // conhecimento que o modelo já tinha) SÓ funciona quando NÃO se força
    // `responseMimeType: 'application/json'` — com os dois juntos, a
    // resposta vem vazia (sem `candidates`), sem erro nenhum, o que seria
    // muito fácil de passar despercebido. Pedir JSON só no texto do prompt
    // (sem forçar o modo) funciona bem e continua saindo limpo.
    const prompt = `Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG, com mais de 20 anos de mercado. Pesquise na internet quais são os requisitos, atividades típicas, ferramentas/conhecimentos e diferenciais reais do mercado brasileiro em 2026 para o cargo "${cargo}"${palavrasChave ? ` (considere também: ${palavrasChave})` : ''}, e use essa pesquisa pra redigir um anúncio de vaga de emprego completo.

Siga esta estrutura como modelo (adapte o conteúdo de cada seção pro cargo pesquisado, mas mantenha a ordem e o espírito):
${ESTRUTURA_MODELO}

Tom: profissional, acolhedor, direto. Sem promessas irreais de salário ou benefícios que não foram informados. Não invente número de salário.

Formate a descrição em markdown simples: use "# Título da seção" pros títulos de cada parte, "- item" pra listas, "**palavra**" só quando quiser destacar algo pontual.

Depois de escrever, monte também uma lista de 5 a 8 palavras-chave de SEO relevantes pra alguém que procura esse tipo de vaga (cargo, sinônimos do cargo, principais habilidades).

Responda APENAS com um JSON válido, sem formatação markdown ao redor, sem texto antes ou depois, no formato:
{
  "titulo": "título curto e claro da vaga (até 60 caracteres)",
  "descricao": "a descrição completa em markdown, seguindo a estrutura acima, com \\n\\n separando os parágrafos/seções",
  "palavras_chave": ["palavra1", "palavra2", "palavra3"]
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 8000 },
        }),
      },
    )

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Erro na API do Gemini')

    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!content) {
      throw new Error(
        'A IA não devolveu conteúdo (pode ter sido bloqueada a pesquisa). Tente de novo.',
      )
    }
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()

    const resultJson = JSON.parse(content)
    if (Array.isArray(resultJson.palavras_chave)) {
      resultJson.palavras_chave = resultJson.palavras_chave.join(', ')
    }

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
