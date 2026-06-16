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
    const filename = url.searchParams.get('file') || 'feed.csv'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: veiculos, error } = await supabase
 .from('veiculos')
 .select('id, marca, modelo, versao, preco_venda, descricao, fotos, is_zero_km, status, ano_modelo, quilometragem, categoria, cor, cambio, combustivel')
 .eq('status', 'disponivel')

    if (error) throw error

    // HEADERS VÁLIDOS PELA META - REMOVI street_address
    const headers = [
      'vehicle_id',
      'title',
      'description',
      'make',
      'model',
      'year',
      'mileage.value',
      'mileage.unit',
      'price',
      'url',
      'image', // Trocamos image[0].url por image
      'address', // Agora com endereço completo dentro
      'state_of_vehicle',
      'body_style',
      'exterior_color',
      'transmission',
      'fuel_type',
      'availability' // Adicionei porque a Meta recomenda
    ]

    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return ''
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Endereço completo em JSON dentro de 'address'
    const addressJson = JSON.stringify({
      addr1: "Av. Leopoldino de Oliveira, 4000",
      city: "Uberaba",
      region: "MG",
      country: "BR",
      postal_code: "38015-000"
    })

    const bodyStyleMap: Record<string, string> = {
      'Hatch': 'hatchback', 'Hatchback': 'hatchback',
      'Sedan': 'sedan', 'Sedã': 'sedan',
      'SUV': 'suv',
      'Picape': 'truck', 'Caminhonete': 'truck',
      'Cupê': 'coupe', 'Coupe': 'coupe',
      'Conversível': 'convertible', 'Conversivel': 'convertible',
      'Minivan': 'minivan',
      'Perua': 'wagon', 'SW': 'wagon',
      'Van': 'van',
      'Utilitário': 'other'
    }

    const transmissionMap: Record<string, string> = {
      'Automático': 'automatic', 'Automatico': 'automatic',
      'Manual': 'manual',
      'CVT': 'automatic',
      'Automatizado': 'automatic'
    }

    const fuelMap: Record<string, string> = {
      'Gasolina': 'gasoline',
      'Etanol': 'flex', 'Flex': 'flex',
      'Diesel': 'diesel',
      'Elétrico': 'electric', 'Eletrico': 'electric',
      'Híbrido': 'hybrid', 'Hibrido': 'hybrid',
      'GNV': 'other'
    }

    const rows = (veiculos || []).map(v => {
      const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
      const imageLink = (v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0)
  ? v.fotos[0]
        : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp'

      const price = v.preco_venda? `${Number(v.preco_venda).toFixed(2)} BRL` : ''
      const condition = v.is_zero_km? 'new' : 'used'
      const ano = v.ano_modelo || ''
      const kmValor = v.quilometragem || 0
      
      const title = `${v.marca} ${v.modelo} ${v.versao || ''} ${ano}`.trim()
      
      let description = v.descricao? v.descricao.substring(0, 5000) : `${title}. ${kmValor}km. Loja Carro e Cia Motors.`
      description = description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim()

      const rowData = [
        v.id, // vehicle_id
        title, // title
        description, // description
        v.marca, // make
        `${v.modelo} ${v.versao || ''}`.trim(), // model
        ano, // year
        kmValor, // mileage.value
        'km', // mileage.unit
        price, // price
        link, // url
        imageLink, // image
        addressJson, // address - AGORA COM ENDEREÇO COMPLETO
        condition, // state_of_vehicle
        bodyStyleMap[v.categoria] || 'other', // body_style
        v.cor || '', // exterior_color
        transmissionMap[v.cambio] || 'other', // transmission
        fuelMap[v.combustivel] || 'other', // fuel_type
        'available' // availability
      ]

      return rowData.map(escapeCsv).join(',')
    })

    const csvFeed = [headers.join(','),...rows].join('\n')

    return new Response(csvFeed, {
      status: 200,
      headers: {
  ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600'
      },
    })

  } catch (err: any) {
    console.error('Error generating feed:', err)
    const errorCsv = `error\n"Erro: ${err.message}"`
    return new Response(errorCsv, {
      status: 200,
      headers: {
  ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8'
      }
    })
  }
})