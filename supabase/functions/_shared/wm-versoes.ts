// Versões da Webmotors com os anos de modelo válidos — 06/10/2026.
//
// Achado real (ix35 PBB9J82): o ObterVersao devolve, em cada <Versao>, a lista de anos aceitos
// (<AnoModelo><AnoModeloWM><AnoModelo>2018</AnoModelo>...). A versão 346376 só valia 2016; o carro era 2018 e a
// Webmotors recusava com 43|41,43|37. O mapeador só comparava o TEXTO do nome da versão e descartava os anos.
// Terceira ocorrência (BMW 120iA, Haval H6, ix35). Agora o ano guardado filtra as candidatas.

export type VersaoWM = { codigo_wm: string; nome_wm: string | null; anos_modelo: number[] | null }

// Extrai {codigo, nome, anos} de cada <Versao> do XML do ObterVersao
export function extrairVersoes(
  xml: string,
): { codigo_wm: string; nome_wm: string | null; anos_modelo: number[] }[] {
  const saida: { codigo_wm: string; nome_wm: string | null; anos_modelo: number[] }[] = []
  const blocos = xml.match(/<(?:\w+:)?Versao>[\s\S]*?<\/(?:\w+:)?Versao>/g) || []
  for (const b of blocos) {
    const cod = b.match(/<(?:\w+:)?CodigoVersao>\s*(\d+)\s*</)?.[1]
    if (!cod || cod === '0') continue
    const nome = b.match(/<(?:\w+:)?NomeVersao>([^<]*)</)?.[1]?.trim() || null
    const anos = new Set<number>()
    for (const m of b.matchAll(/<(?:\w+:)?AnoModeloWM>\s*<(?:\w+:)?AnoModelo>\s*(\d{4})\s*</g))
      anos.add(Number(m[1]))
    saida.push({ codigo_wm: cod, nome_wm: nome, anos_modelo: [...anos].sort((a, b) => a - b) })
  }
  return saida
}

// Vale para o ano? Ano desconhecido (null ou lista vazia) nunca bloqueia: só filtra com informação.
export function versaoValeParaAno(
  v: { anos_modelo: number[] | null },
  ano: number | null | undefined,
): boolean {
  if (!ano || !v.anos_modelo || v.anos_modelo.length === 0) return true
  return v.anos_modelo.includes(Number(ano))
}

// Separa as versões que valem para o ano das que sabidamente não valem
export function filtrarPorAno<T extends { anos_modelo: number[] | null }>(
  versoes: T[],
  ano: number | null | undefined,
): { validas: T[]; descartadas: T[] } {
  const validas: T[] = []
  const descartadas: T[] = []
  for (const v of versoes) (versaoValeParaAno(v, ano) ? validas : descartadas).push(v)
  return { validas, descartadas }
}

// Lista exata (não intervalo): a 345463 vale 2015-2018 e 2021, e um "2015–2021" esconderia o buraco
export const rotuloAnos = (anos: number[] | null | undefined) =>
  anos && anos.length ? anos.join(', ') : 'ano não informado'
