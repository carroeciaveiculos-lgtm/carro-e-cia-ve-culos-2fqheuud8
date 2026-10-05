// Lê só o início de um JPEG (64 KB) pra descobrir largura e altura, sem baixar a foto inteira.
// Usado pra tirar do carrossel do Instagram as fotos com proporção que ele recusa: o Instagram
// só aceita de 4:5 (0,8) até 1,91:1 — foto vertical de celular (3:4 = 0,75) é rejeitada
// (Fase 2 da postagem automática, 03/10/2026).

export const PROPORCAO_MIN_INSTAGRAM = 0.8
export const PROPORCAO_MAX_INSTAGRAM = 1.91

function dimensoesDoJpeg(b: Uint8Array): { largura: number; altura: number } | null {
  let i = 2
  while (i < b.length - 9) {
    if (b[i] !== 0xff) {
      i++
      continue
    }
    const marcador = b[i + 1]
    // SOF0..SOF15, exceto DHT (c4), JPG (c8) e DAC (cc): carregam altura e largura
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return { altura: (b[i + 5] << 8) | b[i + 6], largura: (b[i + 7] << 8) | b[i + 8] }
    }
    i += 2 + ((b[i + 2] << 8) | b[i + 3])
  }
  return null
}

// true = pode ir; false = proporção recusada. Se não der pra ler a foto, deixa passar (null) —
// melhor tentar do que descartar uma foto boa por falha de leitura.
export async function proporcaoAceitaPeloInstagram(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-65535' } })
    if (!r.ok) return true
    const dim = dimensoesDoJpeg(new Uint8Array(await r.arrayBuffer()))
    if (!dim || !dim.altura) return true
    const proporcao = dim.largura / dim.altura
    return proporcao >= PROPORCAO_MIN_INSTAGRAM && proporcao <= PROPORCAO_MAX_INSTAGRAM
  } catch {
    return true
  }
}
