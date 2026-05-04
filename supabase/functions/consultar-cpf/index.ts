import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

function findNome(obj: any): string {
  if (obj?.nome?.conteudo?.nome) return obj.nome.conteudo.nome
  if (obj?.nome_razao_social) return obj.nome_razao_social
  if (typeof obj?.nome === 'string') return obj.nome
  if (typeof obj?.razaosocial === 'string') return obj.razaosocial

  if (!obj || typeof obj !== 'object') return ''
  for (const key of Object.keys(obj)) {
    const k = key.toLowerCase()
    if (k === 'mae' || k === 'pai') continue

    if (
      k === 'nome' ||
      k === 'nomerazaosocial' ||
      k === 'razaosocial' ||
      k === 'nome_razao_social'
    ) {
      if (typeof obj[key] === 'string' && obj[key].trim() !== '') {
        return obj[key]
      }
    }
  }
  for (const key of Object.keys(obj)) {
    const k = key.toLowerCase()
    if (k === 'mae' || k === 'pai') continue

    if (typeof obj[key] === 'object') {
      const res = findNome(obj[key])
      if (res) return res
    }
  }
  return ''
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificação no Cache Inteligente
    const { data: cacheData } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf', cleanCpf)
      .single()

    if (cacheData) {
      return new Response(JSON.stringify({ success: true, data: cacheData, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = Deno.env.get('API_BRASIL_TOKEN')
    let result: any = {}

    if (!token) {
      // Mock dinâmico para ambiente sem token
      const nomes = [
        'João da Silva',
        'Maria Oliveira',
        'Pedro Santos',
        'Ana Costa',
        'Carlos Pereira',
        'Luiz Fernando Rodrigues de Araújo',
        'Roberto Carlos da Costa',
      ]
      const hash = cleanCpf
        .split('')
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const nome = nomes[hash % nomes.length]

      await new Promise((resolve) => setTimeout(resolve, 600))

      result = {
        cpf: cleanCpf,
        nome: nome,
        rg: '123456789',
        data_nascimento: '15/08/1985',
        idade: '38 anos',
        sexo: hash % 2 === 0 ? 'M' : 'F',
        nome_mae: 'Mãe Silva',
        situacao_receita: 'REGULAR',
        situacao_receita_data: '2023-11-01',
      }
    } else {
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

      const nomeEncontrado = findNome(data)

      result = {
        cpf: cleanCpf,
        nome: nomeEncontrado || '',
        rg: data?.outros_documentos?.rg || '',
        data_nascimento:
          data?.nome?.conteudo?.data_nascimento ||
          data.dataNascimento ||
          data.data_nascimento ||
          '',
        idade: data?.nome?.conteudo?.idade || '',
        sexo: data?.nome?.conteudo?.sexo || data.sexo || data.genero || '',
        nome_mae: data?.nome?.conteudo?.mae || data.mae || data.nome_mae || '',
        situacao_receita:
          data?.nome?.conteudo?.situacao_receita ||
          data.situacao ||
          data.situacao_cadastral ||
          'REGULAR',
        situacao_receita_data: data?.nome?.conteudo?.situacao_receita_data || '',
      }
    }

    // Sincronização Automática (Upsert)
    await supabase.from('clientes').upsert(
      {
        ...result,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cpf' },
    )

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
