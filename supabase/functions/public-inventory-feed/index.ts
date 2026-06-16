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
    const apikey = url.searchParams.get('apikey')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (apikey !== anonKey) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cor, placa, chassi, renavam, descricao, fotos, categoria, diferenciais, caracteristicas, is_consignado, is_zero_km, cambio, status',
      )
      .eq('status', 'disponivel')

    if (error) throw error

    const headers = [
      'id',
      'title',
      'description',
      'link',
      'image_link',
      'brand',
      'model',
      'year',
      'mileage',
      'price',
      'currency',
      'condition',
      'state_of_vehicle',
      'availability',
      'transmission',
      'fuel_type',
      'body_style',
      'address',
    ]

    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return '""'
      const str = String(field)
      return `"${str.replace(/"/g, '""')}"`
    }

    const mapTransmission = (cambio: string | null) => {
      if (!cambio) return 'AUTOMATIC'
      const lower = cambio.toLowerCase()
      if (lower.includes('automático') || lower.includes('automatico')) return 'AUTOMATIC'
      if (lower.includes('manual')) return 'MANUAL'
      if (lower.includes('cvt')) return 'AUTOMATIC'
      return 'AUTOMATIC'
    }

    const mapFuelType = (combustivel: string | null) => {
      if (!combustivel) return 'OTHER'
      const lower = combustivel.toLowerCase()
      if (lower.includes('flex')) return 'FLEX'
      if (lower.includes('gasolina')) return 'GASOLINE'
      if (lower.includes('diesel')) return 'DIESEL'
      if (lower.includes('álcool') || lower.includes('alcool')) return 'ETHANOL'
      if (lower.includes('híbrido') || lower.includes('hibrido')) return 'HYBRID'
      if (lower.includes('elétrico') || lower.includes('eletrico')) return 'ELECTRIC'
      return 'OTHER'
    }

    const mapBodyStyle = (categoria: string | null) => {
      if (!categoria) return 'OTHER'
      const lower = categoria.toLowerCase()
      if (lower.includes('sedã') || lower.includes('seda')) return 'SEDAN'
      if (lower.includes('suv')) return 'SUV'
      if (lower.includes('hatch')) return 'HATCHBACK'
      if (lower.includes('pick-up') || lower.includes('pickup') || lower.includes('caminhonete'))
        return 'TRUCK'
      if (lower.includes('conversível') || lower.includes('conversivel')) return 'CONVERTIBLE'
      if (lower.includes('van')) return 'VAN'
      return 'OTHER'
    }

    const FIXED_ADDRESS =
      'Av. Guilherme Ferreira, 1400 - São Benedito, Uberaba - MG, 38022-200, Brasil'

    const rows = (veiculos || []).map((v) => {
      const title = `${v.marca || ''} ${v.modelo || ''} ${v.versao || ''}`.trim()
      const description = v.descricao
        ? v.descricao.substring(0, 5000)
        : `${title} em excelente estado.`
      const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
      const imageLink =
        v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0
          ? v.fotos[0]
          : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp'
      const price = v.preco_venda ? Number(v.preco_venda).toFixed(2) : '0.00'
      const currency = 'BRL'
      const condition = v.is_zero_km ? 'NEW' : 'USED'
      const availability = 'IN_STOCK'

      const transmission = mapTransmission(v.cambio)
      const fuelType = mapFuelType(v.combustivel)
      const bodyStyle = mapBodyStyle(v.categoria)
      const mileage = v.quilometragem ? `${v.quilometragem} km` : '0 km'

      const rowData = [
        v.id,
        title,
        description,
        link,
        imageLink,
        v.marca || '',
        v.modelo || '',
        v.ano_modelo || v.ano_fabricacao || '',
        mileage,
        price,
        currency,
        condition,
        condition, // state_of_vehicle
        availability,
        transmission,
        fuelType,
        bodyStyle,
        FIXED_ADDRESS,
      ]

      return rowData.map(escapeCsv).join(',')
    })

    const csvFeed = [headers.join(','), ...rows].join('\n')

    const encoder = new TextEncoder()
    const fileData = encoder.encode(csvFeed)

    const { error: uploadError } = await supabase.storage
      .from('feeds')
      .upload('inventory.csv', fileData, {
        contentType: 'text/csv; charset=utf-8',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const publicUrl = supabase.storage.from('feeds').getPublicUrl('inventory.csv').data.publicUrl

    return new Response(
      JSON.stringify({
        success: true,
        last_update: new Date().toISOString(),
        url: publicUrl,
        items_count: rows.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('Error generating feed:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
