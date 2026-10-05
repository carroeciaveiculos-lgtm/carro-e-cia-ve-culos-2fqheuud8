// Fotos com marca de IA (04/10/2026).
// O "Photo assist" do Galaxy AI (Samsung) grava, nas fotos editadas, (1) uma marca d'água VISÍVEL
// "Conteúdo gerado por IA" no canto inferior esquerdo, nos próprios pixels, e (2) Credenciais de
// Conteúdo (C2PA) nos metadados, com digitalSourceType = compositeWithTrainedAlgorithmicMedia.
// Decisão da Adriana: as marcas NÃO são removidas (a foto foi de fato editada por IA; esconder isso
// num anúncio de veículo engana o comprador). O caminho é usar fotos sem a marca ou as originais.
//
// LIMITE: a detecção olha só os metadados (C2PA). Uma foto editada pela Samsung e depois reenviada por
// WhatsApp perde os metadados e mantém a marca d'água: essa NÃO é detectada aqui.

export const MIN_FOTOS_LIMPAS = 6

// O manifesto C2PA fica no começo do JPEG (testado em 554 fotos do estoque com 300 KB)
const BYTES_LIDOS = 300_000
const MARCADORES = ['compositeWithTrainedAlgorithmicMedia', 'trainedAlgorithmicMedia']
const SIMULTANEAS = 6

// true = tem marca de IA; false = limpa; null = não deu para verificar (erro de rede etc.)
export async function fotoTemMarcaIA(url: string): Promise<boolean | null> {
  try {
    const r = await fetch(url, {
      headers: { Range: `bytes=0-${BYTES_LIDOS - 1}` },
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok && r.status !== 206) return null
    const bytes = new Uint8Array(await r.arrayBuffer())
    // latin1: cada byte vira um caractere, sem erro com binário
    const texto = new TextDecoder('latin1').decode(bytes)
    return MARCADORES.some((m) => texto.includes(m))
  } catch {
    return null
  }
}

export type ClassificacaoFotos = Record<string, boolean | null>

// Classifica as fotos usando o cache (tabela veiculo_fotos_ia) e só consulta as que faltam.
// `forcar` ignora o cache (para reverificar). Resultado nulo não é guardado no cache.
// deno-lint-ignore no-explicit-any
export async function classificarFotos(
  supabase: any,
  veiculoId: string | null,
  urls: string[],
  opcoes: { forcar?: boolean } = {},
): Promise<ClassificacaoFotos> {
  const resultado: ClassificacaoFotos = {}
  const unicas = Array.from(new Set(urls))

  if (!opcoes.forcar && unicas.length > 0) {
    const { data } = await supabase
      .from('veiculo_fotos_ia')
      .select('url, marcada')
      .in('url', unicas)
    for (const l of (data ?? []) as { url: string; marcada: boolean }[]) resultado[l.url] = l.marcada
  }

  const faltam = unicas.filter((u) => resultado[u] === undefined)
  // pequena fila com poucas leituras ao mesmo tempo (não sobrecarrega o R2 nem o tempo da function)
  let proxima = 0
  const trabalhador = async () => {
    while (proxima < faltam.length) {
      const url = faltam[proxima++]
      resultado[url] = await fotoTemMarcaIA(url)
    }
  }
  await Promise.all(Array.from({ length: Math.min(SIMULTANEAS, faltam.length) }, trabalhador))

  const novas = faltam
    .filter((u) => resultado[u] !== null)
    .map((u) => ({
      url: u,
      veiculo_id: veiculoId,
      marcada: resultado[u] as boolean,
      verificada_em: new Date().toISOString(),
    }))
  if (novas.length > 0) {
    const { error } = await supabase.from('veiculo_fotos_ia').upsert(novas, { onConflict: 'url' })
    if (error) console.error('Falha ao guardar a verificação das fotos:', error.message)
  }
  return resultado
}
