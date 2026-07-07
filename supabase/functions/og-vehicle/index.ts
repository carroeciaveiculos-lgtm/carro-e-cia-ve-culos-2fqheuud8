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

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0)
}

function generateHtml(
  title: string,
  description: string,
  image: string,
  targetUrl: string,
): string {
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
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(targetUrl)}" />
  <meta property="og:site_name" content="Carro e Cia Veículos" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
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
  return generateHtml(
    'Carro e Cia Veículos',
    'Venda seu carro rápido e seguro. Compra, venda e consignação de veículos em Uberaba - MG.',
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
      return new Response(generateDefaultHtml(), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    let query = supabase
      .from('veiculos')
      .select('id,marca,modelo,versao,preco_venda,fotos,slug,status')

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

    const title = `${vehicle.marca} ${vehicle.modelo} - Carro e Cia Veículos`
    const description = `Venda seu carro rápido e seguro. Confira este ${vehicle.modelo} por apenas ${formatCurrency(vehicle.preco_venda)}.`
    const vehicleUrl = `${BASE_URL}/estoque/${vehicle.id}`

    const html = generateHtml(title, description, primaryImage, vehicleUrl)

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
