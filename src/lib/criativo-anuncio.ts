// Gerador de criativos de anúncio (Meta Ads / Google Ads / posts orgânicos).
// Reescrito em 30/09/2026 a pedido da Adriana: 1 a 4 fotos, formato Feed ou
// Stories, apenas 2 modelos (fundo escuro e fundo claro) e a LOGO ORIGINAL,
// com fundo transparente, sem nenhuma alteração.
//
// Tudo aqui é desenhado por código a partir dos dados reais do veículo — a IA
// (function gerar-criativo-anuncio) trata só a foto principal e nunca escreve
// preço, km, logo ou qualquer texto, pra nunca sair um número errado num anúncio.

export type FormatoCriativo = 'feed' | 'stories'

export interface FormatoCfg {
  nome: string
  dimensoes: string
  w: number
  h: number
  // Áreas que o Instagram cobre com a interface do Stories (nome da conta no
  // topo, caixa de resposta embaixo) — nada importante pode ficar nelas.
  margemTopo: number
  margemBase: number
}

export const FORMATOS: Record<FormatoCriativo, FormatoCfg> = {
  feed: { nome: 'Feed', dimensoes: '1080 × 1350', w: 1080, h: 1350, margemTopo: 0, margemBase: 0 },
  stories: {
    nome: 'Stories',
    dimensoes: '1080 × 1920',
    w: 1080,
    h: 1920,
    margemTopo: 200,
    margemBase: 240,
  },
}

interface Tema {
  fundo: string
  texto: string
  subtexto: string
  destaque: string
}

export type TipoLogo = 'paraFundoEscuro' | 'paraFundoClaro'

export interface ModeloCriativo {
  slug: string
  nome: string
  tema: Tema
  // Cada modelo usa a versão da logo feita pro seu fundo (a de fundo claro é
  // escura e sumiria no escuro, e a de fundo escuro tem letras brancas).
  logo: TipoLogo
}

export const MODELOS_CRIATIVO: ModeloCriativo[] = [
  {
    slug: 'criativo_fundo_escuro',
    nome: 'Fundo escuro',
    tema: { fundo: '#0b1220', texto: '#ffffff', subtexto: '#cbd5e1', destaque: '#ef4444' },
    logo: 'paraFundoEscuro',
  },
  {
    slug: 'criativo_fundo_claro',
    nome: 'Fundo claro',
    tema: { fundo: '#f1f5f9', texto: '#0f172a', subtexto: '#475569', destaque: '#dc2626' },
    logo: 'paraFundoClaro',
  },
]

export const MAX_FOTOS_CRIATIVO = 4

// As logos são as originais enviadas pela Adriana (30/09/2026), sem recolorir, sem
// filtro, sem caixa e sem IA — só são recortadas das margens vazias e
// redimensionadas na proporção original.
// - paraFundoClaro: "logo carro e cia.png", 340x90, transparente de verdade.
// - paraFundoEscuro: "logo carro e cia para fundo preto.png", 1536x864. Esse arquivo
//   NÃO tem transparência: o quadriculado cinza do editor foi salvo junto, nos
//   pixels. prepararLogo(img, true) tira esse quadriculado (cinzas entre ~190 e ~228,
//   bem diferentes do branco puro das letras e do vermelho). Com um PNG transparente
//   de verdade basta trocar a URL e passar `false`.
export const LOGO_FUNDO_CLARO_URL =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logo%20carro%20e%20cia.png'
export const LOGO_FUNDO_ESCURO_URL =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logo%20carro%20e%20cia%20para%20fundo%20preto.png'

export interface LogosCriativo {
  paraFundoClaro: HTMLCanvasElement | null
  paraFundoEscuro: HTMLCanvasElement | null
}

// Largura com que a logo é desenhada no cabeçalho (altura segue a proporção).
const LARGURA_LOGO = 360

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

