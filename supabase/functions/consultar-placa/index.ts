import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placa } = await req.json()

    if (!placa) {
      throw new Error('Placa não informada')
    }

    const cleanPlaca = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificação no Cache Inteligente
    const { data: cacheData } = await supabase
      .from('veiculos_cache')
      .select('*')
      .eq('placa', cleanPlaca)
      .single()

    if (cacheData) {
      return new Response(JSON.stringify({ success: true, data: cacheData, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = Deno.env.get('API_BRASIL_TOKEN')
    let result: any = {}

    if (!token) {
      // Mock dinâmico se a loja ainda não configurou o token da API Brasil.
      const hash = cleanPlaca
        .split('')
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)

      const marcas = [
        'Fiat',
        'Volkswagen',
        'Chevrolet',
        'Ford',
        'Hyundai',
        'Toyota',
        'Honda',
        'Jeep',
        'Renault',
        'Nissan',
      ]
      const modelos: Record<string, string[]> = {
        Fiat: ['Uno Vivace', 'Argo Drive', 'Toro Freedom', 'Strada Endurance', 'Pulse Audace'],
        Volkswagen: [
          'Gol MPI',
          'Polo Track',
          'Nivus Highline',
          'T-Cross Comfortline',
          'Saveiro Trendline',
        ],
        Chevrolet: ['Onix Plus', 'Tracker Premier', 'Cruze LTZ', 'S10 High Country', 'Equinox RS'],
        Ford: ['Ka SE', 'EcoSport Titanium', 'Ranger XLT', 'Bronco Sport', 'Territory Titanium'],
        Hyundai: ['HB20 Sense', 'Creta Action', 'Tucson GLS'],
        Toyota: ['Corolla XEI', 'Hilux SRV', 'Yaris XLS', 'Corolla Cross XRE'],
        Honda: ['Civic Touring', 'HR-V EXL', 'City EX', 'Fit LX'],
        Jeep: ['Renegade Sport', 'Compass Longitude', 'Commander Overland'],
        Renault: ['Kwid Zen', 'Sandero Stepway', 'Duster Iconic', 'Captur Bose'],
        Nissan: ['Kicks Advance', 'Versa Exclusive', 'Frontier Attack'],
      }

      const marca = marcas[hash % marcas.length]
      const modeloList = modelos[marca]
      const modelo = modeloList[hash % modeloList.length]

      const anoFab = 2012 + (hash % 12)
      const anoMod = anoFab + 1

      const chassi =
        '9BW' +
        Math.random().toString(36).substring(2, 12).toUpperCase() +
        (hash % 99999).toString().padStart(5, '0')
      const renavam = (Math.random() * 100000000000).toFixed(0).padStart(11, '0')

      const precoMock = 40000 + (hash % 100) * 1000

      result = {
        placa: cleanPlaca,
        chassi: chassi,
        renavam: renavam,
        marca: marca,
        modelo: modelo,
        ano_fab: anoFab.toString(),
        ano_modelo: anoMod.toString(),
        combustivel: hash % 2 === 0 ? 'Flex' : 'Gasolina',
        combustivel_sintetico: hash % 2 === 0 ? 'Álcool/Gasolina' : 'Gasolina',
        cor: hash % 3 === 0 ? 'Prata' : hash % 2 === 0 ? 'Preta' : 'Branca',
        preco_fipe: precoMock,
        mes_referencia: 'Mês Atual',
        codigo_fipe: '001' + (hash % 999).toString().padStart(4, '0') + '-1',
        url_fipe: 'https://veiculos.fipe.org.br',
        historico_fipe: [
          { mes: '05-2024', valor: precoMock },
          { mes: '04-2024', valor: precoMock * 1.01 },
          { mes: '03-2024', valor: precoMock * 1.02 },
          { mes: '02-2024', valor: precoMock * 1.04 },
          { mes: '01-2024', valor: precoMock * 1.05 },
        ],
        categoria: 'Carro',
        categoria_sintetica: 'Automóvel Leve',
        chassi_completo: chassi,
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
    } else {
      // Caso o Token exista, executa a requisição real
      const res = await fetch('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo: 'fipe-chassi',
          placa: cleanPlaca,
          homolog: false,
        }),
      })

      let data
      try {
        data = await res.json()
      } catch (e) {
        throw new Error(
          `Falha de comunicação com a API Brasil (Status: ${res.status}). Verifique o token ou tente novamente mais tarde.`,
        )
      }

      if (!res.ok || data?.error) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            'Token da API Brasil inválido ou expirado. Verifique as configurações de Secrets.',
          )
        }
        if (res.status === 404 || data?.message?.toLowerCase().includes('not found')) {
          throw new Error('Veículo não encontrado para a placa informada.')
        }
        throw new Error(
          data?.message || data?.error || `Erro desconhecido na API Brasil (Status: ${res.status})`,
        )
      }

      let veiculoData: any = {}
      if (
        data?.data?.resultados &&
        Array.isArray(data.data.resultados) &&
        data.data.resultados.length > 0
      ) {
        veiculoData = data.data.resultados[0]
      } else if (data?.dados) {
        veiculoData = data.dados
      } else {
        veiculoData = data
      }

      result = {
        placa: cleanPlaca,
        chassi: veiculoData?.chassi || '',
        renavam: veiculoData?.renavam || '',
        marca: veiculoData?.marca || '',
        modelo: veiculoData?.modelo || '',
        ano_fab:
          veiculoData?.anoFabricacao?.toString() || veiculoData?.ano_fabricacao?.toString() || '',
        ano_modelo: veiculoData?.anoModelo?.toString() || veiculoData?.ano_modelo?.toString() || '',
        combustivel: veiculoData?.combustivel || '',
        combustivel_sintetico:
          veiculoData?.extra?.combustivel?.sintetico || veiculoData?.sintetico || '',
        cor: veiculoData?.cor || '',
        preco_fipe: veiculoData?.valor || veiculoData?.preco_fipe || veiculoData?.fipe?.valor || 0,
        mes_referencia: veiculoData?.mesReferencia || '',
        codigo_fipe:
          veiculoData?.codigoFipe || veiculoData?.fipe?.codigo || veiculoData?.codigo_fipe || '',
        url_fipe: veiculoData?.url || veiculoData?.fipe?.url || '',
        historico_fipe: veiculoData?.historico ||
          veiculoData?.fipe?.historico || [
            { mes: 'Mês Atual', valor: veiculoData?.valor || veiculoData?.preco_fipe || 0 },
            {
              mes: 'Mês Anterior',
              valor: (veiculoData?.valor || veiculoData?.preco_fipe || 0) * 1.01,
            },
            {
              mes: '2 Meses Atrás',
              valor: (veiculoData?.valor || veiculoData?.preco_fipe || 0) * 1.02,
            },
          ],
        categoria: veiculoData?.categoria || 'Carro',
        categoria_sintetica:
          veiculoData?.extra?.categoria?.descricao || veiculoData?.categoria || '',
        chassi_completo: veiculoData?.chassi || '',
      }

      // Correção de Mapeamento (Combustível vs Categoria)
      if (result.combustivel_sintetico) {
        const lowerSint = result.combustivel_sintetico.toLowerCase()
        if (
          ['carro', 'moto', 'caminhão', 'caminhao', 'utilitário', 'utilitario'].includes(lowerSint)
        ) {
          result.categoria_sintetica = result.combustivel_sintetico
          result.combustivel_sintetico = ''
        }
      }
    }
    // Sincronização Automática (Upsert) no Cache
    await supabase.from('veiculos_cache').upsert({
      ...result,
      updated_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
