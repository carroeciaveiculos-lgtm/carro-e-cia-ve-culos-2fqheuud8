import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const baseUrl = 'https://www.carroeciamotors.com.br'

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('id, updated_at, created_at')
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const now = new Date().toISOString()

    const staticUrls = [
      { loc: `${baseUrl}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/estoque`, lastmod: now, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/consignacao`, lastmod: now, changefreq: 'weekly', priority: '0.9' },
      {
        loc: `${baseUrl}/consignar-meu-carro`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.9',
      },
      {
        loc: `${baseUrl}/financiamento-auto`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.8',
      },
      { loc: `${baseUrl}/seguro-auto`, lastmod: now, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/consorcio-auto`, lastmod: now, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/blog`, lastmod: now, changefreq: 'daily', priority: '0.8' },
      { loc: `${baseUrl}/sobre`, lastmod: now, changefreq: 'monthly', priority: '0.5' },
      { loc: `${baseUrl}/contato`, lastmod: now, changefreq: 'monthly', priority: '0.5' },
    ]

    const vehicleUrls = (veiculos || []).map((v) => ({
      loc: `${baseUrl}/estoque/${v.id}`,
      lastmod: v.updated_at || v.created_at || now,
      changefreq: 'weekly',
      priority: '0.8',
    }))

    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)

    const blogUrls = (blogPosts || []).map((p) => ({
      loc: `${baseUrl}/blog/${p.slug}`,
      lastmod: p.updated_at || now,
      changefreq: 'weekly',
      priority: '0.6',
    }))

    const allUrls = [...staticUrls, ...vehicleUrls, ...blogUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err: any) {
    console.error('Error generating sitemap:', err)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      },
    )
  }
})
