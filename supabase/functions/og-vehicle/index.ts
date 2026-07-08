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
const SLOGAN = 'Venda ou Compre seu carro rápido e seguro.'

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

// CORREÇÃO 1: Formatação numérica segura de preço para evitar exibir "R$ NaN" na tela
function formatCurrency(val: any): string {
  if (val === null || val === undefined) return "Sob consulta"
  const cleanStr = String(val).replace(/[^0-9.-]/g, '')
  const numericVal = parseFloat(cleanStr) || 0
  if (numericVal === 0) return "Sob consulta"
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericVal)
}

// CORREÇÃO 2: Limpa parâmetros de token e codifica de forma perfeita a foto para JPEG
function getSocialImageUrl(imageUrl: string): string {
  if (!imageUrl) return DEFAULT_OG_IMAGE
  if (imageUrl.includes('supabase.co')) {
    const cleanUrl = imageUrl.split('?')[0] // Garante que não haverá dupla codificação de queries
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg`
  }
  return imageUrl
}

function generateOGHtml(
  pageTitle: string,
  pageDescription: string,
  ogTitle: string,
  ogDescription: string,
  image: string,
  targetUrl: string,
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
  <meta property="og:url" content="${escapeHtml(targetUrl)}" />
  <meta property="og:site_name" content="Carro e Cia Motors" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
  <link rel="canonical" href="${escapeHtml(targetUrl)}" />
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(targetUrl)}">${escapeHtml(pageTitle)}</a>...</p>
  <script>window.location.href="${escapeHtml(targetUrl)}";</script>
</body>
</html>`
}

function generateDefaultHtml(): string {
  return generateOGHtml(
    'Carro e Cia Motors | Compra e Venda de Veículos em Uberaba - MG',
    `${SLOGAN} Compra, venda e troca de veículos em Uberaba - MG.`,
    'Carro e Cia Motors - Uberaba MG',
    `${SLOGAN} Veículos seminovos selecionados em Uberaba - MG.`,
    FACADE_IMAGE,
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
    let vehicleId: string | null = null
    let vehicleSlug: string | null = slugParam

    if (idParam) {
      if (UUID_REGEX.test(idParam)) {
        vehicleId = idParam
      } else {
        vehicleSlug = idParam
      }
    }

    if (!vehicleId && !vehicleSlug && pathParts.length >= 1) {
      const lastPart = pathParts[pathParts.length - 1]
      if (UUID_REGEX.test(lastPart)) {
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

    const versaoStr = vehicle.versao ? ` ${vehicle.versao}` : ''
    const anoModeloStr = vehicle.ano_modelo ? ` ${vehicle.ano_modelo}` : ''
    const formattedPrice = formatCurrency(vehicle.preco_venda)

    const pageTitle = `${vehicle.marca} ${vehicle.modelo}${versaoStr}${anoModeloStr} à venda em Uberaba | Carro e Cia Motors`
    const pageDescription = `Confira as fotos e detalhes deste lindo ${vehicle.marca} ${vehicle.modelo} no valor de ${formattedPrice}. Financiamos e aceitamos troca. Entre em contato!`
    const ogTitle = `${vehicle.marca} ${vehicle.modelo} (${vehicle.ano_modelo || vehicle.ano_fabricacao || ''}) - ${formattedPrice}`
    const ogDescription = `Veja a ficha completa e simule as parcelas deste veículo em nosso site comercial Carro e Cia Motors.`

    const html = generateOGHtml(
      pageTitle,
      pageDescription,
      ogTitle,
      ogDescription,
      primaryImage,
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