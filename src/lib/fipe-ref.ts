const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

// A FIPE publica o carro 0 km como uma linha de "ano 32000" (código "32000-5",
// nome cru "32000 Flex"), com preço próprio — não é um percentual sobre o ano-modelo.
export const ANO_FIPE_ZERO_KM = 32000

// "32000 Flex" -> "0 km Flex". Qualquer outro nome passa sem mudança.
export const nomeAnoFipe = (nome: string) => nome.replace(/^32000\b/, '0 km')

// 32000 -> "0 km"; 2026 -> "2026".
export const anoFipeLegivel = (ano: number | string) =>
  Number(ano) === ANO_FIPE_ZERO_KM ? '0 km' : String(ano)

const semAcento =(s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

// Padroniza o mês de referência da FIPE como "outubro/2026" (formato que a
// function fipe-atualizar-estoque grava em veiculos.fipe_ref). Aceita
// "outubro/2026", "Outubro de 2026", "10/2026" e "2026-10". Devolve null para
// qualquer outra coisa (vazio, "Atual", "Mês Atual"), pra nunca mostrar como
// mês real um texto que não é uma data.
export const normalizarMesFipe = (valor: unknown): string | null => {
  const texto = String(valor ?? '')
    .trim()
    .toLowerCase()
  if (!texto) return null

  const numerico = texto.match(/^(\d{1,2})[/-](\d{4})$/) || texto.match(/^(\d{4})[/-](\d{1,2})$/)
  if (numerico) {
    const [a, b] = [numerico[1], numerico[2]]
    const mes = Number(a.length === 4 ? b : a)
    const ano = a.length === 4 ? a : b
    return mes >= 1 && mes <= 12 ? `${MESES[mes - 1]}/${ano}` : null
  }

  const porExtenso = semAcento(texto).match(/^([a-z]+)\s*(?:\/|-|de)?\s*(\d{4})$/)
  if (porExtenso) {
    const indice = MESES.findIndex((m) => semAcento(m) === porExtenso[1])
    return indice >= 0 ? `${MESES[indice]}/${porExtenso[2]}` : null
  }

  return null
}

// "outubro/2026" | "2026-08" | "08-2026" -> "2026-10" (chave ordenável para juntar pontos
// de fontes diferentes: a consulta de placa guarda "2026-08", a automação "setembro/2026").
export const chaveMesFipe = (valor: unknown): string | null => {
  const padrao = normalizarMesFipe(valor)
  if (!padrao) return null
  const [nome, ano] = padrao.split('/')
  const indice = MESES.indexOf(nome)
  return indice >= 0 ? `${ano}-${String(indice + 1).padStart(2, '0')}` : null
}

// "2026-08" -> "ago/26"
export const rotuloMesFipe = (chave: string) => {
  const [ano, mes] = chave.split('-')
  return `${MESES[Number(mes) - 1].slice(0, 3)}/${ano.slice(2)}`
}

type PontoFipe = { mes: string; valor: number }

// Junta o histórico guardado no cadastro (vem da consulta de placa e fica congelado no dia
// da consulta) com os valores que a automação diária grava em fipe_valores_veiculo. Quando o
// mesmo mês existe nos dois, vale o da automação (é o que está no campo Valor FIPE).
// Pontos com mês que não é uma data ("Mês Atual", "2 Meses Atrás") ou valor zero são
// descartados — nunca desenhar no gráfico algo que não seja um mês real.
export const montarHistoricoFipe = (
  guardado: Array<Record<string, any>>,
  automacao: Array<{ referencia_mes: string; valor: number | string | null }>,
): PontoFipe[] => {
  const porMes = new Map<string, number>()
  for (const item of guardado) {
    const chave = chaveMesFipe(item.mes_referencia || item.mes || item.reference)
    const valor = Number(item.valor_fipe || item.valor || item.preco_fipe || item.price || 0)
    if (chave && valor > 0) porMes.set(chave, valor)
  }
  for (const item of automacao) {
    const chave = chaveMesFipe(item.referencia_mes)
    const valor = Number(item.valor || 0)
    if (chave && valor > 0) porMes.set(chave, valor)
  }
  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, valor]) => ({ mes: rotuloMesFipe(chave), valor }))
}
