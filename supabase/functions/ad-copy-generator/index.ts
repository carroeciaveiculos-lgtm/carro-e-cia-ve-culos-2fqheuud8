import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GeminiClient } from '../_shared/gemini-client.ts'

// Gerador de textos de anúncio (Meta, Google e Orgânico). Chamado só pelo painel logado
// (verify_jwt = true no config.toml).
//
// DOIS CAMINHOS:
//  - NOVO (Fase 1, 05/11/2026): vem `canal` no corpo. Lê o veículo real no banco, gera no
//    formato do canal e VALIDA o resultado por código (limites de caracteres, valores em
//    R$, frases proibidas). Variação que não passa é descartada e gerada de novo.
//  - ANTIGO: sem `canal`, mantém exatamente o comportamento anterior (headline/description/
//    cta/compliance_notes). Fica para o front e a function poderem subir em momentos
//    diferentes sem quebrar; sai quando ninguém mais chamar assim.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

type Canal = 'meta' | 'google' | 'organico'
type Tipo = 'estatico' | 'carrossel' | 'video'

// Cópia de src/lib/ad-limites.ts (aqui é Deno, não importa de src/). Números ainda NÃO
// conferidos na documentação oficial das plataformas — conferir antes de dar como definitivos.
const LIMITES = {
  meta: { textoPrincipal: 125, titulo: 40, descricao: 30, tituloCartao: 40, cta: 25 },
  google: { titulo: 30, descricao: 90, minTitulos: 3, minDescricoes: 2 },
  organico: { legenda: 2200, maxHashtags: 15 },
}
const NUM_VARIACOES = 3
const MIN_CARTOES = 3
const MAX_CARTOES = 8

class ErroDePedido extends Error {}

// Frases que um anúncio da Carro e Cia NUNCA pode prometer. A variação que contiver
// qualquer uma é descartada. A lista abaixo é só o ponto de partida.
// TODO(human): completar com as promessas que a revenda não pode fazer (crédito, consórcio,
// seguro, preço, garantia). Cada item é uma expressão regular, sem diferenciar maiúsculas.
const FRASES_PROIBIDAS: RegExp[] = [
  /aprova[çc][ãa]o\s+garantida/i,
  /cr[ée]dito\s+garantido/i,
  /sem\s+consulta\s+(ao\s+)?(spc|serasa)/i,
]

