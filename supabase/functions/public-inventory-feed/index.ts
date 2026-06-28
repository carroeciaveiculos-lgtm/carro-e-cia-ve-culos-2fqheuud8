import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const limparEConverterNumero = (val: any): number => {
  if (val === null || val === undefined) return 0
  const cleanStr = String(val).replace(/[^0-9.-]/g, '')
  return parseFloat(cleanStr) || 0
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
      .eq('exibir_no_site', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Cabeçalhos corrigidos seguindo o padrão estrito do Meta CSV
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
      'image[0].url', // Formato correto de cabeçalho do Meta
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

    // Endereço formatado no padrão com chaves aceito pela API da Meta
    const addressStr =
      "{addr1: 'Av. Guilherme Ferreira, 1131', city: 'Uberaba', region: 'MG', country: 'BR', postal_code: '38022-200'}"

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
        if (!v.id) return false

        const rawStatus = (v.status || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        if (rawStatus !== 'disponivel') return false

        const ano = Number(v.ano_modelo || v.ano_fabricacao)
        const preco = Number(v.preco_venda)
        if (!v.preco_venda || preco < 1000 || isNaN(ano) || ano < 1950 || ano > anoAtual + 1)
          return false

        return true
      })
      .map((v) => {
        const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`

        // Capturar o link da imagem
        let imageLink = 'https://www.carroeciamotors.com.br/placeholder-car.png'
        if (v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0) {
          imageLink = v.fotos[0]
        } else if (v.link_foto || v.foto_url) {
          imageLink = v.link_foto || v.foto_url
        }

        // CONVERSÃO DE SUCESSO: Converte WebP para JPEG de forma gratuita para o Meta catalogar sem erros!
        if (imageLink.includes('supabase.co/storage/v1/object/public/')) {
          const cleanUrl = imageLink.split('?')[0]
          imageLink = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg`
        }

        const precoFinal = limparEConverterNumero(v.preco_venda || v.preco_venda_promocional)
        const price = `${precoFinal.toFixed(2)} BRL`
        const condition = v.is_zero_km ? 'new' : 'used'
        const ano = v.ano_modelo || v.ano_fabricacao || v.ano
        const kmValue = Number(v.km || v.quilometragem || 1)

        const title = `${v.marca} ${v.modelo} ${v.versao || ''} ${ano}`.replace(/\s+/g, ' ').trim()

        let description = v.descricao
          ? v.descricao.substring(0, 5000)
          : `${title}. Lindo veículo em estoque na Carro e Cia Motors.`

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
          kmValue, // mileage.value (numérico puro)
          'KM', // mileage.unit (texto fixo em maiúsculo)
          price, // price
          link, // url
          imageLink, // image[0].url (Convertida via proxy gratuito para JPEG)
          addressStr, // address
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
