// Legenda de post de veículo para Instagram e Facebook — MODELO FIXO, sem IA
// (Fase 2 da postagem automática, 03/10/2026; ver docs/postagem-automatica-redes.md).
//
// Por que fixo: a legenda por IA (gerar-conteudo-social) não usa os opcionais, não controla
// o tamanho e às vezes escreve frase de introdução ("Aqui está um post..."). O modelo fixo é
// previsível, não custa chamada de IA e nunca escreve o que não deve (telefone solto,
// "!!!", itens negativos do cadastro).
//
// Função PURA: recebe os dados do veículo e devolve o texto. Sem imports, roda em Deno e em Bun.

export interface VeiculoLegenda {
  marca: string | null
  modelo: string | null
  versao?: string | null
  categoria?: string | null
  ano_fabricacao?: number | string | null
  ano_modelo?: number | string | null
  cor?: string | null
  combustivel?: string | null
  cambio?: string | null
  quilometragem?: number | string | null
  preco_venda?: number | string | null
  slug?: string | null
  // listas do cadastro (aba Checklist): "diferenciais" = opcionais; "caracteristicas" = itens do carro
  diferenciais?: unknown
  caracteristicas?: unknown
}

export interface OpcoesLegenda {
  rede: 'instagram' | 'facebook'
  // Frase final fixa da loja (ai_prompts_config.rodape_fixo da regra vehicle_description_webmotors).
  fraseFinal: string
  whatsapp?: string // só dígitos com DDI, padrão: WhatsApp da Clara
  siteBase?: string // padrão: https://carroeciamotors.com.br
}

const WHATSAPP_PADRAO = '5534997384177' // Clara — atendimento geral (CLAUDE.md)
const SITE_PADRAO = 'https://carroeciamotors.com.br'
const LIMITE_INSTAGRAM = 2200

// Itens do cadastro que NUNCA vão pra rede social (negativos ou sensíveis). Achado real em
// 03/10/2026: o GWM Haval H6 tem "Passagem por leilão" na lista de características.
const ITEM_PROIBIDO =
  /leil[aã]o|alienad|sinistr|batid|remarc|recuperad|financiad|d[ií]vida|multa|restri/i

// Opcionais que mais vendem, na ordem em que devem aparecer (o resto vem depois).
const PRIORIDADE_DESTAQUES = [
  'teto solar',
  'bancos de couro',
  'tração 4x4',
  'câmera de ré',
  'gps',
  'chave inteligente',
  'ar condicionado',
  'sensor de estacionamento',
  'freios abs',
  'airbag',
]

// Itens de "características" que valem como "acompanha/estado" (lista segura).
const ACOMPANHA_PERMITIDO =
  /chave reserva|manual do propriet|tapetes originais|revisad|garantia de f[aá]brica|pintura sem riscos|estofado conservado|estepe em bom/i

const HASHTAG_CATEGORIA: Record<string, string> = {
  picape: '#picape',
  suv: '#suv',
  sedan: '#sedan',
  sedã: '#sedan',
  hatch: '#hatch',
  esportivo: '#esportivo',
  utilitario: '#utilitario',
  utilitário: '#utilitario',
}

const semAcento = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '')

const texto = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()

