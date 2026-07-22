export interface InvalidImage {
  url: string
  reason: string
  detectedResolution?: string
  required?: string
}

export interface ImageValidationResult {
  valid: boolean
  validUrls: string[]
  invalidUrls: InvalidImage[]
}

const MIN_WIDTH = 800
const MIN_HEIGHT = 800
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]
    return { width, height }
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i < bytes.length - 8) {
      if (bytes[i] !== 0xff) {
        i++
        continue
      }
      const marker = bytes[i + 1]
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6]
        const width = (bytes[i + 7] << 8) | bytes[i + 8]
        return { width, height }
      }
      const length = (bytes[i + 2] << 8) | bytes[i + 3]
      i += 2 + length
    }
  }

  throw new Error('Unsupported image format')
}

export async function validateImagesForML(photos: string[]): Promise<ImageValidationResult> {
  const validUrls: string[] = []
  const invalidUrls: InvalidImage[] = []

  for (const url of photos) {
    if (!url.startsWith('https://')) {
      invalidUrls.push({ url, reason: 'URL não é HTTPS', required: 'HTTPS' })
      continue
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) {
        invalidUrls.push({ url, reason: `HTTP ${res.status}`, required: 'HTTP 200' })
        continue
      }

      const contentType = res.headers.get('content-type') || ''
      if (!ALLOWED_TYPES.some((t) => contentType.includes(t))) {
        invalidUrls.push({
          url,
          reason: `Formato inválido: ${contentType}`,
          required: 'image/jpeg ou image/png',
        })
        continue
      }

      const blob = await res.blob()
      if (blob.size > MAX_FILE_SIZE) {
        invalidUrls.push({
          url,
          reason: `Arquivo muito grande: ${Math.round(blob.size / 1024 / 1024)}MB`,
          required: 'máx 10MB',
        })
        continue
      }

      const dims = await getImageDimensions(blob)
      if (dims.width < MIN_WIDTH || dims.height < MIN_HEIGHT) {
        invalidUrls.push({
          url,
          reason: `Resolução muito baixa: ${dims.width}x${dims.height}`,
          detectedResolution: `${dims.width}x${dims.height}`,
          required: `${MIN_WIDTH}x${MIN_HEIGHT}`,
        })
        continue
      }

      validUrls.push(url)
    } catch (err: any) {
      invalidUrls.push({ url, reason: `Erro: ${err.message}` })
    }
  }

  return {
    valid: validUrls.length > 0,
    validUrls,
    invalidUrls,
  }
}
