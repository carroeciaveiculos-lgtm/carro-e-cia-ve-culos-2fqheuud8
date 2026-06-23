import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context, lead_id } = await req.json()
    const apiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('API Key missing. Configured as GEMINI_APY_KEY in secrets.')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (lead_id) {
      const { data: lead } = await supabase.from('leads').select('ai_enabled').eq('id', lead_id).single()
      if (lead && lead.ai_enabled === false) {
        return new Response(JSON.stringify({ result: '[AI_DISABLED]' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch active memory context
    const { data: brainKnowledge } = await supabase.from('brain_ia_knowledge').select('titulo, conteudo, tipo').limit(15)
    const { data: vehicles } = await supabase.from('veiculos').select('marca, modelo, preco_venda').eq('status', 'disponivel').limit(5)
    
    const memoryContext = `
Conhecimento Brain IA:
${brainKnowledge?.map((k: any) => `${k.titulo}: ${k.conteudo || k.tipo}`).join('\n')}

Exemplos do Estoque atual (limite de 5):
${vehicles?.map((v: any) => `${v.marca} ${v.modelo} - R$ ${v.preco_venda}`).join('\n')}
    `

    const sysPrompt = `Você é a Brain IA, o assistente central e especializado da Carro e Cia Veículos.
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sysPrompt }] }]
      })
    })

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

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
