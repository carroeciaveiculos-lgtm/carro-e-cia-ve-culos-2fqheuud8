// Criativo "Padrão Carro e Cia" — layouts 1:1 e 4:5.
// Criado em 01/11/2026 a partir da arte de referência e do prompt/JSON enviados
// pela Adriana (pasta "IMAGENS PARA ANUNCIOS"). Arquivo independente: os 2 modelos
// antigos (criativo-anuncio.ts) continuam como estão até ela aprovar este.
//
// - 1:1 (1080x1080): medido sobre a arte de referência (Jaguar, ~892x898), título em 1 linha.
// - 4:5 (1080x1350): mesma identidade, título em 3 níveis (marca+modelo, versão, motor).
// - 9:16 (1080x1920, Stories, 01/11/2026): mesma pilha do 4:5, só que dentro da "área segura".
//   A interface do Instagram cobre o topo (perfil) e o rodapé (caixa de resposta), então
//   nada importante é desenhado nos 250 px de cima nem nos 340 px de baixo (regra prática
//   de mercado, a conferir na prévia real do Instagram). O que sobra (1330 px) é quase a
//   altura do 4:5 (1350 px), por isso as medidas internas e o tamanho pedido à IA são parecidos.
// - 16:9: ainda sem layout próprio (cada formato precisa do seu, não basta esticar).
// - Selo "Cautelar Aprovada" (03/11/2026): discreto, no canto superior direito da foto principal,
//   em todos os formatos. Antes era omitido por falta de registro verificável da vistoria; a
//   Adriana confirmou que TODO veículo entra no estoque com a cautelar aprovada, então o selo
//   não depende do campo `laudo_cautelar`. Se um dia entrar veículo sem cautelar aprovada,
//   é preciso voltar a condicionar o selo (propaganda enganosa se aparecer sem ter).
// - "à vista" é campo editável, nunca texto fixo; nenhum dado é inventado.

export type FormatoPadrao = '1:1' | '4:5' | '9:16'

// seguroTopo/seguroBase: faixa (px) que fica livre de foto e texto por causa da interface
// do Instagram (só o Stories usa; nos demais é 0).
export const FORMATOS_PADRAO: Record<
  FormatoPadrao,
  { nome: string; dimensoes: string; w: number; h: number; seguroTopo: number; seguroBase: number }
> = {
  '1:1': {
    nome: 'Quadrado 1:1',
    dimensoes: '1080 × 1080',
    w: 1080,
    h: 1080,
    seguroTopo: 0,
    seguroBase: 0,
  },
  '4:5': {
    nome: 'Feed 4:5',
    dimensoes: '1080 × 1350',
    w: 1080,
    h: 1350,
    seguroTopo: 0,
    seguroBase: 0,
  },
  '9:16': {
    nome: 'Stories 9:16',
    dimensoes: '1080 × 1920',
    w: 1080,
    h: 1920,
    seguroTopo: 250,
    seguroBase: 340,
  },
}

// Tamanho pedido à IA para a foto principal: a proporção da JANELA da foto de cada
// layout (assim o "respiro" que a IA deixa não é cortado pelo desenho). Largura e altura
// múltiplas de 16 e proporção entre 1:3 e 3:1, como exige a API (conferido na
// documentação oficial em 01/11/2026).
export const TAMANHO_IA_PADRAO: Record<FormatoPadrao, string> = {
  '1:1': '1536x752',
  '4:5': '1536x960',
  // Janela da foto no Stories: 1032 x 674 px (1920 - 250 - 340 - 656 fixos) = proporção 1,53.
  // 1536x1008 = proporção 1,52, ambos lados múltiplos de 16, dentro dos limites da API.
  '9:16': '1536x1008',
}

export const MODELO_PADRAO_SLUG = 'criativo_padrao_carro_e_cia'
// Fotos usadas por este padrão: 1 principal + 3 complementares (03/11/2026; eram 2).
// Deve ser igual a MAX_FOTOS_CRIATIVO (criativo-anuncio.ts): o painel deixa escolher esse
// tanto e, se este limite for menor, a última foto escolhida some sem aviso.
export const MAX_FOTOS_PADRAO = 4

