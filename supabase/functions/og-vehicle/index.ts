import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://www.carroeciamotors.com.br'
const DEFAULT_OG_IMAGE =
  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp'
const SLOGAN = 'Venda ou Compre seu carro rápido e seguro'

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

function isSocialBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BOT_PATTERNS.some((p) => ua.includes(p))
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function getOptimizedImageUrl(imageUrl: string): string {
  if (!imageUrl) return DEFAULT_OG_IMAGE
  if (imageUrl.includes('supabase.co/storage/v1/object/public/')) {
    return (
      imageUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') +
      '?width=1200&height=630&resize=contain&quality=85'
    )
  }
  return imageUrl
}

function generateOGHtml(
  title: string,
  description: string,
  image: string,
  targetUrl: string,
): string {
  const optimizedImage = getOptimizedImageUrl(image)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(optimizedImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(targetUrl)}" />
  <meta property="og:site_name" content="Carro e Cia Veículos" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(optimizedImage)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
  <link rel="canonical" href="${escapeHtml(targetUrl)}" />
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(targetUrl)}">${escapeHtml(title)}</a>...</p>
  <script>window.location.href="${escapeHtml(targetUrl)}";</script>
</body>
</html>`
}

function generateDefaultHtml(): string {
  return generateOGHtml(
    'Carro e Cia Veículos',
    `${SLOGAN}. Compra e venda de veículos em Uberaba - MG.`,
    DEFAULT_OG_IMAGE,
    BASE_URL,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userAgent = req.headers.get('user-agent')
    const forwardedHost = req.headers.get('x-forwarded-host') || ''
    const isProxied =
      forwardedHost.includes('carroeciamotors') || url.hostname.includes('carroeciamotors')

    const idParam = url.searchParams.get('id')
    const slugParam = url.searchParams.get('slug')
    const pathParts = url.pathname.split('/').filter(Boolean)
    let vehicleId: string | null = idParam
    let vehicleSlug: string | null = slugParam

    if (!vehicleId && !vehicleSlug && pathParts.length >= 1) {
      const lastPart = pathParts[pathParts.length - 1]
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart)) {
        vehicleId = lastPart
      } else {
        vehicleSlug = lastPart
      }
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

    if (!isSocialBot(userAgent)) {
      if (!isProxied) {
        return Response.redirect(frontendUrl, 302)
      }
      try {
        const spaResponse = await fetch(`${BASE_URL}/index.html`)
        const spaHtml = await spaResponse.text()
        return new Response(spaHtml, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      } catch {
        return Response.redirect(frontendUrl, 302)
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    let query = supabase
      .from('veiculos')
      .select(
        'id,marca,modelo,versao,ano_fabricacao,ano_modelo,preco_venda,quilometragem,fotos,slug,status',
      )

    if (vehicleId) {
      query = query.eq('id', vehicleId)
    } else if (vehicleSlug) {
      query = query.eq('slug', vehicleSlug)
    }

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
    const canonicalUrl = `${BASE_URL}/estoque/${vehicleSlugOrId}`

    const title = `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao || ''} - Carro e Cia Veículos`
    const description = `Ano ${vehicle.ano_fabricacao || ''}/${vehicle.ano_modelo || ''} por ${formatCurrency(vehicle.preco_venda)}. ${SLOGAN}.`

    const html = generateOGHtml(title, description, primaryImage, canonicalUrl)

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
