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
      .select(
        'id, marca, modelo, versao, preco_venda, descricao, fotos, is_zero_km, status, ano_modelo, quilometragem, categoria, cor, cambio, combustivel',
      )
      .ilike('status', '%dispon%')

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
      'model',
      'year',
      'mileage.value',
      'mileage.unit',
      'address',
      'body_style',
      'exterior_color',
      'transmission',
      'fuel_type',
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
      Cupê: 'coupe',
      Coupe: 'coupe',
      Conversível: 'convertible',
      Conversivel: 'convertible',
      Minivan: 'minivan',
      Perua: 'wagon',
      SW: 'wagon',
      Van: 'van',
      Utilitário: 'other',
    }

    const transmissionMap: Record<string, string> = {
      Automático: 'automatic',
      Automatico: 'automatic',
      Manual: 'manual',
      CVT: 'automatic',
      Automatizado: 'automatic',
    }

    const fuelMap: Record<string, string> = {
      Gasolina: 'gasoline',
      Etanol: 'flex',
      Flex: 'flex',
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
        // ID Integrity Check (Valid UUID)
        if (
          !v.id ||
          !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            v.id,
          )
        )
          return false

        // Robust Status Check
        const rawStatus = (v.status || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        if (rawStatus !== 'disponivel') return false

        const ano = Number(v.ano_modelo)
        const preco = Number(v.preco_venda)
        if (!v.preco_venda || preco < 1000 || !v.ano_modelo || ano < 1950 || ano > anoAtual)
          return false

        // Image Validation Check (Meta rejection prevention)
        if (!v.fotos || !Array.isArray(v.fotos) || v.fotos.length === 0) return false

        return true
      })
      .map((v) => {
        const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
        const imageLink = v.fotos[0]

        const price = `${Number(v.preco_venda).toFixed(2)} BRL`
        const condition = v.is_zero_km ? 'new' : 'used'
        const ano = v.ano_modelo
        const kmValor = v.quilometragem || 0
        const brand = v.marca || ''

        const title = `${brand} ${v.modelo} ${v.versao || ''}`.trim()

        let description = v.descricao
          ? v.descricao.substring(0, 5000)
          : `${title} ${ano}. ${kmValor}km. Loja Carro e Cia Motors.`
        description = description
          .replace(/<[^>]*>?/gm, '')
          .replace(/[\n\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        const rowData = [
          v.id,
          title,
          description,
          'in stock',
          condition,
          price,
          link,
          imageLink,
          brand,
          `${v.modelo} ${v.versao || ''}`.trim(),
          ano,
          kmValor,
          'km',
          addressJson,
          bodyStyleMap[v.categoria] || 'other',
          v.cor || '',
          transmissionMap[v.cambio] || 'other',
          fuelMap[v.combustivel] || 'other',
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
    const errorCsv = `error\n"Erro: ${err.message}"`
    return new Response(errorCsv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  }
})
