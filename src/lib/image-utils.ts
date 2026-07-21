const R2_BASE_URL = 'https://imagens.carroeciamotors.com.br'
const SUPABASE_STORAGE_BASE = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/'
const SUPABASE_RENDER_BASE =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/'

const KNOWN_BUCKETS = ['media', 'veiculos-fotos', 'logos-e-imagens', 'site-assets']

export const R2_PLACEHOLDER_URL = `${R2_BASE_URL}/logos-e-imagens/placeholder/sem-foto.jpg`
export const LOCAL_FALLBACK_IMAGE = '/placeholder.svg'

export function getImageUrl(pathOrUrl: string | null | undefined, bucket = 'media'): string {
  // [TEMPORARY DIAGNOSTIC LOG - Remove after validation phase]
  const original = pathOrUrl

  if (!pathOrUrl) {
    console.log('[IMAGE DIAGNOSTIC] Empty/null path, using placeholder', { original })
    return R2_PLACEHOLDER_URL
  }

  let result = pathOrUrl

  if (result.startsWith(R2_BASE_URL)) {
    console.log('[IMAGE DIAGNOSTIC] Already R2 URL', { original, processed: result })
    return result
  }

  if (result.startsWith(SUPABASE_STORAGE_BASE)) {
    result = result.replace(SUPABASE_STORAGE_BASE, `${R2_BASE_URL}/`).split('?')[0]
    console.log('[IMAGE DIAGNOSTIC] Converted Supabase storage URL', {
      original,
      processed: result,
    })
    return result
  }

  if (result.startsWith(SUPABASE_RENDER_BASE)) {
    result = result.replace(SUPABASE_RENDER_BASE, `${R2_BASE_URL}/`).split('?')[0]
    console.log('[IMAGE DIAGNOSTIC] Converted Supabase render URL', { original, processed: result })
    return result
  }

  if (result.startsWith('http://') || result.startsWith('https://')) {
    console.log('[IMAGE DIAGNOSTIC] External URL', { original, processed: result })
    return result
  }

  const startsWithBucket = KNOWN_BUCKETS.some((b) => result.startsWith(`${b}/`))

  if (startsWithBucket) {
    result = `${R2_BASE_URL}/${result}`
  } else {
    result = `${R2_BASE_URL}/${bucket}/${result}`
  }

  console.log('[IMAGE DIAGNOSTIC] Resolved relative path', { original, processed: result })
  return result
}

export function handleImageError(img: HTMLImageElement, context?: string): void {
  if (img.dataset.fallbackApplied === 'failed') {
    return
  }

  if (img.dataset.fallbackApplied === 'true') {
    console.log('[IMAGE DIAGNOSTIC] R2 placeholder failed, using local SVG', {
      context,
      failedSrc: img.src,
    })
    img.src = LOCAL_FALLBACK_IMAGE
    img.dataset.fallbackApplied = 'failed'
    return
  }

  console.log('[IMAGE DIAGNOSTIC] Image load error, trying R2 placeholder', {
    context,
    originalSrc: img.src,
  })
  img.src = R2_PLACEHOLDER_URL
  img.dataset.fallbackApplied = 'true'
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
