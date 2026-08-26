import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://www.carroeciamotors.com.br'
const DEFAULT_OG_IMAGE = 'https://www.carroeciamotors.com.br/og-image.jpeg'

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
  if (imageUrl.includes('imagens.carroeciamotors.com.br') || imageUrl.includes('supabase.co')) {
    const cleanUrl = imageUrl.split('?')[0]
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg`
  }
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return `https://imagens.carroeciamotors.com.br/logos-e-imagens/${imageUrl}`
  }
  return imageUrl
}

function generateOGDescription(vehicle: any): string {
  const parts: string[] = []
  if (vehicle.quilometragem != null && vehicle.quilometragem > 0) {
    parts.push(`${Number(vehicle.quilometragem).toLocaleString('pt-BR')} km`)
  }
  if (vehicle.cor) parts.push(vehicle.cor)
  if (vehicle.combustivel) parts.push(vehicle.combustivel)
  if (vehicle.cambio) parts.push(`Câmbio ${vehicle.cambio}`)

  const desc = parts.join(' - ')
  const price = vehicle.preco_venda ? formatCurrency(vehicle.preco_venda) : 'Sob consulta'

  return sanitizeText(
    `Excelente oportunidade: ${desc}. Valor: ${price}. Financiamos e aceitamos troca. Confira!`,
  )
}

function generateOGHtml(
  pageTitle: string,
  ogTitle: string,
  ogDescription: string,
  image: string,
  ogUrl: string,
  canonicalUrl: string,
  shouldRedirect: boolean,
): string {
  const socialImage = getSocialImageUrl(image)
  const redirectMeta = shouldRedirect
    ? `  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />\n`
    : ''
  const bodyContent = shouldRedirect
    ? `<body>
  <p>Redirecionando para <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(pageTitle)}</a>...</p>
  <script>window.location.replace("${escapeHtml(canonicalUrl)}");</script>
</body>`
    : `<body></body>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDescription)}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:image" content="${escapeHtml(socialImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:site_name" content="Carro e Cia Motors" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
  
${redirectMeta}  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
</head>
${bodyContent}
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const userAgent = req.headers.get('user-agent')
    const isBot = isSocialBot(userAgent)

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
      else if (lastPart !== 'og-vehicle') vehicleSlug = lastPart
    }

    if (!vehicleId && !vehicleSlug) {
      return new Response('Veículo não especificado.', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let query = supabase
      .from('veiculos')
      .select(
        'id,marca,modelo,versao,ano_fabricacao,ano_modelo,preco_venda,quilometragem,cor,combustivel,cambio,fotos,slug,status',
      )

    if (vehicleId) query = query.eq('id', vehicleId)
    else if (vehicleSlug) query = query.eq('slug', vehicleSlug)

    const { data: vehicle, error } = await query.maybeSingle()

    if (error || !vehicle || vehicle.status !== 'disponivel') {
      if (isBot) {
        return new Response('Veículo não encontrado ou indisponível.', {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
        })
      } else {
        const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${escapeHtml(BASE_URL + '/estoque')}" /></head><body></body></html>`
        return new Response(html, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    }

    const photos = Array.isArray(vehicle.fotos)
      ? vehicle.fotos.filter((p: any) => typeof p === 'string' && p.length > 0)
      : []
    const rawImage = photos.length > 0 ? photos[0] : ''
    const primaryImage = rawImage.startsWith('http')
      ? rawImage
      : rawImage
        ? `https://imagens.carroeciamotors.com.br/logos-e-imagens/${rawImage}`
        : DEFAULT_OG_IMAGE
    const vehicleSlugOrId = vehicle.slug || vehicle.id

    const ogUrl = `${BASE_URL}/s/${vehicleSlugOrId}`
    const canonicalUrl = `${BASE_URL}/estoque/${vehicleSlugOrId}`

    // Versão removida da prévia de compartilhamento (pedido da Adriana,
    // 26/08/2026) — repetia texto já presente em Modelo, ficava duplicado e
    // confuso. Versão continua alimentando integrações que exigem o campo
    // (Mercado Livre, Webmotors, NaPista) — só não aparece mais aqui.
    const anoModeloStr = vehicle.ano_modelo || vehicle.ano_fabricacao || ''

    const pageTitle = `${vehicle.marca} ${vehicle.modelo} ${anoModeloStr} à venda em Uberaba | Carro e Cia Motors`

    const ogTitle = `${vehicle.marca} ${vehicle.modelo} ${anoModeloStr}`
      .trim()
      .replace(/\s+/g, ' ')
    const ogDescription = generateOGDescription(vehicle)

    const html = generateOGHtml(
      pageTitle,
      ogTitle,
      ogDescription,
      primaryImage,
      ogUrl,
      canonicalUrl,
      !isBot,
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
    return new Response('Erro interno.', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
})
