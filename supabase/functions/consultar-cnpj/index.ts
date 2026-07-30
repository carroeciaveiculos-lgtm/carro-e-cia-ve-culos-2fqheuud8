import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cnpj }: { cnpj: string } = await req.json()
    const cleanCnpj = (cnpj || '').replace(/\D/g, '')

    if (!cleanCnpj || cleanCnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: true, message: 'CNPJ inválido. Deve conter 14 dígitos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Erro ao consultar CNPJ'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        if (response.status === 404) errorMessage = 'CNPJ não encontrado na base de dados.'
        else if (response.status === 429)
          errorMessage = 'Limite de consultas excedido. Tente novamente em alguns instantes.'
      }
      return new Response(JSON.stringify({ error: true, message: errorMessage }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const data = await response.json()

    const result = {
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      cep: (data.cep || '').replace(/^(\d{5})(\d{3})$/, '$1-$2'),
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: true,
        message: `Erro interno: ${error?.message || 'Unknown error'}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
