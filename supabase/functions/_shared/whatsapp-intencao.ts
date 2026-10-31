// Interpreta a mensagem da equipe autorizada em um comando da Clara, sem IA:
// regra fixa (sem acento/maiuscula, sinonimos, frases, prefixo "Clara").
// Modulo puro (sem imports) pra poder ser testado fora do Deno.
// Frases naturais valem tambem para comandos que alteram algo -- quem protege
// e a confirmacao SIM/NAO (whatsapp-confirmacao.ts), nao a palavra exata.

export type Comando =
  | 'LEADS'
  | 'QUENTES'
  | 'HOJE'
  | 'RESPONDER'
  | 'ESTOQUE'
  | 'BUSCAR'
  | 'VENDIDO'
  | 'ANUNCIOS'
  | 'LISTAR'
  | 'GASTO'
  | 'PAUSAR'
  | 'ATIVAR'
  | 'ORCAMENTO'
  | 'SUGERIR'
  | 'VER'
  | 'APROVAR'
  | 'CORRIGIR'
  | 'AJUDA'

export interface Intencao {
  comando: Comando
  args: string
}

export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Token comparavel: sem acento, minusculo, so letras e numeros.
function chave(t: string): string {
  return normalizar(t).replace(/[^a-z0-9]/g, '')
}

const PREENCHIMENTO = new Set([
  'clara',
  'oi',
  'ola',
  'bom',
  'dia',
  'boa',
  'tarde',
  'noite',
  'por',
  'favor',
  'pf',
  'pode',
  'poderia',
  'quero',
  'gostaria',
  'que',
  'voce',
  'vc',
  'me',
  'eu',
  'agora',
  'entao',
])

const ARTIGOS_INICIAIS = new Set([
  'o',
  'a',
  'os',
  'as',
  'anuncio',
  'anuncios',
  'campanha',
  'campanhas',
  'carro',
  'veiculo',
  'do',
  'da',
  'dos',
  'das',
  'de',
  'um',
  'uma',
])

const VERBOS: Record<string, Comando> = {
  pausar: 'PAUSAR',
  pause: 'PAUSAR',
  pausa: 'PAUSAR',
  pare: 'PAUSAR',
  parar: 'PAUSAR',
  desligar: 'PAUSAR',
  desligue: 'PAUSAR',
  desliga: 'PAUSAR',
  desativar: 'PAUSAR',
  desative: 'PAUSAR',
  ativar: 'ATIVAR',
  ative: 'ATIVAR',
  ativa: 'ATIVAR',
  ligar: 'ATIVAR',
  ligue: 'ATIVAR',
  liga: 'ATIVAR',
  reativar: 'ATIVAR',
  reative: 'ATIVAR',
  retomar: 'ATIVAR',
  retome: 'ATIVAR',
  orcamento: 'ORCAMENTO',
  budget: 'ORCAMENTO',
  vendido: 'VENDIDO',
  vendi: 'VENDIDO',
  vendemos: 'VENDIDO',
  aprovar: 'APROVAR',
  aprove: 'APROVAR',
  aprova: 'APROVAR',
  corrigir: 'CORRIGIR',
  corrija: 'CORRIGIR',
  responder: 'RESPONDER',
  responda: 'RESPONDER',
  buscar: 'BUSCAR',
  busque: 'BUSCAR',
  procurar: 'BUSCAR',
  procure: 'BUSCAR',
  pesquisar: 'BUSCAR',
  pesquise: 'BUSCAR',
  sugerir: 'SUGERIR',
  sugira: 'SUGERIR',
  sugestoes: 'SUGERIR',
  ajuda: 'AJUDA',
  help: 'AJUDA',
  comandos: 'AJUDA',
  menu: 'AJUDA',
  leads: 'LEADS',
  lead: 'LEADS',
  quentes: 'QUENTES',
  hoje: 'HOJE',
  estoque: 'ESTOQUE',
  gasto: 'GASTO',
  gastos: 'GASTO',
}

// Verbos de consulta: o que importa e o ALVO da frase ("me mostre os leads",
// "quais anuncios estao ativos", "quanto gastei").
const VERBOS_CONSULTA = new Set([
  'ver',
  'veja',
  'mostrar',
  'mostre',
  'listar',
  'lista',
  'liste',
  'quais',
  'quantos',
  'quanto',
  'manda',
  'mande',
  'envie',
  'envia',
  'traga',
  'traz',
  'passa',
  'passe',
  'como',
  'status',
])

