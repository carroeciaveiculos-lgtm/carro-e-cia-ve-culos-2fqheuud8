// Criativo "Padrão Carro e Cia" — FEED 1080 x 1350 (4:5).
// Criado em 01/11/2026 a partir da arte de referência e do prompt/JSON enviados
// pela Adriana (pasta "IMAGENS PARA ANUNCIOS"). Arquivo NOVO e independente: os 2
// modelos antigos (criativo-anuncio.ts) continuam como estão até ela aprovar este.
//
// Regras desta primeira entrega (combinadas em 01/11/2026):
// - só o Feed (Stories fica pra depois, se houver uso real);
// - foto ORIGINAL, sem IA (o JSON proíbe alterar a aparência do veículo);
// - SEM o selo "Cautelar Aprovada" (falta um registro verificável da vistoria);
// - "à vista" é campo editável, nunca texto fixo;
// - tudo é desenhado por código com os dados reais — nenhum dado inventado.

export const MODELO_PADRAO_SLUG = 'criativo_padrao_carro_e_cia'
export const FEED_PADRAO = { w: 1080, h: 1350 }
// Fotos usadas por este padrão: 1 principal + 2 complementares.
export const MAX_FOTOS_PADRAO = 3

export interface DadosCriativoPadrao {
  marca: string
  modelo: string
  versao: string
  // 3ª linha do título: motor / potência / combustível ou propulsão (opcional).
  linhaMotor: string
  anoFabricacao: string
  anoModelo: string
  km: string // já formatado ("27.000 km"); vazio = não mostra o card
  cambio: string
  precoVenda: number
  condicao: string // ex.: "à vista"; vazio = sem etiqueta
}

const COR = {
  preto: '#0B0B0B',
  vermelho: '#D32225',
  branco: '#FFFFFF',
  cinzaEscuro: '#242424',
  cinzaBorda: '#3A3A3A',
  cinzaTexto: '#C8C8C8',
}

const FAMILIA = "'Montserrat', Arial, sans-serif"

// A Montserrat está só declarada no tailwind.config, o app não a carrega. O canvas
// precisa dela já pronta antes de desenhar, senão cai em Arial sem avisar. Se a
// fonte não carregar (offline, bloqueio), o desenho segue com Arial.
export async function prepararFontesPadrao(): Promise<void> {
  try {
    const id = 'fonte-montserrat-criativo'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap'
      document.head.appendChild(link)
      await new Promise<void>((resolve) => {
        link.onload = () => resolve()
        link.onerror = () => resolve()
        setTimeout(resolve, 4000)
      })
    }
    await Promise.all([
      document.fonts.load('800 40px Montserrat'),
      document.fonts.load('700 40px Montserrat'),
      document.fonts.load('600 40px Montserrat'),
    ])
  } catch {
    // segue com a fonte alternativa
  }
}

