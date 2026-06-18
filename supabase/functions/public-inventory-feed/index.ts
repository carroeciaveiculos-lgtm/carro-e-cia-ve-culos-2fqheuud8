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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Headers com mileage obrigatório
    const headers = [
      'vehicle_id',
      'title',
      'description',
      'make',
      'model',
      'year',
      'mileage', // OBRIGATÓRIO PRA META
      'price',
      'url',
      'image',
      'address',
      'state_of_vehicle',
      'body_style',
      'exterior_color',
      'transmission',
      'fuel_type',
      'availability',
    ]

    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return ''
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const addressJson = JSON.stringify({
      addr1: 'Av. Leopoldino de Oliveira, 4000',
      city: 'Uberaba',
      region: 'MG',
      country: 'BR',
      postal_code: '38015-000',
    })

    const bodyStyleMap: Record<string, string> = {
      Hatch: 'hatchback',
      Hatchback: 'hatchback',
      Sedan: 'sedan',
      Sedã: 'sedan',
      SUV: 'suv',
      Picape: 'truck',
      Caminhonete: 'truck',
      Pickup: 'truck',
      Cupê: 'coupe',
      Coupe: 'coupe',
      Conversível: 'convertible',
      Conversivel: 'convertible',
      Minivan: 'minivan',
      Perua: 'wagon',
      SW: 'wagon',
      'Station Wagon': 'wagon',
      Van: 'van',
      Utilitário: 'other',
      Utilitario: 'other',
    }

    const transmissionMap: Record<string, string> = {
      Automático: 'automatic',
      Automatico: 'automatic',
      Manual: 'manual',
      CVT: 'automatic',
      Automatizado: 'automatic',
      Dualogic: 'automatic',
    }

    const fuelMap: Record<string, string> = {
      Gasolina: 'gasoline',
      Etanol: 'flex',
      Flex: 'flex',
      Álcool: 'flex',
      Alcool: 'flex',
      Diesel: 'diesel',
      Elétrico: 'electric',
      Eletrico: 'electric',
      Híbrido: 'hybrid',
      Hibrido: 'hybrid',
      GNV: 'other',
    }

    const anoAtual = new Date().getFullYear()

    const rows = (veiculos || [])
      .filter((v) => {
        if (
          !v.id ||
          !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            v.id,
          )
        )
          return false
        const rawStatus = (v.status || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        if (rawStatus !== 'disponivel') return false
        const ano = Number(v.ano_modelo)
        const preco = Number(v.preco_venda)
        if (!v.preco_venda || preco < 1000 || !v.ano_modelo || ano < 1950 || ano > anoAtual + 1)
          return false
        if (!v.fotos || !Array.isArray(v.fotos) || v.fotos.length === 0) return false
        return true
      })
      .map((v) => {
        const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
        const imageLink = v.fotos[0]
        const price = `${Number(v.preco_venda).toFixed(2)} BRL`
        const condition = v.is_zero_km ? 'new' : 'used'
        const ano = v.ano_modelo

        // FORÇA 1 KM PRA TODO MUNDO PRA META ACEITAR
        const mileage = '1 km'

        const title = `${v.marca} ${v.modelo} ${v.versao || ''} ${ano}`.replace(/\s+/g, ' ').trim()

        let description = v.descricao
          ? v.descricao.substring(0, 5000)
          : `${title}. Carro e Cia Motors Uberaba.`
        description = description
          .replace(/<[^>]*>?/gm, '')
          .replace(/[\n\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        const rowData = [
          v.id, // vehicle_id
          title, // title
          description, // description
          v.marca, // make
          `${v.modelo} ${v.versao || ''}`.trim(), // model
          ano, // year
          mileage, // mileage = "1 km" fixo
          price, // price
          link, // url
          imageLink, // image
          addressJson, // address
          condition, // state_of_vehicle
          bodyStyleMap[v.categoria] || 'other', // body_style
          v.cor || '', // exterior_color
          transmissionMap[v.cambio] || 'other', // transmission
          fuelMap[v.combustivel] || 'other', // fuel_type
          'available', // availability
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
        'Cache-Control': 'public, max-age=1800',
      },
    })
  } catch (err: any) {
    console.error('Error generating feed:', err)
    const errorCsv = `vehicle_id,title\n"error","Erro: ${err.message}"`
    return new Response(errorCsv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  }
})
