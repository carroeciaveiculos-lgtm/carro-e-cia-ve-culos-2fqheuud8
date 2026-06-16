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
    const url = new URL(req.url)
    const filename = url.searchParams.get('file') || 'inventory.csv'

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('id, marca, modelo, versao, preco_venda, descricao, fotos, is_zero_km, status')
      .eq('status', 'disponivel')

    if (error) throw error

    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
    ]

    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return '""'
      const str = String(field)
      return `"${str.replace(/"/g, '""')}"`
    }

    const rows = (veiculos || []).map((v) => {
      const title = `${v.marca || ''} ${v.modelo || ''} ${v.versao || ''}`.trim()

      let description = v.descricao
        ? v.descricao.substring(0, 5000)
        : `${title} em excelente estado.`
      // Remove HTML tags if any and replace newlines with spaces for a cleaner CSV
      description = description
        .replace(/<[^>]*>?/gm, '')
        .replace(/\s+/g, ' ')
        .trim()

      const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
      const imageLink =
        v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0
          ? v.fotos[0]
          : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp'

      const price = v.preco_venda ? `${Number(v.preco_venda).toFixed(2)} BRL` : '0.00 BRL'
      const condition = v.is_zero_km ? 'new' : 'used'
      const availability = 'in stock'

      const rowData = [
        v.id,
        title,
        description,
        availability,
        condition,
        price,
        link,
        imageLink,
        v.marca || '',
      ]

      return rowData.map(escapeCsv).join(',')
    })

    const csvFeed = [headers.join(','), ...rows].join('\n')

    return new Response(csvFeed, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err: any) {
    console.error('Error generating feed:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
