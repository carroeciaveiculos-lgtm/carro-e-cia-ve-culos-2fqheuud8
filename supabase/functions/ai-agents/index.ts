import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GeminiClient } from '../_shared/gemini-client.ts'
import { COLUNAS_VEICULO_SEGURAS } from '../_shared/veiculo-safe-fields.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const VEHICLE_FUNCTIONS = [
  {
    name: 'buscar_veiculos_estoque',
    description: 'Buscar veiculos disponiveis no estoque da concessionaria',
    parameters: {
      type: 'OBJECT',
      properties: {
        marca: { type: 'STRING', description: 'Marca do veiculo' },
        modelo: { type: 'STRING', description: 'Modelo do veiculo' },
        preco_max: { type: 'NUMBER', description: 'Preco maximo' },
        preco_min: { type: 'NUMBER', description: 'Preco minimo' },
        ano_min: { type: 'INTEGER', description: 'Ano minimo' },
        limite: { type: 'INTEGER', description: 'Limite de resultados' },
      },
    },
  },
  {
    name: 'buscar_veiculo_especifico',
    description: 'Buscar um veiculo especifico por ID',
    parameters: {
      type: 'OBJECT',
      properties: { veiculo_id: { type: 'STRING' } },
      required: ['veiculo_id'],
    },
  },
  {
    name: 'avaliar_troca',
    description: 'Avaliar veiculo para troca baseado em marca, modelo, ano e quilometragem',
    parameters: {
      type: 'OBJECT',
      properties: {
        marca: { type: 'STRING' },
        modelo: { type: 'STRING' },
        ano: { type: 'INTEGER' },
        quilometragem: { type: 'INTEGER' },
        condicao: { type: 'STRING' },
      },
      required: ['marca', 'modelo', 'ano'],
    },
  },
]

async function executeFunction(name: string, args: any, supabase: any): Promise<any> {
  if (name === 'buscar_veiculos_estoque') {
    let q = supabase.from('veiculos').select(COLUNAS_VEICULO_SEGURAS).eq('status', 'disponivel')
    if (args.marca) q = q.ilike('marca', `%${args.marca}%`)
    if (args.modelo) q = q.ilike('modelo', `%${args.modelo}%`)
    if (args.preco_max) q = q.lte('preco_venda', args.preco_max)
    if (args.preco_min) q = q.gte('preco_venda', args.preco_min)
    if (args.ano_min) q = q.gte('ano_modelo', args.ano_min)
    const { data, error } = await q.limit(args.limite || 10)
    if (error) return { error: error.message }
    return { veiculos: data }
  }
  if (name === 'buscar_veiculo_especifico') {
    const { data, error } = await supabase
      .from('veiculos')
      .select(COLUNAS_VEICULO_SEGURAS)
      .eq('id', args.veiculo_id)
      .single()
    if (error) return { error: error.message }
    return { veiculo: data }
  }
  if (name === 'avaliar_troca') {
    const { data } = await supabase
      .from('veiculos')
      .select('marca,modelo,ano_modelo,preco_venda,valor_fipe,quilometragem')
      .ilike('marca', `%${args.marca}%`)
      .ilike('modelo', `%${args.modelo}%`)
      .limit(5)
    return { veiculos_similares: data || [], parametros: args }
  }
  return { error: 'Unknown function' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    let userId: string | null = null
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      )
      const {
        data: { user },
      } = await userClient.auth.getUser()
      userId = user?.id ?? null
    }
    if (!userId)
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    const { agent_type, message, context } = await req.json()
    const systemPrompts: Record<string, string> = {
      negotiation: `Voce e um Agente de Negociacao especializado da Carro e Cia Veiculos em Uberaba, MG. Use as funcoes para buscar veiculos no estoque e fornecer informacoes precisas. Responda em portugues brasileiro de forma profissional.`,
      trade_in: `Voce e um Agente de Avaliacao de Trocas especializado da Carro e Cia Veiculos em Uberaba, MG. Use as funcoes para buscar veiculos similares e comparar precos. Considere marca, modelo, ano, quilometragem e condicao. Responda em portugues brasileiro de forma tecnica.`,
    }
    const systemPrompt = systemPrompts[agent_type] || systemPrompts.negotiation
    const fullPrompt = context
      ? `Contexto: ${JSON.stringify(context)}\n\nMensagem: ${message}`
      : message

    const gemini = new GeminiClient()
    const result = await gemini.generate(fullPrompt, {
      thinkingLevel: 'medium',
      temperature: 0.5,
      systemPrompt,
      functions: VEHICLE_FUNCTIONS,
    })

    let functionResults: any[] = []
    if (result.functionCalls.length > 0) {
      functionResults = await Promise.all(
        result.functionCalls.map(async (fc) => ({
          name: fc.name,
          result: await executeFunction(fc.name, fc.args, supabase),
        })),
      )
      const followUp = await gemini.generate(
        `${fullPrompt}\n\nResultados:\n${JSON.stringify(functionResults, null, 2)}\n\nResponda ao usuario com base nessas informacoes.`,
        { thinkingLevel: 'medium', temperature: 0.5, systemPrompt },
      )
      return new Response(
        JSON.stringify({
          response: followUp.text,
          function_calls: result.functionCalls,
          function_results: functionResults,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    await supabase
      .from('logs_ia')
      .insert({
        usuario_id: userId,
        acao: `ai_agent_${agent_type}`,
        provider: 'google',
        modelo: 'gemini-1.5-flash',
        status: 'sucesso',
        tokens_input: result.tokenUsage.input,
        tokens_output: result.tokenUsage.output,
      })
      .then(
        () => {},
        () => {},
      )
    return new Response(
      JSON.stringify({ response: result.text, function_calls: [], function_results: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