function alvoConsulta(chaves: string[], verbo: string): Intencao | null {
  const tem = (...p: string[]) => p.some((x) => chaves.includes(x))
  if (tem('quentes', 'quente')) return { comando: 'QUENTES', args: '' }
  if (tem('leads', 'lead')) return { comando: tem('hoje') ? 'HOJE' : 'LEADS', args: '' }
  if (tem('estoque')) return { comando: 'ESTOQUE', args: '' }
  if (tem('gasto', 'gastos', 'gastei', 'gastamos', 'saldo')) return { comando: 'GASTO', args: '' }
  if (tem('anuncios', 'anuncio', 'campanhas', 'campanha')) {
    return { comando: 'LISTAR', args: tem('pausados', 'pausadas') ? 'pausados' : '' }
  }
  if (tem('artigo', 'artigos')) return { comando: 'VER', args: '' }
  if (tem('comandos', 'ajuda')) return { comando: 'AJUDA', args: '' }
  if (tem('pausados', 'pausadas')) return { comando: 'LISTAR', args: 'pausados' }
  if (verbo === 'listar' || verbo === 'lista' || verbo === 'liste')
    return { comando: 'LISTAR', args: '' }
  if (verbo === 'ver' || verbo === 'veja') return { comando: 'VER', args: '' }
  return null
}

const FINAIS_ORCAMENTO = new Set(['reais', 'real', 'dia', 'ao', 'por'])

export function interpretar(texto: string): Intencao | null {
  const original = (texto || '').trim().split(/\s+/).filter(Boolean)
  // Tira o preenchimento do comeco ("Clara, por favor pause...").
  let i = 0
  while (i < original.length && PREENCHIMENTO.has(chave(original[i]))) i++
  const tokens = original.slice(i)
  if (tokens.length === 0) return null

  const verbo = chave(tokens[0])
  const resto = tokens.slice(1)
  const chavesResto = resto.map(chave).filter(Boolean)

  if (VERBOS_CONSULTA.has(verbo)) return alvoConsulta(chavesResto, verbo)

  // "anuncios" sozinho = historico (ANUNCIOS); com "ativos" = LISTAR.
  if (verbo === 'anuncios' || verbo === 'anuncio') {
    if (chavesResto.length === 0) return { comando: 'ANUNCIOS', args: '' }
    if (chavesResto.some((c) => c === 'ativos' || c === 'ativas'))
      return { comando: 'LISTAR', args: '' }
    if (chavesResto.some((c) => c === 'pausados' || c === 'pausadas')) {
      return { comando: 'LISTAR', args: 'pausados' }
    }
    return { comando: 'ANUNCIOS', args: '' }
  }

  const comando = VERBOS[verbo]
  if (!comando) return null

  let args = resto

  // RESPONDER e CORRIGIR: o resto e texto livre, nunca mexe.
  if (comando !== 'RESPONDER' && comando !== 'CORRIGIR') {
    let j = 0
    while (j < args.length && ARTIGOS_INICIAIS.has(chave(args[j]))) j++
    args = args.slice(j)
  }

  if (comando === 'ORCAMENTO') {
    while (args.length > 1 && FINAIS_ORCAMENTO.has(chave(args[args.length - 1])))
      args = args.slice(0, -1)
    if (args.length > 2) {
      const penultimo = chave(args[args.length - 2])
      if (penultimo === 'para' || penultimo === 'pra')
        args = [...args.slice(0, -2), args[args.length - 1]]
    }
  }

  return { comando, args: args.join(' ') }
}

export type RespostaConfirmacao = 'sim' | 'nao'

const SIM = new Set([
  'sim',
  's',
  'confirmo',
  'confirmar',
  'confirma',
  'pode',
  'pode sim',
  'sim pode',
  'sim confirmo',
  'ok sim',
])
const NAO = new Set([
  'nao',
  'n',
  'cancela',
  'cancelar',
  'cancele',
  'deixa',
  'deixa pra la',
  'nao pode',
  'nao quero',
  'esquece',
])

export function respostaConfirmacao(texto: string): RespostaConfirmacao | null {
  const limpo = normalizar(texto)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^clara /, '')
  if (SIM.has(limpo)) return 'sim'
  if (NAO.has(limpo)) return 'nao'
  return null
}

// "pausar 2" / "ativar n 3": numero do item da ultima lista (LISTAR).
export function numeroDoItem(args: string): number | null {
  const m = args.trim().match(/^(?:n[ºo°]?\s*|numero\s+)?(\d{1,2})$/i)
  return m ? Number(m[1]) : null
}
