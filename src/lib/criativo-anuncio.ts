// Utilitários do gerador de criativos de anúncio (Meta Ads / Google Ads / posts orgânicos).
// Os 2 modelos antigos (fundo escuro e fundo claro) foram APOSENTADOS em 01/11/2026 a
// pedido da Adriana: o único modelo hoje é o "Padrão Carro e Cia" (criativo-padrao.ts).
// Sobrou aqui só o que o painel ainda usa: carregar imagem, preparar a logo e constantes.
//
// Tudo é desenhado por código a partir dos dados reais do veículo — a IA
// (function gerar-criativo-anuncio) trata só a foto principal e nunca escreve
// preço, km, logo ou qualquer texto, pra nunca sair um número errado num anúncio.

// Tipo do resultado salvo: 'quadrado' = 1:1, 'feed' = 4:5, 'stories' = 9:16.
export type FormatoCriativo = 'quadrado' | 'feed' | 'stories'

export const MAX_FOTOS_CRIATIVO = 4

// Logo branca e vermelha com transparência REAL (01/11/2026), servida do próprio site
// (public/). Não precisa remover quadriculado: usar prepararLogo(img, false).
export const LOGO_FUNDO_ESCURO_URL = '/logo-carro-e-cia-branco-vermelho.png'

// Recorta as margens vazias e, se pedido, remove o quadriculado gravado nos pixels.
export function prepararLogo(
  img: HTMLImageElement,
  removerQuadriculado: boolean,
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const x = c.getContext('2d', { willReadFrequently: true })
  if (!x) throw new Error('Não foi possível preparar a logo')
  x.drawImage(img, 0, 0)
  const im = x.getImageData(0, 0, c.width, c.height)
  const d = im.data
  let minx = Infinity
  let miny = Infinity
  let maxx = -1
  let maxy = -1
  for (let p = 0, i = 0; p < d.length; p += 4, i++) {
    if (removerQuadriculado) {
      const r = d[p]
      const g = d[p + 1]
      const b = d[p + 2]
      const sat = Math.max(r, g, b) - Math.min(r, g, b)
      const lum = (r + g + b) / 3
      // Colorido (o vermelho): opaco. Cinza/branco: o quadriculado (<=228) some, o
      // branco das letras (>=244) fica, e a faixa entre os dois vira borda suave.
      const a =
        sat >= 14
          ? Math.min(1, (sat - 14) / 36)
          : lum <= 228
            ? 0
            : lum >= 244
              ? 1
              : (lum - 228) / 16
      d[p + 3] = Math.round(a * 255)
    }
    if (d[p + 3] > 12) {
      const px = i % c.width
      const py = (i / c.width) | 0
      if (px < minx) minx = px
      if (px > maxx) maxx = px
      if (py < miny) miny = py
      if (py > maxy) maxy = py
    }
  }
  if (removerQuadriculado) x.putImageData(im, 0, 0)
  if (maxx < 0) return c
  const bw = maxx - minx + 1
  const bh = maxy - miny + 1
  const out = document.createElement('canvas')
  out.width = bw
  out.height = bh
  out.getContext('2d')?.drawImage(c, minx, miny, bw, bh, 0, 0, bw, bh)
  return out
}

// O navegador guarda a resposta de uma foto carregada SEM CORS (as miniaturas
// da grade) e a reaproveita quando a mesma foto é pedida COM CORS (desenho no
// canvas), que então é recusada. Reproduzido ao vivo em 30/09/2026: era essa a
// causa do erro ao clicar numa foto do Gerador. Se a primeira tentativa falhar,
// pede de novo com um parâmetro extra, o que força uma requisição nova.
export function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const tentar = (src: string, ultima: boolean) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => {
        if (ultima || url.startsWith('data:')) return reject(new Error('Falha ao carregar imagem'))
        tentar(`${url}${url.includes('?') ? '&' : '?'}cors=${Date.now()}`, true)
      }
      img.src = src
    }
    tentar(url, false)
  })
}
