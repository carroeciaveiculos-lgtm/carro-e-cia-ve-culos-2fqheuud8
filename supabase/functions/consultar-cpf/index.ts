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
    const { cpf } = await req.json()

    if (!cpf) {
      throw new Error('CPF não informado')
    }

    const cleanCpf = cpf.replace(/\D/g, '')
    const token = Deno.env.get('API_BRASIL_TOKEN')

    if (!token) {
      // Mock dinâmico para ambiente sem token
      const nomes = [
        'João da Silva',
        'Maria Oliveira',
        'Pedro Santos',
        'Ana Costa',
        'Carlos Pereira',
      ]
      const hash = cleanCpf
        .split('')
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const nome = nomes[hash % nomes.length]

      await new Promise((resolve) => setTimeout(resolve, 600))

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            nome: nome,
            cpf: cleanCpf,
            mock: true,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const res = await fetch('https://gateway.apibrasil.io/api/v2/consulta/cpf/credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cpf: cleanCpf,
        tipo: 'dados-cadastrais',
        homolog: false,
      }),
    })

    let data
    try {
      data = await res.json()
    } catch (e) {
      throw new Error(`Falha de comunicação com a API Brasil (Status: ${res.status}).`)
    }

    if (!res.ok || data?.error) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Token da API Brasil inválido ou expirado.')
      }
      throw new Error(
        data?.message || data?.error || `Erro desconhecido na API Brasil (Status: ${res.status})`,
      )
    }

    let cadData: any = {}
    if (
      data?.data?.resultados &&
      Array.isArray(data.data.resultados) &&
      data.data.resultados.length > 0
    ) {
      cadData = data.data.resultados[0]
    } else if (data?.dados) {
      cadData = data.dados
    } else {
      cadData = data
    }

    const result = {
      cpf: cleanCpf,
      nome: cadData?.nome || cadData?.NOME || cadData?.Nome || '',
    }

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