export interface DadosCriativo {
  marca: string
  modelo: string
  versao: string
  anoModelo: string
  km: string
  cambio: string
  combustivel: string
  precoVenda: number
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

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function caminhoArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function desenharFotoCover(
  ctx: CanvasRenderingContext2D,
  foto: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  raio = 18,
) {
  const escala = Math.max(w / foto.width, h / foto.height)
  const fw = foto.width * escala
  const fh = foto.height * escala
  ctx.save()
  caminhoArredondado(ctx, x, y, w, h, raio)
  ctx.clip()
  ctx.drawImage(foto, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh)
  ctx.restore()
}

function ajustarFonte(
  ctx: CanvasRenderingContext2D,
  texto: string,
  larguraMax: number,
  tamanhoInicial: number,
): number {
  let t = tamanhoInicial
  while (t > 24) {
    ctx.font = `bold ${t}px Arial`
    if (ctx.measureText(texto).width <= larguraMax) break
    t -= 2
  }
  return t
}

// Desenha o criativo completo. `fotos[0]` é a principal (grande); as demais
// (até 3) aparecem em miniaturas embaixo dela.
export function desenharCriativo(
  canvas: HTMLCanvasElement,
  formato: FormatoCriativo,
  modelo: ModeloCriativo,
  fotos: HTMLImageElement[],
  logos: LogosCriativo,
  d: DadosCriativo,
) {
  const f = FORMATOS[formato]
  const { w: W, h: H } = f
  const t = modelo.tema
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível desenhar o criativo')

  const M = 56
  const G = 16
  ctx.fillStyle = t.fundo
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  let y = f.margemTopo

  // Cabeçalho com a logo ORIGINAL do modelo (recortada das margens, na proporção).
  const cabecalhoH = 170
  const logo = modelo.logo === 'paraFundoEscuro' ? logos.paraFundoEscuro : logos.paraFundoClaro
  if (logo && logo.width) {
    const lh = (LARGURA_LOGO * logo.height) / logo.width
    ctx.drawImage(logo, M, y + (cabecalhoH - lh) / 2, LARGURA_LOGO, lh)
  }
  ctx.fillStyle = t.destaque
  ctx.fillRect(0, y + cabecalhoH, W, 6)
  y += cabecalhoH + 6 + 36

  // Título
  const titulo = `${d.marca} ${d.modelo}`.trim().toUpperCase()
  ctx.fillStyle = t.texto
  const tamTitulo = ajustarFonte(ctx, titulo, W - 2 * M, 62)
  ctx.fillText(titulo, M, y)
  y += tamTitulo + 12
  if (d.versao) {
    ctx.fillStyle = t.subtexto
    const tamVersao = ajustarFonte(ctx, d.versao.toUpperCase(), W - 2 * M, 30)
    ctx.fillText(d.versao.toUpperCase(), M, y)
    y += tamVersao + 8
  }
  y += 12

  // Alturas fixas do rodapé, de baixo pra cima
  const especs = [d.anoModelo, d.km ? `${d.km} km` : '', d.cambio, d.combustivel]
    .filter(Boolean)
    .join('  •  ')
  const temPreco = d.precoVenda > 0
  const ctaH = 92
  const precoH = temPreco ? 118 : 0
  const especsH = especs ? 52 : 0
  const base = H - f.margemBase - M
  const miniaturas = fotos.slice(1, MAX_FOTOS_CRIATIVO)
  const miniH = miniaturas.length ? 190 : 0
  const gaps = 14 * 3 + (miniaturas.length ? G : 0)
  const heroH = Math.max(300, base - y - (ctaH + precoH + especsH + miniH + gaps))
  const heroW = W - 2 * M

  if (fotos[0]) desenharFotoCover(ctx, fotos[0], M, y, heroW, heroH)
  y += heroH

  if (miniaturas.length) {
    y += G
    const mw = (heroW - (miniaturas.length - 1) * G) / miniaturas.length
    miniaturas.forEach((img, i) => desenharFotoCover(ctx, img, M + i * (mw + G), y, mw, miniH, 14))
    y += miniH
  }

  y += 14
  if (especs) {
    ctx.fillStyle = t.subtexto
    const tam = ajustarFonte(ctx, especs, W - 2 * M, 36)
    ctx.fillText(especs, M, y)
    y += especsH
    void tam
  }
  if (temPreco) {
    ctx.fillStyle = t.destaque
    const preco = formatarMoeda(d.precoVenda)
    const tamPreco = ajustarFonte(ctx, preco, W - 2 * M, 100)
    ctx.fillText(preco, M, y)
    y += precoH
    void tamPreco
  }

  // Chamada final
  const ctaY = base - ctaH
  ctx.fillStyle = t.destaque
  caminhoArredondado(ctx, M, ctaY, W - 2 * M, ctaH, 16)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  const cta = 'Agende sua visita  •  carroeciamotors.com.br'
  const tamCta = ajustarFonte(ctx, cta, W - 2 * M - 40, 38)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cta, W / 2, ctaY + ctaH / 2)
  void tamCta
}
