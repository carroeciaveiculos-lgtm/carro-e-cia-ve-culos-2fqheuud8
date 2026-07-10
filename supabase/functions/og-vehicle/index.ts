import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://www.carroeciamotors.com.br'
const DEFAULT_OG_IMAGE = 'https://www.carroeciamotors.com.br/og-image.jpeg'
const FACADE_IMAGE =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.png'

const BOT_PATTERNS = [
  'whatsapp',
  'facebook',
  'facebot',
  'facebookexternalhit',
  'linkedin',
  'linkedinbot',
  'twitter',
  'twitterbot',
  'telegram',
  'telegrambot',
  'slack',
  'slackbot',
  'discord',
  'discordbot',
  'googlebot',
  'bingbot',
  'snapchat',
  'pinterest',
  'applebot',
  'skypeuripreview',
  'vkshare',
  'w3c_validator',
  'crawler',
  'bot',
  'spider',
  'scraper',
  'preview',
  'fetch',
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isSocialBot(ua: string | null): boolean {
  if (!ua) return false
  const lower = ua.toLowerCase()
  return BOT_PATTERNS.some((p) => lower.includes(p))
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeText(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/\uFEFF/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‚/g, 'Â')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function formatCurrency(val: any): string {
  if (val === null || val === undefined) return 'Sob consulta'
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0
  if (num === 0) return 'Sob consulta'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

function getSocialImageUrl(imageUrl: string): string {
  if (!imageUrl) return DEFAULT_OG_IMAGE
  if (imageUrl.includes('supabase.co')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl.split('?')[0])}&output=jpg`
  }
  return imageUrl
}

function generateFallbackDescription(vehicle: any): string {
  const name = `${vehicle.marca} ${vehicle.modelo}`
  const ano = vehicle.ano_fabricacao || vehicle.ano_modelo || ''
  const km = vehicle.quilometragem
    ? `${Number(vehicle.quilometragem).toLocaleString('pt-BR')} km`
    : ''
  const combustivel = vehicle.combustivel || ''
  const parts = [ano, km, combustivel].filter(Boolean)
  return `Excelente ${name}${parts.length > 0 ? ` - ${parts.join(', ')}` : ''}. Veículo em ótimo estado de conservação. Financiamos e aceitamos troca. Entre em contato para mais detalhes.`
}

function generateOGDescription(vehicle: any): string {
  const parts: string[] = []
  if (vehicle.preco_venda) parts.push(formatCurrency(vehicle.preco_venda))
  if (vehicle.quilometragem != null && vehicle.quilometragem > 0) {
    parts.push(`${Number(vehicle.quilometragem).toLocaleString('pt-BR')} km`)
  }
  if (vehicle.cor) parts.push(vehicle.cor)
  if (vehicle.combustivel) parts.push(vehicle.combustivel)

  if (parts.length === 0) {
    return sanitizeText(generateFallbackDescription(vehicle))
  }
  return sanitizeText(parts.join(' - '))
}

function generatePageDescription(vehicle: any): string {
  if (vehicle.descricao && vehicle.descricao.trim()) {
    return sanitizeText(vehicle.descricao.trim()).substring(0, 160)
  }
  const name = `${vehicle.marca} ${vehicle.modelo}`
  const ano = vehicle.ano_modelo || vehicle.ano_fabricacao || ''
  const price = formatCurrency(vehicle.preco_venda)
  return sanitizeText(
    `Confira as fotos e detalhes deste ${name} ${ano} no valor de ${price}. Financiamos e aceitamos troca. Entre em contato!`,
  )
}

function generateOGHtml(
  pageTitle: string,
  pageDescription: string,
  ogTitle: string,
  ogDescription: string,
  image: string,
  ogUrl: string,
  canonicalUrl: string,
): string {
  const socialImage = getSocialImageUrl(image)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:image" content="${escapeHtml(socialImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:site_name" content="Carro e Cia Motors" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(pageTitle)}</a>...</p>
  <script>window.location.href="${escapeHtml(canonicalUrl)}";</script>
</body>
</html>`
}

function generateDefaultHtml(): string {
  return generateOGHtml(
    'Carro e Cia Motors | Compra e Venda de Ve\u00edculos em Uberaba - MG',
    'Venda ou Compre seu carro r\u00e1pido e seguro. Compra, venda e troca de ve\u00edculos em Uberaba - MG.',
    'Carro e Cia Motors - Uberaba MG',
    'Venda ou Compre seu carro r\u00e1pido e seguro. Ve\u00edculos seminovos selecionados em Uberaba - MG.',
    FACADE_IMAGE,
    BASE_URL,
    BASE_URL,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const userAgent = req.headers.get('user-agent')
    const forwardedHost = req.headers.get('x-forwarded-host') || ''
    const isProxied =
      forwardedHost.includes('carroeciamotors') || url.hostname.includes('carroeciamotors')

    const idParam = url.searchParams.get('id')
    const slugParam = url.searchParams.get('slug')
    const pathParts = url.pathname.split('/').filter(Boolean)
    let vehicleId: string | null = null
    let vehicleSlug: string | null = null

    if (idParam) {
      if (UUID_REGEX.test(idParam)) vehicleId = idParam
      else vehicleSlug = idParam
    }

    if (!vehicleId && !vehicleSlug && slugParam) {
      if (UUID_REGEX.test(slugParam)) vehicleId = slugParam
      else vehicleSlug = slugParam
    }

    if (!vehicleId && !vehicleSlug && pathParts.length >= 1) {
      const lastPart = pathParts[pathParts.length - 1]
      if (UUID_REGEX.test(lastPart)) vehicleId = lastPart
      else vehicleSlug = lastPart
    }

    if (!vehicleId && !vehicleSlug) {
      if (isSocialBot(userAgent)) {
        return new Response(generateDefaultHtml(), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      return Response.redirect(`${BASE_URL}/`, 302)
    }

    const requestPath = vehicleId || vehicleSlug
    const frontendUrl = `${BASE_URL}/estoque/${requestPath}`

    if (!isSocialBot(userAgent) && !isProxied) {
      return Response.redirect(frontendUrl, 302)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let query = supabase
      .from('veiculos')
      .select(
        'id,marca,modelo,versao,ano_fabricacao,ano_modelo,preco_venda,quilometragem,cor,combustivel,descricao,fotos,slug,status',
      )

    if (vehicleId) query = query.eq('id', vehicleId)
    else if (vehicleSlug) query = query.eq('slug', vehicleSlug)

    const { data: vehicle, error } = await query.maybeSingle()

    if (error || !vehicle || vehicle.status !== 'disponivel') {
      return new Response(generateDefaultHtml(), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const photos = Array.isArray(vehicle.fotos) ? vehicle.fotos : []
    const primaryImage = photos.length > 0 ? photos[0] : DEFAULT_OG_IMAGE
    const vehicleSlugOrId = vehicle.slug || vehicle.id

    const ogUrl = `${BASE_URL}/estoque/${vehicleSlugOrId}`
    const canonicalUrl = `${BASE_URL}/estoque/${vehicleSlugOrId}`

    const versaoStr = vehicle.versao ? ` ${vehicle.versao}` : ''
    const anoModeloStr = vehicle.ano_modelo ? ` ${vehicle.ano_modelo}` : ''

    const pageTitle = `${vehicle.marca} ${vehicle.modelo}${versaoStr}${anoModeloStr} à venda em Uberaba | Carro e Cia Motors`
    const pageDescription = generatePageDescription(vehicle)
    const ogTitle =
      `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_modelo || vehicle.ano_fabricacao || ''}`.trim()
    const ogDescription = generateOGDescription(vehicle)

    const html = generateOGHtml(
      pageTitle,
      pageDescription,
      ogTitle,
      ogDescription,
      primaryImage,
      ogUrl,
      canonicalUrl,
    )

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err: any) {
    console.error('Error generating OG metadata:', err)
    return new Response(generateDefaultHtml(), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
})
