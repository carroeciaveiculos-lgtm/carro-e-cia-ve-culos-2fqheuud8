import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { veiculo_id, platform, veiculo } = body

    if (!veiculo_id && !veiculo) {
      return new Response(
        JSON.stringify({ success: false, error: 'veiculo_id é obrigatório no corpo da requisição.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let vehicleData = veiculo

    if (!vehicleData && veiculo_id) {
      const { data: vehicleRecord, error: dbError } = await supabase
        .from('veiculos')
        .select('marca, modelo, versao, ano_fabricacao, ano_modelo, cor, combustivel, quilometragem, cambio, preco_venda, descricao')
        .eq('id', veiculo_id)
        .single()

      if (dbError) {
        console.error('[gerar-conteudo-social] Database query error for ID:', veiculo_id, dbError.message)
      }

      if (!vehicleRecord) {
        console.error('[gerar-conteudo-social] Database query returned null for ID:', veiculo_id)
        return new Response(
          JSON.stringify({ success: false, error: 'Veículo não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      vehicleData = vehicleRecord
    }

    if (!vehicleData || !vehicleData.marca) {
      console.error('[gerar-conteudo-social] Vehicle data is missing or has no marca property. ID:', veiculo_id || 'inline')
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do veículo incompletos ou inválidos.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const targetPlatform = platform || 'Instagram'

    const prompt = `Você é um especialista em marketing automotivo.
Crie um post persuasivo para a rede social ${targetPlatform} vendendo o seguinte veículo:
Marca: ${vehicleData.marca}
Modelo: ${vehicleData.modelo}
Ano: ${vehicleData.ano_fabricacao}
Preço: R$ ${vehicleData.preco_venda}
Cor: ${vehicleData.cor}
Combustível: ${vehicleData.combustivel}
Descrição: ${vehicleData.descricao || 'Sem descrição adicional'}

Inclua emojis, um tom atrativo e chamadas para ação. No final, adicione hashtags relevantes. Não coloque aspas no texto todo. O formato deve estar pronto para copiar e colar no ${targetPlatform}.`

    const apiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro ao gerar conteúdo.'

    return new Response(JSON.stringify({ success: true, text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[gerar-conteudo-social] Unexpected error:', error?.message || error)
    return new Response(JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
