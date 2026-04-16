import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

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

    const token = Deno.env.get('API_BRASIL_TOKEN')

    // Fallback/Mock dinâmico se a loja ainda não configurou o token da API Brasil.
    if (!token) {
      const cleanPlaca = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()
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

      const response = {
        placa: cleanPlaca,
        chassi: chassi,
        renavam: renavam,
        marca: marca,
        modelo: modelo,
        ano_fab: anoFab,
        ano_modelo: anoMod,
        combustivel: hash % 2 === 0 ? 'Flex' : 'Gasolina',
        cor: hash % 3 === 0 ? 'Prata' : hash % 2 === 0 ? 'Preta' : 'Branca',
        preco_fipe: 40000 + (hash % 100) * 1000,
        mock: true,
      }

      // Simular latência de rede para maior realismo
      await new Promise((resolve) => setTimeout(resolve, 800))

      return new Response(JSON.stringify({ success: true, data: response }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Caso o Token exista, executa a requisição real
    const res = await fetch('https://gateway.apibrasil.io/api/v2/consulta/veiculos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tipo: 'fipe-chassi',
        placa: placa,
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

    const dados = data.dados || data

    const result = {
      placa: dados?.placa || placa,
      chassi: dados?.chassi || '',
      renavam: dados?.renavam || '',
      marca: dados?.marca || '',
      modelo: dados?.modelo || '',
      ano_fab: dados?.ano_fabricacao || '',
      ano_modelo: dados?.ano_modelo || '',
      combustivel: dados?.combustivel || '',
      cor: dados?.cor || '',
      preco_fipe: dados?.fipe?.valor || 0,
    }
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
