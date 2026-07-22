const R2_BASE_URL = 'https://imagens.carroeciamotors.com.br'
const SUPABASE_STORAGE_BASE = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/'
const SUPABASE_RENDER_BASE =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/'

const KNOWN_BUCKETS = ['media', 'veiculos-fotos', 'logos-e-imagens', 'site-assets']

export const R2_PLACEHOLDER_URL = `${R2_BASE_URL}/logos-e-imagens/placeholder/sem-foto.jpg`
export const LOCAL_FALLBACK_IMAGE = '/placeholder-car.svg'
export const CAR_PLACEHOLDER_IMAGE = '/placeholder-car.svg'

export function isR2ImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(R2_BASE_URL)
}

function sanitizeUrlSpecialChars(url: string): string {
  if (!url) return url
  try {
    const parsed = new URL(url)
    parsed.pathname = parsed.pathname
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\s/g, '%20')
    return parsed.toString()
  } catch {
    return url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20')
  }
}

export function getImageUrl(pathOrUrl: string | null | undefined, bucket = 'media'): string {
  if (!pathOrUrl) return CAR_PLACEHOLDER_IMAGE

  let result = pathOrUrl

  if (result.startsWith(R2_BASE_URL)) return sanitizeUrlSpecialChars(result)

  if (result.startsWith(SUPABASE_STORAGE_BASE)) {
    result = result.replace(SUPABASE_STORAGE_BASE, `${R2_BASE_URL}/`).split('?')[0]
    return result
  }

  if (result.startsWith(SUPABASE_RENDER_BASE)) {
    result = result.replace(SUPABASE_RENDER_BASE, `${R2_BASE_URL}/`).split('?')[0]
    return result
  }

  if (result.startsWith('http://') || result.startsWith('https://'))
    return sanitizeUrlSpecialChars(result)

  const startsWithBucket = KNOWN_BUCKETS.some((b) => result.startsWith(`${b}/`))

  if (startsWithBucket) {
    result = `${R2_BASE_URL}/${result}`
  } else {
    result = `${R2_BASE_URL}/${bucket}/${result}`
  }

  return sanitizeUrlSpecialChars(result)
}

export function handleImageError(img: HTMLImageElement, context?: string): void {
  if (img.dataset.fallbackApplied === 'true') return
  img.removeAttribute('crossorigin')
  img.onerror = null
  img.src = CAR_PLACEHOLDER_IMAGE
  img.dataset.fallbackApplied = 'true'
}

export function getVehiclePhotos(fotos: any): string[] {
  if (!fotos || !Array.isArray(fotos)) return []
  return fotos
    .filter((url: any) => {
      if (typeof url !== 'string') return false
      return !url.match(/\.(mp4|mov|webm|avi|mkv)$/i)
    })
    .map((url: string) => sanitizeUrlSpecialChars(url))
}

export function getVehicleVideos(videos: any, fotos?: any): string[] {
  const result: string[] = []
  if (videos && Array.isArray(videos)) {
    result.push(
      ...videos
        .filter((v: any) => typeof v === 'string')
        .map((v: string) => sanitizeUrlSpecialChars(v)),
    )
  }
  if (fotos && Array.isArray(fotos)) {
    result.push(
      ...fotos
        .filter((url: any) => typeof url === 'string' && url.match(/\.(mp4|mov|webm|avi|mkv)$/i))
        .map((url: string) => sanitizeUrlSpecialChars(url)),
    )
  }
  return [...new Set(result)]
}

export function getSocialImageUrl(imageUrl?: string | null): string {
  const FALLBACK = 'https://www.carroeciamotors.com.br/og-image.jpeg'
  if (!imageUrl) return FALLBACK

  const resolved = getImageUrl(imageUrl)

  if (resolved.includes('imagens.carroeciamotors.com.br') || resolved.includes('supabase.co')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(resolved)}&output=jpg`
  }

  return resolved
}
