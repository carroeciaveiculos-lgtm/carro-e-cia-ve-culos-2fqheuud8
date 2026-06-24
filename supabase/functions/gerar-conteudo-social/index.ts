import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { veiculo, platform } = await req.json()
    const apiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const prompt = `Você é um especialista em marketing automotivo.
Crie um post persuasivo para a rede social ${platform} vendendo o seguinte veículo:
Marca: ${veiculo.marca}
Modelo: ${veiculo.modelo}
Ano: ${veiculo.ano_fabricacao}
Preço: R$ ${veiculo.preco_venda}
Cor: ${veiculo.cor}
Combustível: ${veiculo.combustivel}
Descrição: ${veiculo.descricao || 'Sem descrição adicional'}

Inclua emojis, um tom atrativo e chamadas para ação. No final, adicione hashtags relevantes. Não coloque aspas no texto todo. O formato deve estar pronto para copiar e colar no ${platform}.`

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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
