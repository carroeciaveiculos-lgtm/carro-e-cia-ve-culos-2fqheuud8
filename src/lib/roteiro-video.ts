// Roteiro da narração dos vídeos de veículo (10/11/2026). Padrão em docs/video-narrado-padrao.md.
// Funções PURAS (sem rede, sem ElevenLabs): montam o texto a partir do cadastro e conferem se ele
// segue as regras. Testar aqui não gasta crédito de voz. A pessoa sempre revisa o texto antes de
// qualquer áudio ser gerado.
// Regras fixas: preço NÃO é falado (vai na tela final e na descrição); o número do WhatsApp não é
// falado; números saem por extenso; nada que não esteja no cadastro.

export type FormatoVideo = '9:16' | '4:5'

export const FECHAMENTO_PADRAO = 'Chame a gente no WhatsApp e marque uma visita na loja.'
// Média de fala em português do Brasil (~145 palavras por minuto). É estimativa, não medição.
export const PALAVRAS_POR_SEGUNDO = 2.4

export const LIMITES_PALAVRAS: Record<FormatoVideo, { min: number; max: number }> = {
  '9:16': { min: 50, max: 65 },
  '4:5': { min: 75, max: 100 },
}

// ---------- números por extenso (português do Brasil, masculino) ----------

const UNIDADES = [
  'zero',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
]
const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
]
const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
]

function ate999(n: number): string {
  if (n === 100) return 'cem'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const partes: string[] = []
  if (c) partes.push(CENTENAS[c])
  if (resto) {
    if (resto < 20) partes.push(UNIDADES[resto])
    else {
      const d = DEZENAS[Math.floor(resto / 10)]
      const u = resto % 10
      partes.push(u ? `${d} e ${UNIDADES[u]}` : d)
    }
  }
  return partes.join(' e ')
}

export function numeroPorExtenso(valor: number): string {
  const n = Math.floor(Math.abs(valor))
  if (n === 0) return 'zero'
  if (n >= 1_000_000_000) return String(n)
  const milhoes = Math.floor(n / 1_000_000)
  const milhares = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes: { texto: string; valor: number }[] = []
  if (milhoes)
    partes.push({
      texto: milhoes === 1 ? 'um milhão' : `${ate999(milhoes)} milhões`,
      valor: milhoes,
    })
  if (milhares)
    partes.push({ texto: milhares === 1 ? 'mil' : `${ate999(milhares)} mil`, valor: milhares })
  if (resto) partes.push({ texto: ate999(resto), valor: resto })
  // "e" antes de um bloco só quando ele é menor que 100 ou centena exata ("mil e cem").
  let texto = partes[0].texto
  for (let i = 1; i < partes.length; i++) {
    const { valor } = partes[i]
    const ligaComE = valor < 100 || valor % 100 === 0
    texto += ligaComE ? ` e ${partes[i].texto}` : ` ${partes[i].texto}`
  }
  return texto
}

// "2.0" -> "dois ponto zero"
export function cilindradaFalada(valor: unknown): string {
  const s = String(valor ?? '')
    .replace(',', '.')
    .trim()
  if (!/^\d+(\.\d+)?$/.test(s)) return ''
  const [inteira, decimal] = s.split('.')
  const falaInteira = numeroPorExtenso(Number(inteira))
  // Cilindrada inteira vem do banco como 2 (e não 2.0): motor fala-se "dois ponto zero".
  if (!decimal) return Number(inteira) < 10 ? `${falaInteira} ponto zero` : falaInteira
  const falaDecimal = decimal
    .split('')
    .map((d) => UNIDADES[Number(d)])
    .join(' ')
  return `${falaInteira} ponto ${falaDecimal}`
}

// ---------- roteiro a partir do cadastro ----------

// Itens que podem ser citados, em ordem de prioridade. "Tração 4x4" NÃO está aqui de propósito:
// a lista de diferenciais do cadastro é genérica e já apareceu 4x4 em carro que não tem.
const DIFERENCIAIS_FALAVEIS = [
  'bancos de couro',
  'teto solar',
  'câmera de ré',
  'sensor de estacionamento',
  'central multimídia',
  'piloto automático',
  'controle de tração',
  'ar condicionado',
  'direção elétrica',
  'vidros elétricos',
]

function listaFalada(itens: string[]): string {
  if (itens.length <= 1) return itens.join('')
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

function limparMarca(marca: string): string {
  return marca
    .replace(/^.*\s-\s/, '')
    .replace(/\s+Motors$/i, '')
    .trim()
}

function diferenciaisDoCadastro(v: any): string[] {
  const bruto = v?.diferenciais
  const lista: unknown[] = Array.isArray(bruto) ? bruto : []
  const nomes = lista
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().toLowerCase())
  return DIFERENCIAIS_FALAVEIS.filter((d) => nomes.some((n) => n === d))
}

