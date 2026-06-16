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

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cor, placa, chassi, renavam, descricao, fotos, categoria, diferenciais, caracteristicas, is_consignado, is_zero_km, cambio',
      )
      .eq('status', 'disponivel')

    if (error) throw error

    const headers = [
      'vehicle_id',
      'id',
      'title',
      'description',
      'image_link',
      'link',
      'make',
      'model',
      'year',
      'price',
      'mileage.value',
      'mileage.unit',
      'transmission',
      'fuel_type',
      'body_style',
      'condition',
    ]

    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return '""'
      const str = String(field)
      return `"${str.replace(/"/g, '""')}"`
    }

    const rows = veiculos.map((v) => {
      const title = `${v.marca || ''} ${v.modelo || ''} ${v.versao || ''}`.trim()
      const description = v.descricao
        ? v.descricao.substring(0, 5000)
        : `${title} em excelente estado.`
      const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
      const imageLink =
        v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0
          ? v.fotos[0]
          : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp'
      const price = v.preco_venda ? `${Number(v.preco_venda).toFixed(2)} BRL` : '0.00 BRL'
      const condition = v.is_zero_km ? 'new' : 'used'

      const rowData = [
        v.id,
        v.id,
        title,
        description,
        imageLink,
        link,
        v.marca || '',
        v.modelo || '',
        v.ano_modelo || v.ano_fabricacao || '',
        price,
        v.quilometragem || 0,
        'KM',
        v.cambio || '',
        v.combustivel || '',
        v.categoria || '',
        condition,
      ]

      return rowData.map(escapeCsv).join(',')
    })

    const csvFeed = [headers.join(','), ...rows].join('\n')

    return new Response(csvFeed, {
      headers: { ...corsHeaders, 'Content-Type': 'text/csv; charset=utf-8' },
    })
  } catch (err: any) {
    const emptyHeaders = [
      'vehicle_id',
      'id',
      'title',
      'description',
      'image_link',
      'link',
      'make',
      'model',
      'year',
      'price',
      'mileage.value',
      'mileage.unit',
      'transmission',
      'fuel_type',
      'body_style',
      'condition',
    ].join(',')

    return new Response(emptyHeaders, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/csv; charset=utf-8' },
    })
  }
})
