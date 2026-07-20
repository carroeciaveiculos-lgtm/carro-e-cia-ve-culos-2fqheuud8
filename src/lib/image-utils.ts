const R2_BASE_URL = 'https://imagens.carroeciamotors.com.br'
const SUPABASE_STORAGE_BASE = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/'
const SUPABASE_RENDER_BASE =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/'

export function getImageUrl(
  pathOrUrl: string | null | undefined,
  bucket = 'logos-e-imagens',
): string {
  if (!pathOrUrl) {
    return 'https://img.usecurling.com/p/400/300?q=car'
  }

  let resolvedBucket = bucket
  if (resolvedBucket === 'veiculos-fotos') {
    resolvedBucket = 'logos-e-imagens'
  }

  let path = pathOrUrl
  if (typeof path === 'string') {
    path = path.replace('veiculos-fotos', 'logos-e-imagens')
  }

  if (path.startsWith(R2_BASE_URL)) {
    return path
  }

  if (path.startsWith(SUPABASE_STORAGE_BASE)) {
    return path.replace(SUPABASE_STORAGE_BASE, `${R2_BASE_URL}/`)
  }

  if (path.startsWith(SUPABASE_RENDER_BASE)) {
    return path.replace(SUPABASE_RENDER_BASE, `${R2_BASE_URL}/`).split('?')[0]
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${R2_BASE_URL}/${resolvedBucket}/${path}`
}

export function getSocialImageUrl(imageUrl?: string | null): string {
  const FALLBACK = 'https://www.carroeciamotors.com.br/og-image.jpeg'
  if (!imageUrl) return FALLBACK
  if (imageUrl.includes('supabase.co') || imageUrl.includes('imagens.carroeciamotors.com.br')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg`
  }
  return imageUrl
}