export function montarRoteiro(v: any, formato: FormatoVideo): string {
  const marca = limparMarca(String(v?.marca ?? ''))
  const modelo = String(v?.modelo ?? '').trim()
  const ano = Number(v?.ano_modelo)
  const frases: string[] = []

  frases.push(
    `Olha só este ${marca} ${modelo}${ano ? ` ${numeroPorExtenso(ano)}` : ''}.`.replace(
      /\s+/g,
      ' ',
    ),
  )

  const cor = String(v?.cor ?? '')
    .trim()
    .toLowerCase()
  if (formato === '4:5' && cor) frases.push(`Na cor ${cor}.`)

  const maxDif = formato === '4:5' ? 5 : 3
  const difs = diferenciaisDoCadastro(v).slice(0, maxDif)
  if (difs.length) frases.push(`Ele vem com ${listaFalada(difs)}.`)

  const dados: string[] = []
  if (v?.is_zero_km) dados.push('é zero quilômetro')
  else if (!v?.nao_exibir_km && Number(v?.quilometragem) > 0)
    dados.push(`tem ${numeroPorExtenso(Number(v.quilometragem))} quilômetros`)
  const cambio = String(v?.cambio ?? '')
    .trim()
    .toLowerCase()
  if (cambio) dados.push(`câmbio ${cambio}`)
  const motor = [
    cilindradaFalada(v?.cilindrada),
    String(v?.combustivel ?? '')
      .trim()
      .toLowerCase(),
  ]
    .filter(Boolean)
    .join(' ')
  if (motor) dados.push(`motor ${motor}`)
  if (dados.length) {
    const [primeiro, ...resto] = dados
    frases.push(
      `${primeiro.charAt(0).toUpperCase()}${primeiro.slice(1)}${resto.length ? `, ${listaFalada(resto)}` : ''}.`,
    )
  }

  // Todo veículo entra com cautelar aprovada (regra de negócio, 03/11/2026): o selo sempre aparece.
  frases.push('E o melhor: laudo cautelar aprovado.')
  // Só o 4:5 (mais longo) fala da loja; o 9:16 vai direto ao convite para caber em 20 a 28 s.
  if (formato === '4:5') {
    frases.push('Ele está esperando por você aqui na Carro e Cia, em Uberlândia.')
    frases.push('Venha conhecer de perto.')
  }
  frases.push(FECHAMENTO_PADRAO)
  return frases.join(' ')
}

// ---------- conferência do texto ----------

export interface ResultadoValidacao {
  ok: boolean
  avisos: string[]
  palavras: number
  caracteres: number
  duracaoEstimadaSeg: number
}

const PROIBIDOS: [RegExp, string][] = [
  [
    /r\$|\breais\b|\breal\b|parcela|entrada|financi/i,
    'cita preço, parcela, entrada ou financiamento (o preço vai na tela, não na voz)',
  ],
  [/\bfipe\b/i, 'cita FIPE (só pode se o cadastro comprovar 5% ou mais abaixo)'],
  [/[uú]nico dono/i, 'diz "único dono", que não está no cadastro'],
  [/sem detalhes/i, 'diz "sem detalhes", que não está no cadastro'],
  [/garantia/i, 'cita garantia, que não está no cadastro'],
  [/#/, 'tem hashtag'],
]

export function validarRoteiro(texto: string, formato: FormatoVideo, v?: any): ResultadoValidacao {
  const limpo = texto.trim()
  const avisos: string[] = []
  const palavras = limpo ? limpo.split(/\s+/).length : 0
  const { min, max } = LIMITES_PALAVRAS[formato]
  if (palavras < min)
    avisos.push(`texto curto para ${formato}: ${palavras} palavras (mínimo ${min})`)
  if (palavras > max)
    avisos.push(`texto longo para ${formato}: ${palavras} palavras (máximo ${max})`)

  // Dígitos soltos devem virar palavras; nome de marca e modelo (ex.: 320i, C3) é permitido.
  let semNomes = limpo
  for (const nome of [v?.marca, v?.modelo]) {
    if (nome) semNomes = semNomes.split(String(nome)).join(' ')
  }
  if (/\d/.test(semNomes))
    avisos.push('tem números em dígitos; escreva por extenso (ex.: "setenta mil quilômetros")')

  for (const [regra, mensagem] of PROIBIDOS) if (regra.test(limpo)) avisos.push(mensagem)
  if (/\p{Extended_Pictographic}/u.test(limpo)) avisos.push('tem emoji')
  if (!limpo.endsWith(FECHAMENTO_PADRAO))
    avisos.push('a última frase deve ser o fechamento padrão do WhatsApp')

  return {
    ok: avisos.length === 0,
    avisos,
    palavras,
    caracteres: limpo.length,
    duracaoEstimadaSeg: Math.round((palavras / PALAVRAS_POR_SEGUNDO) * 10) / 10,
  }
}
