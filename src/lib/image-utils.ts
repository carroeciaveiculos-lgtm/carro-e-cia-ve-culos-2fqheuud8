import { supabase } from '@/lib/supabase/client'

/**
 * Retorna a URL pública de uma imagem armazenada no Supabase.
 * Se a URL for um caminho relativo, constrói a URL pública via storage api.
 * Se já for uma URL absoluta, retorna otimizada.
 * Se for vazia, retorna uma imagem de fallback.
 */
export function getImageUrl(
  pathOrUrl: string | null | undefined,
  bucket = 'logos-e-imagens',
): string {
  if (!pathOrUrl) {
    return 'https://img.usecurling.com/p/400/300?q=car'
  }

  // Force migration of legacy bucket references
  if (bucket === 'veiculos-fotos') {
    bucket = 'logos-e-imagens'
  }
  if (typeof pathOrUrl === 'string') {
    pathOrUrl = pathOrUrl.replace('veiculos-fotos', 'logos-e-imagens')
  }

  // Verifica se já é uma URL absoluta
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // Se for URL de renderização do Supabase (image transformation), converte para acesso direto se necessário
    if (pathOrUrl.includes('supabase.co/storage/v1/render/image/public/')) {
      return pathOrUrl
        .replace('/storage/v1/render/image/public/', '/storage/v1/object/public/')
        .split('?')[0]
    }
    return pathOrUrl
  }

  // Se for um caminho relativo, obtem a URL pública do bucket
  const { data } = supabase.storage.from(bucket).getPublicUrl(pathOrUrl)
  return data.publicUrl
}

/**
 * Returns a social-media-compatible image URL.
 * Converts Supabase-hosted WebP images to JPEG via the weserv.nl proxy
 * so WhatsApp and Facebook can render preview cards correctly.
 * Falls back to the site OG image if no URL is provided.
 */
export function getSocialImageUrl(imageUrl?: string | null): string {
  const FALLBACK = 'https://www.carroeciamotors.com.br/og-image.jpeg'
  if (!imageUrl) return FALLBACK
  if (imageUrl.includes('supabase.co')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg`
  }
  return imageUrl
}
