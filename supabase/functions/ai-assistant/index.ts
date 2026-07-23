import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GeminiClient } from '../_shared/gemini-client.ts'

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
    const { prompt, context, lead_id } = await req.json()
    const gemini = new GeminiClient()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('ai_enabled')
        .eq('id', lead_id)
        .single()
      if (lead && lead.ai_enabled === false) {
        return new Response(JSON.stringify({ result: '[AI_DISABLED]' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch active memory context
    const { data: brainKnowledge } = await supabase
      .from('brain_ia_knowledge')
      .select('titulo, conteudo, tipo')
      .limit(15)
    const { data: helpContents } = await supabase.from('ajuda_conteudos').select('*').limit(20)
    const { data: vehicles } = await supabase
      .from('veiculos')
      .select('marca, modelo, preco_venda')
      .eq('status', 'disponivel')
      .limit(5)

    const memoryContext = `
Conhecimento Brain IA:
${brainKnowledge?.map((k: any) => `${k.titulo}: ${k.conteudo || k.tipo}`).join('\n')}

Manuais do Sistema e FAQ:
${helpContents?.map((h: any) => `${h.titulo} (${h.categoria}): O que é: ${h.o_que_e || ''}. Serve para: ${h.para_que_serve || ''}. Como usar: ${h.como_utilizar || ''}`).join('\n')}

Exemplos do Estoque atual (limite de 5):
${vehicles?.map((v: any) => `${v.marca} ${v.modelo} - R$ ${v.preco_venda}`).join('\n')}
    `

    const { data: promptConfig } = await supabase.from('ai_prompts_config').select('prompt_text').eq('slug', 'ai_assistant').maybeSingle()
    const assistantPrompt = promptConfig?.prompt_text || 'Você é a Brain IA, o assistente central e especializado da Carro e Cia Veículos.'

    const sysPrompt = `${assistantPrompt}
Sua missão é responder com base nas diretrizes e informações aprendidas da Memória Ativa.

Memória Ativa:
${memoryContext}

Contexto Fornecido Pelo Usuário na Tela:
${context || 'Nenhum'}

Tarefa / Pergunta do Administrador:
${prompt}

*Instruções Adicionais de CRM:*
Se o cliente mencionar um veículo para dar na troca, extraia essa informação e formate claramente na sua resposta como "Trade-in vehicle" ou "Carro na troca".
Se o cliente mencionar a forma de pagamento desejada, extraia e formate como "Payment method" ou "Forma de pagamento".
Sua resposta deve ajudar a manter o CRM atualizado com essas entidades.

Responda de forma humanizada, empática e demonstre como você aplicaria o conhecimento. Responda apenas com o texto final gerado, sem formatação markdown de bloco (\`\`\`) e sem aspas extras.`

    const geminiResult = await gemini.generate(sysPrompt, { thinkingLevel: 'high' })
    const result = geminiResult.text || ''

    return new Response(JSON.stringify({ result: result.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