function caminho(
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

// Foto sem distorção: preenche a área e corta o excesso (cover), centralizada.
function fotoCover(
  ctx: CanvasRenderingContext2D,
  foto: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  raio = 6,
) {
  const escala = Math.max(w / foto.width, h / foto.height)
  const fw = foto.width * escala
  const fh = foto.height * escala
  ctx.save()
  caminho(ctx, x, y, w, h, raio)
  ctx.clip()
  ctx.drawImage(foto, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh)
  ctx.restore()
  ctx.strokeStyle = COR.cinzaBorda
  ctx.lineWidth = 2
  caminho(ctx, x, y, w, h, raio)
  ctx.stroke()
}

// Reduz a fonte até o texto caber na largura. Nunca corta nem usa reticências.
function ajustar(
  ctx: CanvasRenderingContext2D,
  texto: string,
  peso: number,
  larguraMax: number,
  maximo: number,
  minimo: number,
): number {
  let t = maximo
  while (t > minimo) {
    ctx.font = `${peso} ${t}px ${FAMILIA}`
    if (ctx.measureText(texto).width <= larguraMax) return t
    t -= 2
  }
  ctx.font = `${peso} ${minimo}px ${FAMILIA}`
  return minimo
}

// Marca + Modelo: 1 linha no maior tamanho que couber (62 a 30). Se nem no mínimo
// couber (nome muito longo), quebra em 2 linhas equilibradas — nunca corta o texto.
function tituloEmLinhas(
  ctx: CanvasRenderingContext2D,
  texto: string,
  largura: number,
): { linhas: string[]; tam: number } {
  const tam1 = ajustar(ctx, texto, 800, largura, 62, 30)
  if (ctx.measureText(texto).width <= largura) return { linhas: [texto], tam: tam1 }
  const palavras = texto.split(/\s+/)
  if (palavras.length < 2)
    return { linhas: [texto], tam: ajustar(ctx, texto, 800, largura, 30, 14) }
  ctx.font = `800 40px ${FAMILIA}`
  let melhor = 1
  let menorLargura = Infinity
  for (let i = 1; i < palavras.length; i++) {
    const a = palavras.slice(0, i).join(' ')
    const b = palavras.slice(i).join(' ')
    const l = Math.max(ctx.measureText(a).width, ctx.measureText(b).width)
    if (l < menorLargura) {
      menorLargura = l
      melhor = i
    }
  }
  const linhas = [palavras.slice(0, melhor).join(' '), palavras.slice(melhor).join(' ')]
  const tam = Math.min(...linhas.map((l) => ajustar(ctx, l, 800, largura, 52, 18)))
  return { linhas, tam }
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

// ---- Ícones simples dos cards (vermelhos), desenhados por código ----
type Icone = 'ano' | 'km' | 'cambio'

function desenharIcone(
  ctx: CanvasRenderingContext2D,
  tipo: Icone,
  cx: number,
  cy: number,
  s: number,
) {
  ctx.save()
  ctx.strokeStyle = COR.vermelho
  ctx.fillStyle = COR.vermelho
  ctx.lineWidth = Math.max(3, s / 12)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const r = s / 2
  if (tipo === 'ano') {
    caminho(ctx, cx - r, cy - r * 0.8, s, s * 0.9, 6)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - r, cy - r * 0.35)
    ctx.lineTo(cx + r, cy - r * 0.35)
    ctx.moveTo(cx - r * 0.45, cy - r)
    ctx.lineTo(cx - r * 0.45, cy - r * 0.6)
    ctx.moveTo(cx + r * 0.45, cy - r)
    ctx.lineTo(cx + r * 0.45, cy - r * 0.6)
    ctx.stroke()
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        ctx.beginPath()
        ctx.arc(cx - r * 0.5 + i * r * 0.5, cy + r * 0.05 + j * r * 0.4, s / 22, 0, Math.PI * 2)
        ctx.fill()
      }
  } else if (tipo === 'km') {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.72, Math.PI * 0.8, Math.PI * 2.2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, cy + r * 0.1)
    ctx.lineTo(cx + r * 0.5, cy - r * 0.4)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy + r * 0.1, s / 14, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // câmbio: alavanca em "H"
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.4, cy - r * 0.45)
    ctx.lineTo(cx - r * 0.4, cy + r * 0.45)
    ctx.moveTo(cx + r * 0.4, cy - r * 0.45)
    ctx.lineTo(cx + r * 0.4, cy + r * 0.45)
    ctx.moveTo(cx - r * 0.4, cy)
    ctx.lineTo(cx + r * 0.4, cy)
    ctx.stroke()
    for (const [px, py] of [
      [-0.4, -0.45],
      [0.4, -0.45],
      [-0.4, 0.45],
      [0.4, 0.45],
    ]) {
      ctx.beginPath()
      ctx.arc(cx + px * r, cy + py * r, s / 16, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

// Desenha o Feed completo. `fotos[0]` = principal; `fotos[1..2]` = complementares.
// `logo` é a logo ORIGINAL para fundo preto (já recortada), ou null.
export function desenharCriativoPadrao(
  canvas: HTMLCanvasElement,
  fotos: HTMLImageElement[],
  logo: HTMLCanvasElement | null,
  d: DadosCriativoPadrao,
) {
  const { w: W, h: H } = FEED_PADRAO
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível desenhar o criativo')

  const M = 32
  const GAP = 20
  ctx.fillStyle = COR.preto
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'

  const largura = W - 2 * M
  const base = H - M

  // ---- Blocos de baixo pra cima: medimos tudo antes, pra foto principal ocupar o resto ----
  const complementares = fotos.slice(1, MAX_FOTOS_PADRAO)
  const compH = complementares.length ? 248 : 0
  const specsH = 92
  const precoH = d.precoVenda > 0 ? 116 : 0

  // Título em 3 níveis: Marca+Modelo (maior), versão, motor/potência/combustível.
  const linha1 = `${d.marca} ${d.modelo}`.trim().toUpperCase()
  const linha2 = d.versao.trim()
  const linha3 = d.linhaMotor.trim()
  const { linhas: linhas1, tam: t1 } = tituloEmLinhas(ctx, linha1, largura)
  const t2 = linha2 ? ajustar(ctx, linha2, 600, largura, 38, 22) : 0
  const t3 = linha3 ? ajustar(ctx, linha3, 600, largura, 30, 20) : 0
  const tituloH =
    linhas1.length * t1 + (linhas1.length - 1) * 6 + (t2 ? t2 + 14 : 0) + (t3 ? t3 + 12 : 0)

  const fixo =
    GAP + tituloH + GAP + (precoH ? precoH + GAP : 0) + specsH + (compH ? GAP + compH : 0)
  const fotoY = M
  const fotoH = Math.max(380, base - fotoY - fixo)

  // ---- Foto principal ----
  if (fotos[0]) fotoCover(ctx, fotos[0], M, fotoY, largura, fotoH, 6)

  // Cabeçalho: polígono preto com corte na diagonal por cima da foto, com a logo.
  const cabH = 150
  ctx.fillStyle = COR.preto
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(520, 0)
  ctx.lineTo(430, cabH + M)
  ctx.lineTo(0, cabH + M)
  ctx.closePath()
  ctx.fill()
  if (logo && logo.width) {
    const lw = 340
    const lh = (lw * logo.height) / logo.width
    ctx.drawImage(logo, 44, M + (cabH - lh) / 2 - 6, lw, lh)
  }

  let y = fotoY + fotoH + GAP

  // ---- Título ----
  ctx.fillStyle = COR.branco
  ctx.font = `800 ${t1}px ${FAMILIA}`
  linhas1.forEach((l, i) => {
    y += (i ? 6 : 0) + t1
    ctx.fillText(l, W / 2, y - t1 * 0.12)
  })
  if (t2) {
    y += 14 + t2
    ctx.fillStyle = '#E6E6E6'
    ctx.font = `600 ${t2}px ${FAMILIA}`
    ctx.fillText(linha2, W / 2, y - t2 * 0.12)
  }
  if (t3) {
    y += 12 + t3
    ctx.fillStyle = COR.cinzaTexto
    ctx.font = `600 ${t3}px ${FAMILIA}`
    ctx.fillText(linha3, W / 2, y - t3 * 0.12)
  }
  y += GAP

  // ---- Preço: caixa preta com contorno vermelho + etiqueta lateral (condição) ----
  if (precoH) {
    const etiqueta = d.condicao.trim()
    const etqW = etiqueta ? 230 : 0
    ctx.fillStyle = '#050505'
    ctx.fillRect(M, y, largura, precoH)
    ctx.strokeStyle = COR.vermelho
    ctx.lineWidth = 4
    ctx.strokeRect(M + 2, y + 2, largura - 4, precoH - 4)
    const areaPreco = largura - etqW - 40
    const preco = formatarPreco(d.precoVenda)
    const tp = ajustar(ctx, preco, 800, areaPreco, 76, 34)
    ctx.fillStyle = COR.branco
    ctx.textBaseline = 'middle'
    ctx.fillText(preco, M + (largura - etqW) / 2, y + precoH / 2 + 2)
    if (etiqueta) {
      ctx.fillStyle = COR.vermelho
      ctx.fillRect(M + largura - etqW, y + 2, etqW - 2, precoH - 4)
      ctx.fillStyle = COR.branco
      const te = ajustar(ctx, etiqueta, 700, etqW - 30, 34, 18)
      ctx.font = `700 ${te}px ${FAMILIA}`
      ctx.fillText(etiqueta, M + largura - etqW / 2, y + precoH / 2 + 2)
    }
    ctx.textBaseline = 'alphabetic'
    void tp
    y += precoH + GAP
  }

  // ---- 3 cards de especificações (só os que têm dado; nada é inventado) ----
  const anos =
    d.anoFabricacao && d.anoModelo
      ? `${d.anoFabricacao}/${d.anoModelo}`
      : d.anoModelo || d.anoFabricacao
  const cards: { icone: Icone; texto: string }[] = [
    { icone: 'ano' as Icone, texto: anos },
    { icone: 'km' as Icone, texto: d.km },
    { icone: 'cambio' as Icone, texto: d.cambio },
  ].filter((c) => c.texto)
  if (cards.length) {
    const gapC = 14
    const cw = (largura - gapC * (cards.length - 1)) / cards.length
    cards.forEach((c, i) => {
      const cx0 = M + i * (cw + gapC)
      ctx.fillStyle = '#101010'
      ctx.fillRect(cx0, y, cw, specsH)
      ctx.strokeStyle = COR.cinzaBorda
      ctx.lineWidth = 2
      ctx.strokeRect(cx0 + 1, y + 1, cw - 2, specsH - 2)
      desenharIcone(ctx, c.icone, cx0 + 44, y + specsH / 2, 40)
      const areaTexto = cw - 44 - 28 - 20
      const ts = ajustar(ctx, c.texto, 700, areaTexto, 34, 18)
      ctx.fillStyle = COR.branco
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.font = `700 ${ts}px ${FAMILIA}`
      ctx.fillText(c.texto, cx0 + 44 + 28 + areaTexto / 2, y + specsH / 2 + 2)
      ctx.textBaseline = 'alphabetic'
    })
  }
  y += specsH

  // ---- Fotos complementares (até 2) ----
  if (compH) {
    y += GAP
    const gapF = 16
    const fw = (largura - gapF * (complementares.length - 1)) / complementares.length
    complementares.forEach((img, i) => fotoCover(ctx, img, M + i * (fw + gapF), y, fw, compH, 6))
  }
}
