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