// Selo servido do próprio site (public/): PNG com transparência real, 320x320.
export const SELO_CAUTELAR_URL = '/selo-cautelar-aprovada.png'

export interface DadosCriativoPadrao {
  marca: string
  modelo: string
  versao: string
  // 3ª linha do título no 4:5: motor / potência / combustível ou propulsão (opcional).
  linhaMotor: string
  // Texto extra no fim do título de 1 linha do 1:1 (ex.: "404 cv • Híbrido"). Opcional.
  complementoTitulo: string
  anoFabricacao: string
  anoModelo: string
  km: string // já formatado ("27.000 km"); vazio = não mostra o card
  cambio: string
  precoVenda: number
  condicao: string // etiqueta ao lado do preço; desde 06/11/2026 os chamadores mandam vazio (sem "à vista")
}

const COR = {
  preto: '#0B0B0B',
  vermelho: '#D32225',
  branco: '#FFFFFF',
  molduraFoto: '#CFCFCF',
  bordaCard: '#5A5A5A',
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
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap'
      document.head.appendChild(link)
      await new Promise<void>((resolve) => {
        link.onload = () => resolve()
        link.onerror = () => resolve()
        setTimeout(resolve, 4000)
      })
    }
    await Promise.all(
      [500, 600, 700, 800].map((peso) => document.fonts.load(`${peso} 40px Montserrat`)),
    )
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

