import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'openai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Não autenticado')

    const { veiculo_id } = await req.json()

    if (!veiculo_id) throw new Error('veiculo_id é obrigatório')

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: veiculo, error: vError } = await supabaseService
      .from('veiculos')
      .select('*')
      .eq('id', veiculo_id)
      .single()

    if (vError || !veiculo) throw new Error('Veículo não encontrado')

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) throw new Error('OPENAI_API_KEY não configurada')

    const openai = new OpenAI({ apiKey: openAiKey })

    const prompt = `Atue como um especialista em marketing de concessionárias de carros.
Crie uma legenda persuasiva e que gere cliques para redes sociais (Instagram/Facebook/WhatsApp) vendendo o seguinte veículo:

Marca: ${veiculo.marca}
Modelo: ${veiculo.modelo}
Ano: ${veiculo.ano_fabricacao}
Preço: R$ ${veiculo.preco_venda?.toLocaleString('pt-BR')}
Km: ${veiculo.quilometragem?.toLocaleString('pt-BR')} km
Cor: ${veiculo.cor}
Combustível: ${veiculo.combustivel}

Diretrizes:
- Use tom entusiástico, focado no benefício e com senso de oportunidade.
- Inclua emojis relevantes sem exagerar.
- Adicione uma chamada para ação (CTA) forte no final pedindo para enviar mensagem ou clicar no link da bio.
- Adicione 5 a 8 hashtags otimizadas no final da mensagem.
- O texto não deve ser excessivamente longo.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content?.trim() || ''

    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_conteudo_social',
      provider: 'openai',
      modelo: 'gpt-4o-mini',
      status: 'sucesso',
      tokens_input: completion.usage?.prompt_tokens || 0,
      tokens_output: completion.usage?.completion_tokens || 0,
    })

    return new Response(JSON.stringify({ success: true, data: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