function numero(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  // O banco entrega numeric como "149897.00" (ponto decimal). Tratar o ponto como milhar
  // transformava R$ 149.897 em R$ 14.989.700 (bug achado no teste de 03/10/2026).
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  // formato digitado em português: "149.897,00"
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const milhar = (n: number) => Math.round(n).toLocaleString('pt-BR')

function lista(v: unknown): string[] {
  let arr: unknown = v
  if (typeof v === 'string') {
    try {
      arr = JSON.parse(v)
    } catch {
      arr = []
    }
  }
  if (!Array.isArray(arr)) return []
  const vistos = new Set<string>()
  const saida: string[] = []
  for (const item of arr) {
    const t = texto(item)
    const chave = t.toLowerCase()
    if (!t || vistos.has(chave)) continue
    vistos.add(chave)
    saida.push(t)
  }
  return saida
}

function destaques(v: unknown, max: number): string[] {
  const itens = lista(v).filter((i) => !ITEM_PROIBIDO.test(i))
  const peso = (i: string) => {
    const idx = PRIORIDADE_DESTAQUES.indexOf(i.toLowerCase())
    return idx === -1 ? 999 : idx
  }
  // sort estável: os de prioridade primeiro; o resto mantém a ordem do cadastro
  return itens
    .map((item, ordem) => ({ item, ordem }))
    .sort((a, b) => peso(a.item) - peso(b.item) || a.ordem - b.ordem)
    .slice(0, max)
    .map((x) => x.item)
}

function acompanha(v: unknown, max: number): string[] {
  return lista(v)
    .filter((i) => ACOMPANHA_PERMITIDO.test(i) && !ITEM_PROIBIDO.test(i))
    .slice(0, max)
}

// Hashtags definidas pela Adriana em 03/10/2026: as do veículo (marca, modelo, categoria,
// cidade) + as fixas da loja e dos portais. Mesma lista no Instagram e no Facebook.
const HASHTAGS_FIXAS = [
  '#consignacao',
  '#veiculo',
  '#carro',
  '#carroecia',
  '#automovel',
  '#webmotors',
  '#icarros',
  '#olx',
  '#mercadolivre',
  '#napista',
]

function hashtags(v: VeiculoLegenda): string[] {
  const limpa = (s: string) =>
    semAcento(s)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  const tags: string[] = []
  const add = (t: string) => {
    if (t.length > 2 && !tags.includes(t)) tags.push(t)
  }
  add(`#${limpa(texto(v.marca))}`)
  add(`#${limpa(texto(v.modelo).split(' ')[0] || '')}`)
  const cat = HASHTAG_CATEGORIA[semAcento(texto(v.categoria)).toLowerCase()]
  if (cat) add(cat)
  add('#uberaba')
  for (const fixa of HASHTAGS_FIXAS) add(fixa)
  return tags
}

export function montarLegendaSocial(v: VeiculoLegenda, op: OpcoesLegenda): string {
  const marca = texto(v.marca)
  const modelo = texto(v.modelo)
  let versao = texto(v.versao)
  // evita "Frontier Frontier XE ..." quando a versão já começa com o modelo
  if (versao.toLowerCase().startsWith(modelo.toLowerCase()))
    versao = versao.slice(modelo.length).trim()
  const titulo = [marca, modelo, versao].filter(Boolean).join(' ')

  const fab = numero(v.ano_fabricacao)
  const mod = numero(v.ano_modelo)
  const anos = fab && mod && fab !== mod ? `${fab}/${mod}` : String(mod || fab || '')

  const km = numero(v.quilometragem)
  const zeroKm = km === 0
  const kmTxt = km === null ? '' : zeroKm ? '0 km' : `${milhar(km)} km`

  const ficha = [anos, texto(v.cor), texto(v.combustivel), texto(v.cambio), kmTxt]
    .filter(Boolean)
    .join(' • ')

  const preco = numero(v.preco_venda)
  const precoTxt = preco && preco > 0 ? `R$ ${milhar(preco)}` : 'Preço sob consulta'

  const restritos = [...lista(v.caracteristicas), ...lista(v.diferenciais)].filter((i) =>
    ITEM_PROIBIDO.test(i),
  )
  const temLeilao = restritos.some((i) => /leil/i.test(i))

  const wa = op.whatsapp || WHATSAPP_PADRAO
  const site = (op.siteBase || SITE_PADRAO).replace(/\/$/, '')

  const montar = (maxDestaques: number): string => {
    const partes: string[] = []
    partes.push(titulo)
    if (ficha) partes.push(ficha)
    partes.push(precoTxt)

    const dest = destaques(v.diferenciais, maxDestaques)
    if (dest.length > 0) partes.push(`\nDestaques: ${dest.join(', ')}.`)

    const acomp = acompanha(v.caracteristicas, 4)
    if (acomp.length > 0) partes.push(`Acompanha: ${acomp.join(', ')}.`)

    // Decisão da Adriana (03/10/2026): "laudo cautelar aprovado e procedência garantida" vale
    // para TODOS os veículos. Quando o cadastro traz "passagem por leilão", a legenda também
    // AVISA isso (informar leilão é obrigação do anunciante) — aviso mantido até ela dizer o
    // contrário.
    const base = zeroKm ? 'Veículo 0 km' : 'Seminovo'
    const comercial = 'Melhor avaliação na troca, financiamento em até 60 vezes e pronta entrega.'
    partes.push(
      `\n${base} com laudo cautelar aprovado e procedência garantida. ${comercial}` +
        (temLeilao ? '\nAtenção: veículo com passagem por leilão.' : ''),
    )

    // Post orgânico não tem botão de contato (só anúncio tem). Facebook: o link https é
    // clicável. Instagram: link na legenda NÃO é clicável, então aponta para o direct e a bio
    // (decisão de 04/10/2026, a Adriana achou "wa.me/..." estranho no texto).
    //
    // Instagram: SEM convite de contato por enquanto (04/10/2026). O direct ainda não tem resposta
    // automática e o WhatsApp da bio não é o da Clara; convidar o cliente para lá o mandaria para um
    // canal sem atendimento. Trocar para CONVITE_DIRECT_INSTAGRAM quando o direct estiver atendido
    // e a bio apontar para o número certo.
    if (op.rede !== 'instagram') {
      partes.push(`\n💬 Quer saber mais? Fale com a gente pelo WhatsApp:\nhttps://wa.me/${wa}`)
    }
    if (op.rede === 'facebook' && v.slug) {
      partes.push(`🔗 Todas as fotos e detalhes: ${site}/estoque/${texto(v.slug)}`)
    }
    partes.push(`📍 Av. Guilherme Ferreira, 1119 – São Benedito, Uberaba/MG`)

    partes.push(`\n${op.fraseFinal.trim()}`)
    partes.push(`\n${hashtags(v).join(' ')}`)
    return partes.join('\n')
  }

  // Instagram aceita até 2.200 caracteres: se passar, encurta os destaques até caber.
  let maxDest = 8
  let saida = montar(maxDest)
  while (op.rede === 'instagram' && saida.length > LIMITE_INSTAGRAM && maxDest > 0) {
    maxDest -= 1
    saida = montar(maxDest)
  }
  return saida
}
