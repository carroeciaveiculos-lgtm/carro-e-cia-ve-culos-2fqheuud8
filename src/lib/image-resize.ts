// Redução das fotos no envio manual (botão "Fotos" do cadastro, envio em lote, Avaliação).
// 27/11/2026 (decisão da Adriana): SÓ REDUZ, mantendo a proporção original — nunca corta.
// Antes forçava toda foto para 1200x1540 em pé, preenchendo e cortando: uma foto 4:3 deitada perdia
// ~40% da largura (frente e traseira do carro), e o corte ia junto para o site, Webmotors e Mercado Livre.
// O lado maior fica com no máximo MAIOR_LADO px (o site pede no máximo 800 px pelo CDN, a Webmotors
// 1280 px; 1920 sobra para zoom). Foto que já é menor que isso segue como veio.
const MAIOR_LADO = 1920
const QUALIDADE_JPEG = 0.9

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

export async function resizeImage(file: File, maiorLado = MAIOR_LADO): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file

  const img = await loadImage(file)
  const lado = Math.max(img.naturalWidth, img.naturalHeight)
  if (!lado || lado <= maiorLado) return file

  const escala = maiorLado / lado
  const largura = Math.round(img.naturalWidth * escala)
  const altura = Math.round(img.naturalHeight * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  // Fundo branco só para PNG com transparência não virar preto no JPEG; não sobra borda (mesma proporção).
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, largura, altura)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, largura, altura)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/jpeg',
      QUALIDADE_JPEG,
    )
  })
}

export async function resizeImages(files: File[], maiorLado = MAIOR_LADO): Promise<Blob[]> {
  return Promise.all(files.map((file) => resizeImage(file, maiorLado).catch(() => file)))
}