// Foto SEM CORTE e sem distorção, centralizada, com moldura cinza-clara como na referência.
// Até 01/11/2026 a foto preenchia a janela e o excesso era cortado ("cover"): no 1:1 a janela
// é 2,06:1 e as fotos de celular são 4:3, então 35% da altura sumia (teto do carro cortado).
// Agora: se a proporção da foto é igual à da janela (caso da foto tratada pela IA, que já
// nasce na proporção da janela), preenche como antes. Se for diferente, a foto cabe INTEIRA
// e as sobras dos lados são preenchidas com a própria foto desfocada e escurecida (sem tarja
// preta). Sem suporte a `ctx.filter` (Safari antigo), as sobras ficam em preto.
function fotoInteira(
  ctx: CanvasRenderingContext2D,
  foto: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const razaoFoto = foto.width / foto.height
  const razaoJanela = w / h
  const mesmaProporcao = Math.abs(razaoFoto / razaoJanela - 1) < 0.03
  ctx.save()
  caminho(ctx, x, y, w, h, 3)
  ctx.clip()
  if (mesmaProporcao) {
    const escala = Math.max(w / foto.width, h / foto.height)
    const fw = foto.width * escala
    const fh = foto.height * escala
    ctx.drawImage(foto, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh)
  } else {
    // Fundo: a mesma foto preenchendo a janela (um pouco maior, para o desfoque não
    // deixar borda transparente), desfocada e escurecida.
    ctx.fillStyle = COR.preto
    ctx.fillRect(x, y, w, h)
    if (typeof ctx.filter === 'string') {
      const esc = Math.max(w / foto.width, h / foto.height) * 1.15
      ctx.filter = 'blur(22px) brightness(0.5)'
      ctx.drawImage(
        foto,
        x + (w - foto.width * esc) / 2,
        y + (h - foto.height * esc) / 2,
        foto.width * esc,
        foto.height * esc,
      )
      ctx.filter = 'none'
    }
    // Frente: a foto inteira, a maior possível dentro da janela.
    const escala = Math.min(w / foto.width, h / foto.height)
    const fw = foto.width * escala
    const fh = foto.height * escala
    ctx.drawImage(foto, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh)
  }
  ctx.restore()
  ctx.strokeStyle = COR.molduraFoto
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
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

// 1 linha no maior tamanho que couber. Se nem no mínimo couber (nome muito longo),
// quebra em 2 linhas equilibradas — nunca corta o texto.
function emLinhas(
  ctx: CanvasRenderingContext2D,
  texto: string,
  peso: number,
  largura: number,
  maximo: number,
  minimo: number,
): { linhas: string[]; tam: number } {
  const tam1 = ajustar(ctx, texto, peso, largura, maximo, minimo)
  if (ctx.measureText(texto).width <= largura) return { linhas: [texto], tam: tam1 }
  const palavras = texto.split(/\s+/)
  if (palavras.length < 2) {
    return { linhas: [texto], tam: ajustar(ctx, texto, peso, largura, minimo, 12) }
  }
  ctx.font = `${peso} 40px ${FAMILIA}`
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
  const tam = Math.min(...linhas.map((l) => ajustar(ctx, l, peso, largura, maximo, 12)))
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
  ctx.lineWidth = Math.max(3, s / 11)
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
        ctx.arc(cx - r * 0.5 + i * r * 0.5, cy + r * 0.05 + j * r * 0.4, s / 20, 0, Math.PI * 2)
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
    ctx.arc(cx, cy + r * 0.1, s / 13, 0, Math.PI * 2)
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
      ctx.arc(cx + px * r, cy + py * r, s / 15, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

// Fundo preto com degradê sutil e textura leve em diagonal, como na referência.
function desenharFundo(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#1B1B1B')
  g.addColorStop(0.5, '#0E0E0E')
  g.addColorStop(1, '#161616')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'
  ctx.lineWidth = 1
  for (let k = -H; k < W; k += 9) {
    ctx.beginPath()
    ctx.moveTo(k, H)
    ctx.lineTo(k + H, 0)
    ctx.stroke()
  }
  ctx.restore()
}

// Desenha o criativo. `fotos[0]` = principal; `fotos[1..3]` = complementares.
// `logo` é a logo ORIGINAL para fundo preto (já recortada), ou null.
// `selo` é o emblema "Cautelar Aprovada" (transparente), ou null (o criativo sai sem ele
// em vez de quebrar se a imagem não carregar).
export function desenharCriativoPadrao(
  canvas: HTMLCanvasElement,
  formato: FormatoPadrao,
  fotos: HTMLImageElement[],
  logo: HTMLCanvasElement | null,
  d: DadosCriativoPadrao,
  selo: HTMLImageElement | null = null,
  // Linha de aviso no rodapé (07/11/2026), SEM data de propósito: a imagem é gerada no
  // cadastro e publicada dias depois. Opcional: sem ela o desenho é idêntico ao de antes.
  aviso = '',
) {
  const { w: W, h: H, seguroTopo, seguroBase } = FORMATOS_PADRAO[formato]
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível desenhar o criativo')

  const quadrado = formato === '1:1'
  const M = quadrado ? 22 : 24
  const GAP = quadrado ? 15 : 16
  const largura = W - 2 * M
  // Área segura (Stories): a foto começa depois da faixa do topo e a pilha termina antes
  // da faixa de baixo. Nos formatos de feed as duas faixas são 0 e nada muda.
  const topo = Math.max(M, seguroTopo)
  const base = H - Math.max(M, seguroBase)

  desenharFundo(ctx, W, H)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'

  // ---- Medidas fixas (do 1:1, medidas na referência) ----
  const complementares = fotos.slice(1, MAX_FOTOS_PADRAO)
  const compH = complementares.length ? (quadrado ? 249 : 270) : 0
  const specsH = quadrado ? 63 : 84
  const precoH = d.precoVenda > 0 ? (quadrado ? 81 : 104) : 0
  const zonaTitulo = quadrado ? 95 : 150
  const avisoH = aviso ? (quadrado ? 38 : 46) : 0
  const fixo =
    GAP + zonaTitulo + (precoH ? precoH + GAP : 0) + specsH + (compH ? GAP + compH : 0) + avisoH
  const fotoY = topo
  const fotoH = Math.max(300, base - fotoY - fixo)

  // ---- Foto principal ----
  if (fotos[0]) fotoInteira(ctx, fotos[0], M, fotoY, largura, fotoH)

  // Cabeçalho: polígono preto com corte na diagonal por cima da foto, com a logo
  // (proporções tiradas da referência).
  const polH = Math.round(0.1255 * W)
  // No Stories o cabeçalho acompanha a foto (desce junto); nos demais o deslocamento é 0.
  ctx.save()
  ctx.translate(0, fotoY - M)
  ctx.fillStyle = COR.preto
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0.415 * W, 0)
  ctx.lineTo(0.335 * W, polH)
  ctx.lineTo(0, polH)
  ctx.closePath()
  ctx.fill()
  if (logo && logo.width) {
    const lw = Math.round(0.28 * W)
    const lh = (lw * logo.height) / logo.width
    // A logo original é bem maior (2172 px) que o tamanho final: reduz com a melhor
    // qualidade do navegador para as bordas ficarem nítidas e fiéis ao arquivo.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(logo, Math.round(0.022 * W), (polH - lh) / 2, lw, lh)
  }
  ctx.restore()

  // Selo "Cautelar Aprovada": canto superior direito da foto principal, pequeno (13% da
  // largura) e com sombra leve para destacar sem gritar. O canto esquerdo já é da logo.
  if (selo && selo.width) {
    const lado = Math.round(0.13 * W)
    const folga = Math.round(0.014 * W)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 3
    ctx.drawImage(selo, W - M - lado - folga, fotoY + folga, lado, lado)
    ctx.restore()
  }

  let y = fotoY + fotoH + GAP

  // ---- Título ----
  ctx.fillStyle = COR.branco
  if (quadrado) {
    // 1 linha, como na referência: marca + modelo + versão (+ complemento opcional).
    const texto = [d.marca, d.modelo, d.versao, d.complementoTitulo]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(' ')
    const { linhas, tam } = emLinhas(ctx, texto, 600, largura - 16, 42, 22)
    const altura = linhas.length * tam + (linhas.length - 1) * 4
    let ty = y + (zonaTitulo - altura) / 2
    ctx.font = `600 ${tam}px ${FAMILIA}`
    for (const l of linhas) {
      ty += tam
      ctx.fillText(l, W / 2, ty - tam * 0.14)
      ty += 4
    }
  } else {
    // 3 níveis: Marca+Modelo (maior), versão, motor/potência/combustível.
    const linha1 = `${d.marca} ${d.modelo}`.trim().toUpperCase()
    const linha2 = d.versao.trim()
    const linha3 = d.linhaMotor.trim()
    const { linhas: linhas1, tam: t1 } = emLinhas(ctx, linha1, 800, largura, 56, 24)
    const t2 = linha2 ? ajustar(ctx, linha2, 600, largura, 34, 20) : 0
    const t3 = linha3 ? ajustar(ctx, linha3, 600, largura, 28, 18) : 0
    const altura =
      linhas1.length * t1 + (linhas1.length - 1) * 6 + (t2 ? t2 + 12 : 0) + (t3 ? t3 + 10 : 0)
    let ty = y + Math.max(0, (zonaTitulo - altura) / 2)
    ctx.fillStyle = COR.branco
    ctx.font = `800 ${t1}px ${FAMILIA}`
    linhas1.forEach((l, i) => {
      ty += (i ? 6 : 0) + t1
      ctx.fillText(l, W / 2, ty - t1 * 0.12)
    })
    if (t2) {
      ty += 12 + t2
      ctx.fillStyle = '#E6E6E6'
      ctx.font = `600 ${t2}px ${FAMILIA}`
      ctx.fillText(linha2, W / 2, ty - t2 * 0.12)
    }
    if (t3) {
      ty += 10 + t3
      ctx.fillStyle = COR.cinzaTexto
      ctx.font = `600 ${t3}px ${FAMILIA}`
      ctx.fillText(linha3, W / 2, ty - t3 * 0.12)
    }
  }
  y += zonaTitulo

  // ---- Preço: caixa preta com contorno vermelho + etiqueta lateral (condição) ----
  if (precoH) {
    const etiqueta = d.condicao.trim()
    const caixaW = quadrado ? 775 : 820
    const cx0 = (W - caixaW) / 2
    const etqW = etiqueta ? Math.round(caixaW * 0.2) : 0
    ctx.fillStyle = '#060606'
    ctx.fillRect(cx0, y, caixaW, precoH)
    ctx.strokeStyle = COR.vermelho
    ctx.lineWidth = 3
    ctx.strokeRect(cx0 + 1.5, y + 1.5, caixaW - 3, precoH - 3)
    const preco = formatarPreco(d.precoVenda)
    ctx.textBaseline = 'middle'
    const tp = ajustar(ctx, preco, 800, caixaW - etqW - 40, quadrado ? 62 : 70, 30)
    ctx.fillStyle = COR.branco
    ctx.font = `800 ${tp}px ${FAMILIA}`
    ctx.fillText(preco, cx0 + (caixaW - etqW) / 2, y + precoH / 2 + 2)
    if (etiqueta) {
      ctx.fillStyle = COR.vermelho
      ctx.fillRect(cx0 + caixaW - etqW, y + 1.5, etqW - 1.5, precoH - 3)
      const te = ajustar(ctx, etiqueta, 500, etqW - 24, quadrado ? 28 : 32, 16)
      ctx.fillStyle = COR.branco
      ctx.font = `500 ${te}px ${FAMILIA}`
      ctx.fillText(etiqueta, cx0 + caixaW - etqW / 2, y + precoH / 2 + 2)
    }
    ctx.textBaseline = 'alphabetic'
    y += precoH + GAP
  }

  // ---- 3 cards de especificações (só os que têm dado; nada é inventado) ----
  // 06/11/2026 (pedido da Adriana): só o ANO DO MODELO ("2025", não "2024/2025"); sem ano do
  // modelo cai no de fabricação.
  const anos = d.anoModelo || d.anoFabricacao
  const cards: { icone: Icone; texto: string }[] = [
    { icone: 'ano' as Icone, texto: anos },
    { icone: 'km' as Icone, texto: d.km },
    { icone: 'cambio' as Icone, texto: d.cambio },
  ].filter((c) => c.texto)
  if (cards.length) {
    const gapC = 12
    const cw = (largura - gapC * (cards.length - 1)) / cards.length
    const icone = Math.round(specsH * 0.56)
    cards.forEach((c, i) => {
      const x0 = M + i * (cw + gapC)
      ctx.fillStyle = '#121212'
      ctx.fillRect(x0, y, cw, specsH)
      ctx.strokeStyle = COR.bordaCard
      ctx.lineWidth = 2
      ctx.strokeRect(x0 + 1, y + 1, cw - 2, specsH - 2)
      desenharIcone(ctx, c.icone, x0 + 18 + icone / 2, y + specsH / 2, icone)
      const areaTexto = cw - 18 - icone - 14 - 14
      const ts = ajustar(ctx, c.texto, 700, areaTexto, quadrado ? 30 : 34, 16)
      ctx.fillStyle = COR.branco
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${ts}px ${FAMILIA}`
      ctx.fillText(c.texto, x0 + 18 + icone + 14 + areaTexto / 2, y + specsH / 2 + 2)
      ctx.textBaseline = 'alphabetic'
    })
  }
  y += specsH

  // ---- Fotos complementares (até 3) ----
  if (compH) {
    y += GAP
    const gapF = quadrado ? 10 : 12
    const fw = (largura - gapF * (complementares.length - 1)) / complementares.length
    complementares.forEach((img, i) => fotoInteira(ctx, img, M + i * (fw + gapF), y, fw, compH))
  }

  // ---- Aviso ao cliente (rodapé, dentro da área segura) ----
  if (aviso) {
    const yAviso = y + compH
    const ta = ajustar(ctx, aviso, 500, largura - 40, quadrado ? 20 : 22, 12)
    ctx.fillStyle = COR.cinzaTexto
    ctx.textBaseline = 'middle'
    ctx.font = `500 ${ta}px ${FAMILIA}`
    ctx.fillText(aviso, W / 2, yAviso + avisoH * 0.6)
    ctx.textBaseline = 'alphabetic'
  }
}

// Texto do aviso no rodapé do criativo (decisão da Adriana, 07/11/2026). Sem data.
export const AVISO_RODAPE_CRIATIVO =
  'Valores e disponibilidade sujeitos a alteração sem aviso prévio'