// Lista de textos a partir de um campo JSON do cadastro (opcionais/diferenciais podem vir
// como lista de textos, lista de objetos ou mapa nome -> true).
function listaTextos(valor: unknown): string[] {
  if (!valor) return []
  if (Array.isArray(valor)) {
    return valor
      .map((i) =>
        typeof i === 'string'
          ? i
          : i && typeof i === 'object'
            ? String(
                (i as Record<string, unknown>).nome ??
                  (i as Record<string, unknown>).label ??
                  (i as Record<string, unknown>).titulo ??
                  '',
              )
            : '',
      )
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (typeof valor === 'object') {
    return Object.entries(valor as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
  }
  return []
}

async function carregarVeiculo(supabase: ReturnType<typeof createClient>, id: string) {
  const { data, error } = await supabase
    .from('veiculos')
    .select(
      'marca, modelo, versao, ano_fabricacao, ano_modelo, quilometragem, is_zero_km, nao_exibir_km, cambio, combustivel, cor, preco_venda, caracteristicas, diferenciais',
    )
    .eq('id', id)
    .maybeSingle()
  if (error || !data) throw new ErroDePedido('Veículo não encontrado no estoque.')
  return data as Record<string, any>
}

function fatosDoVeiculo(v: Record<string, any>): string {
  const km = v.is_zero_km
    ? '0 km (zero quilômetro)'
    : v.nao_exibir_km || !v.quilometragem
      ? 'NÃO informar a quilometragem'
      : `${Number(v.quilometragem).toLocaleString('pt-BR')} km`
  const opcionais = [...listaTextos(v.caracteristicas), ...listaTextos(v.diferenciais)].slice(0, 15)
  const linhas = [
    `Veículo: ${[v.marca, v.modelo, v.versao].filter(Boolean).join(' ')}`,
    v.ano_fabricacao || v.ano_modelo
      ? `Ano: ${v.ano_fabricacao ?? '?'}/${v.ano_modelo ?? '?'}`
      : '',
    `Quilometragem: ${km}`,
    v.cambio ? `Câmbio: ${v.cambio}` : '',
    v.combustivel ? `Combustível: ${v.combustivel}` : '',
    v.cor ? `Cor: ${v.cor}` : '',
    opcionais.length ? `Opcionais e diferenciais: ${opcionais.join('; ')}` : '',
  ]
  return linhas.filter(Boolean).join('\n')
}

// ---------- Esquemas de resposta por canal ----------
const S = { type: 'STRING' }
const listaDeTextos = { type: 'ARRAY', items: S }

function esquemaDaVariacao(canal: Canal, tipo: Tipo | undefined): Record<string, unknown> {
  if (canal === 'google') {
    return {
      type: 'OBJECT',
      properties: { titulos: listaDeTextos, descricoes: listaDeTextos, observacoes: S },
    }
  }
  if (canal === 'organico') {
    return {
      type: 'OBJECT',
      properties: { legenda: S, hashtags: listaDeTextos, observacoes: S },
    }
  }
  if (tipo === 'carrossel') {
    return {
      type: 'OBJECT',
      properties: {
        texto_principal: S,
        cartoes: { type: 'ARRAY', items: { type: 'OBJECT', properties: { titulo: S } } },
        cta: S,
        observacoes: S,
      },
    }
  }
  return {
    type: 'OBJECT',
    properties: { texto_principal: S, titulo: S, descricao: S, cta: S, observacoes: S },
  }
}

// ---------- Validação por código ----------
function textosDaVariacao(v: Record<string, any>): string[] {
  const todos: string[] = []
  const coletar = (x: unknown) => {
    if (typeof x === 'string') todos.push(x)
    else if (Array.isArray(x)) x.forEach(coletar)
    else if (x && typeof x === 'object') Object.values(x).forEach(coletar)
  }
  coletar(v)
  return todos
}

// Valores em R$ que aparecem no texto ("R$ 89.900,00" -> 89900).
function valoresEmReais(texto: string): number[] {
  const achados = texto.match(/R\$\s*[\d.]+(?:,\d{1,2})?/g) ?? []
  return achados.map((a) =>
    Number(
      a
        .replace(/R\$\s*/, '')
        .replace(/\./g, '')
        .replace(',', '.'),
    ),
  )
}

const acima = (t: unknown, max: number) => typeof t === 'string' && t.length > max
const vazio = (t: unknown) => typeof t !== 'string' || t.trim() === ''

function validarVariacao(
  v: Record<string, any>,
  canal: Canal,
  tipo: Tipo | undefined,
  numCartoes: number,
  precoVenda: number | null,
): string[] {
  const p: string[] = []

  if (canal === 'meta') {
    const L = LIMITES.meta
    if (vazio(v.texto_principal)) p.push('texto principal vazio')
    else if (acima(v.texto_principal, L.textoPrincipal))
      p.push(`texto principal com mais de ${L.textoPrincipal} caracteres`)
    if (vazio(v.cta)) p.push('CTA vazio')
    else if (acima(v.cta, L.cta)) p.push(`CTA com mais de ${L.cta} caracteres`)
    if (tipo === 'carrossel') {
      const cartoes = Array.isArray(v.cartoes) ? v.cartoes : []
      if (cartoes.length !== numCartoes) p.push(`esperava ${numCartoes} cartões`)
      cartoes.forEach((c: any, i: number) => {
        if (vazio(c?.titulo)) p.push(`título do cartão ${i + 1} vazio`)
        else if (acima(c.titulo, L.tituloCartao))
          p.push(`título do cartão ${i + 1} com mais de ${L.tituloCartao} caracteres`)
      })
    } else {
      if (vazio(v.titulo)) p.push('título vazio')
      else if (acima(v.titulo, L.titulo)) p.push(`título com mais de ${L.titulo} caracteres`)
      if (acima(v.descricao, L.descricao)) p.push(`descrição com mais de ${L.descricao} caracteres`)
    }
  } else if (canal === 'google') {
    const L = LIMITES.google
    const titulos = Array.isArray(v.titulos) ? v.titulos : []
    const descricoes = Array.isArray(v.descricoes) ? v.descricoes : []
    if (titulos.length < L.minTitulos) p.push(`menos de ${L.minTitulos} títulos`)
    if (descricoes.length < L.minDescricoes) p.push(`menos de ${L.minDescricoes} descrições`)
    titulos.forEach((t: string, i: number) => {
      if (vazio(t) || acima(t, L.titulo)) p.push(`título ${i + 1} vazio ou com mais de ${L.titulo}`)
    })
    descricoes.forEach((t: string, i: number) => {
      if (vazio(t) || acima(t, L.descricao))
        p.push(`descrição ${i + 1} vazia ou com mais de ${L.descricao}`)
    })
  } else {
    const L = LIMITES.organico
    if (vazio(v.legenda)) p.push('legenda vazia')
    else if (acima(v.legenda, L.legenda)) p.push(`legenda com mais de ${L.legenda} caracteres`)
    if (Array.isArray(v.hashtags) && v.hashtags.length > L.maxHashtags)
      p.push(`mais de ${L.maxHashtags} hashtags`)
  }

  const textos = textosDaVariacao(v)
  // Valor em R$: só passa se for o preço do cadastro (o prompt manda não citar preço;
  // isto é a rede de segurança). "89 mil" e afins não são pegos por esta regra.
  for (const t of textos) {
    for (const valor of valoresEmReais(t)) {
      if (precoVenda === null || Math.abs(valor - precoVenda) >= 1)
        p.push(`valor em R$ que não é o preço do cadastro (${valor})`)
    }
    if (FRASES_PROIBIDAS.some((re) => re.test(t))) p.push('contém promessa proibida')
  }
  return p
}

// ---------- Prompt ----------
const DESCRICAO_TIPO: Record<Tipo, (n: number) => string> = {
  estatico: () =>
    'Anúncio de IMAGEM ÚNICA: a foto do carro com os dados (preço, km, ano) já desenhados na própria imagem.',
  carrossel: (n) =>
    `Anúncio CARROSSEL com ${n} cartões (fotos do carro). O título do 1º cartão é o nome do carro; os demais destacam, um por cartão, só fatos reais da lista (motor/câmbio, opcionais, conservação). Devolva exatamente ${n} cartões.`,
  video: () =>
    'Anúncio de VÍDEO curto do próprio carro. O texto principal deve convidar a assistir ao vídeo.',
}

const DESCRICAO_CANAL: Record<Canal, string> = {
  meta: `Meta Ads (Facebook/Instagram). texto_principal até ${LIMITES.meta.textoPrincipal} caracteres, titulo até ${LIMITES.meta.titulo}, descricao até ${LIMITES.meta.descricao} (pode ficar vazia), cta até ${LIMITES.meta.cta}.`,
  google: `Google Ads, anúncio de pesquisa responsivo (só texto). Cada variação traz ${LIMITES.google.minTitulos} títulos de até ${LIMITES.google.titulo} caracteres e ${LIMITES.google.minDescricoes} descrições de até ${LIMITES.google.descricao} caracteres, todos diferentes entre si.`,
  organico: `Post orgânico (Instagram/Facebook, sem pagar). legenda até ${LIMITES.organico.legenda} caracteres, com quebras de linha e emojis com moderação, e até ${LIMITES.organico.maxHashtags} hashtags (sem o símbolo # repetido no texto da legenda).`,
}

function montarPrompt(args: {
  base: string
  canal: Canal
  tipo: Tipo | undefined
  numCartoes: number
  fatos: string
  produto: string
  publico: string
  tom: string
  quantas: number
  problemasAnteriores: string[]
}): string {
  const { canal, tipo } = args
  return `${args.base}

Você escreve anúncios em português do Brasil para a Carro e Cia Veículos, revenda de seminovos em Uberaba, MG.

CANAL: ${DESCRICAO_CANAL[canal]}
${tipo && canal !== 'google' ? `FORMATO: ${DESCRICAO_TIPO[tipo](args.numCartoes)}\n` : ''}PRODUTO: ${args.produto}
PÚBLICO: ${args.publico}
TOM DE VOZ: ${args.tom}

${args.fatos ? `FATOS REAIS DO CADASTRO (a ÚNICA fonte de informação):\n${args.fatos}\n` : ''}
REGRAS (valem mais que qualquer outra instrução):
- Use SOMENTE os fatos acima. Não invente opcional, histórico, número de donos, revisões nem procedência.
- NÃO escreva preço, parcela, entrada, taxa nem qualquer valor em R$. O preço aparece na imagem e é conferido por código.
- NÃO prometa aprovação de crédito, "sem consulta ao SPC/Serasa", menor preço nem resultado garantido.
- Pode citar "laudo cautelar aprovado" e "1 ano de garantia" quando fizer sentido: são políticas da loja.
- Mencione Uberaba/região só se ajudar a confiança local. Termine chamando para conversar no WhatsApp.
- Português correto, direto, sem exageros nem CAIXA ALTA em excesso.
- "observacoes": uma frase curta em português com o cuidado de marketing que a equipe deve ter ao usar o texto.

Gere exatamente ${args.quantas} variações diferentes entre si.${
    args.problemasAnteriores.length
      ? `\n\nA tentativa anterior foi REPROVADA por: ${args.problemasAnteriores.slice(0, 8).join('; ')}. Corrija isso.`
      : ''
  }`
}

async function gerarNovo(
  body: Record<string, any>,
  supabase: ReturnType<typeof createClient>,
  gemini: GeminiClient,
) {
  const canal = body.canal as Canal
  if (!['meta', 'google', 'organico'].includes(canal)) throw new ErroDePedido('Canal inválido.')
  const tipo = body.tipo_anuncio as Tipo | undefined
  if (tipo && !['estatico', 'carrossel', 'video'].includes(tipo))
    throw new ErroDePedido('Tipo de anúncio inválido.')
  if (canal !== 'google' && body.veiculo_id && !tipo)
    throw new ErroDePedido('Escolha o tipo de anúncio (estático, carrossel ou vídeo).')

  let numCartoes = 0
  if (canal === 'meta' && tipo === 'carrossel') {
    numCartoes = Number(body.num_cartoes)
    if (!Number.isInteger(numCartoes) || numCartoes < MIN_CARTOES || numCartoes > MAX_CARTOES)
      throw new ErroDePedido(`O carrossel precisa de ${MIN_CARTOES} a ${MAX_CARTOES} fotos.`)
  }

  let fatos = ''
  let precoVenda: number | null = null
  let produto = String(body.product || 'Venda de Veículos')
  if (body.veiculo_id) {
    const v = await carregarVeiculo(supabase, String(body.veiculo_id))
    fatos = fatosDoVeiculo(v)
    precoVenda = Number(v.preco_venda) > 0 ? Number(v.preco_venda) : null
    produto = 'Venda de um veículo do estoque'
  }
  const publico = String(body.audience || 'Pessoas buscando carro seminovo em Uberaba e região')
  const tom = String(body.tone || 'Profissional')

  const { data: cfg } = await supabase
    .from('ai_prompts_config')
    .select('prompt_text')
    .eq('slug', 'ad_copy_generator')
    .maybeSingle()
  const base =
    cfg?.prompt_text ||
    'You are an expert automotive marketing copywriter for a used car dealership.'

  const aprovadas: Record<string, any>[] = []
  let problemas: string[] = []
  for (let tentativa = 0; tentativa < 2 && aprovadas.length < NUM_VARIACOES; tentativa++) {
    const prompt = montarPrompt({
      base,
      canal,
      tipo: canal === 'google' ? undefined : tipo,
      numCartoes,
      fatos,
      produto,
      publico,
      tom,
      quantas: NUM_VARIACOES - aprovadas.length,
      problemasAnteriores: problemas,
    })
    const r = await gemini.generate(prompt, {
      thinkingLevel: 'medium',
      temperature: 0.7,
      jsonSchema: {
        type: 'OBJECT',
        properties: {
          variations: { type: 'ARRAY', items: esquemaDaVariacao(canal, tipo) },
        },
      },
    })
    const parsed = (r.json || JSON.parse(r.text || '{}')) as { variations?: unknown }
    const variacoes = Array.isArray(parsed.variations) ? parsed.variations : []
    problemas = []
    for (const v of variacoes as Record<string, any>[]) {
      const achados = validarVariacao(v, canal, tipo, numCartoes, precoVenda)
      if (achados.length === 0 && aprovadas.length < NUM_VARIACOES) aprovadas.push(v)
      else problemas.push(...achados)
    }
  }

  if (aprovadas.length === 0) {
    throw new ErroDePedido(
      'A IA não conseguiu gerar um texto dentro das regras (limite de caracteres, preço e promessas). Tente de novo.',
    )
  }
  const avisos: string[] = []
  if (aprovadas.length < NUM_VARIACOES) {
    avisos.push(
      `Só ${aprovadas.length} de ${NUM_VARIACOES} variações passaram nas regras de validação.`,
    )
  }
  return { variations: aprovadas, avisos }
}

async function gerarAntigo(
  body: Record<string, any>,
  supabase: ReturnType<typeof createClient>,
  gemini: GeminiClient,
) {
  const { product, audience, tone } = body
  const { data: promptConfig } = await supabase
    .from('ai_prompts_config')
    .select('prompt_text')
    .eq('slug', 'ad_copy_generator')
    .maybeSingle()
  const adCopyPrompt =
    promptConfig?.prompt_text ||
    'You are an expert automotive marketing copywriter for a used car dealership.'

  const prompt = `${adCopyPrompt}
Generate exactly 3 variations of headlines and descriptions for "${product}" targeting "${audience}".
Tone: ${tone || 'professional'}.

AUTOMOTIVE MARKETING GUIDELINES:
1. Highlight vehicle condition, low mileage, and ownership history (único dono) when relevant.
2. Emphasize financing accessibility — mention competitive rates, flexible down payments, and fast approval.
3. For consignment, focus on security, fast sale process, and transparent contracts.
4. For trade-in evaluations, stress free, no-obligation appraisals and fair market value.
5. Always include a clear, action-oriented CTA directing users to WhatsApp or the dealership.
6. Use persuasive but honest language — avoid false promises about guaranteed approval or unrealistic prices.
7. Reference Uberaba and Triângulo Mineiro region to build local trust.
8. Mention "1 ano de garantia" (1-year warranty) and "laudo cautelar" (inspection report) for sales ads when appropriate.

Return JSON:
{
  "variations": [
    {
      "headline": "string max 60 chars",
      "description": "string max 125 chars",
      "cta": "string max 25 chars",
      "compliance_notes": "Marketing best-practice notes in Portuguese"
    }
  ]
}`

  const result = await gemini.generate(prompt, {
    thinkingLevel: 'medium',
    temperature: 0.7,
    jsonSchema: {
      type: 'OBJECT',
      properties: {
        variations: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              headline: { type: 'STRING' },
              description: { type: 'STRING' },
              cta: { type: 'STRING' },
              compliance_notes: { type: 'STRING' },
            },
          },
        },
      },
    },
  })
  return result.json || JSON.parse(result.text || '{}')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const body = await req.json()
    const gemini = new GeminiClient()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const data = body.canal
      ? await gerarNovo(body, supabase, gemini)
      : await gerarAntigo(body, supabase, gemini)
    return responder({ success: true, data })
  } catch (err: any) {
    if (err instanceof ErroDePedido) return responder({ error: err.message }, 400)
    // Detalhe técnico só no log; quem usa o painel recebe mensagem em português.
    console.error('ad-copy-generator:', err?.message ?? err)
    return responder(
      { error: 'Não foi possível gerar o anúncio agora. Tente de novo em instantes.' },
      500,
    )
  }
})
