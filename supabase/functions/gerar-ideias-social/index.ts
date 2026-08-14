import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GeminiClient } from '../_shared/gemini-client.ts'

// Aba "Ideias com IA" da Central de Redes Sociais (14/08/2026, pedido da
// Adriana). Diferente de gerar-conteudo-social (que só sabe gerar a legenda
// de UM veículo específico), isto gera ideias de post/enquete de
// engajamento que não dependem de nenhum veículo — "o que postar hoje" em
// vez de "a legenda deste carro".
const IDEIAS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    ideias: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tipo: {
            type: 'STRING',
            enum: ['enquete', 'pergunta', 'curiosidade', 'bastidores', 'prova_social'],
          },
          titulo: { type: 'STRING', description: 'Resumo curto da ideia, pra Adriana escolher rápido' },
          texto_sugerido: { type: 'STRING', description: 'Legenda pronta pra copiar e colar' },
        },
        required: ['tipo', 'titulo', 'texto_sugerido'],
      },
    },
  },
  required: ['ideias'],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: promptConfig } = await supabase
      .from('ai_prompts_config')
      .select('prompt_text')
      .eq('slug', 'social_media')
      .maybeSingle()
    const basePrompt =
      promptConfig?.prompt_text || 'Você é um especialista em marketing automotivo.'

    const { count: totalVeiculos } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disponivel')

    const prompt = `${basePrompt}
A loja é a Carro & Cia Motors, revenda de veículos em Uberaba/MG, com ${totalVeiculos || 'vários'} veículos no estoque atual.

Gere 5 ideias VARIADAS de post pra Instagram/Facebook que gerem engajamento com o público — NÃO são pra vender um carro específico, são pra manter a página ativa e gerar interação (curtidas, comentários, compartilhamentos).

Inclua pelo menos 1 enquete (pergunta com opções, tipo "carro automático ou manual?"), 1 pergunta aberta pro público responder nos comentários, e o restante variando entre curiosidade automotiva, bastidores da loja (equipe, dia a dia, preparação de veículo) e prova social (depoimento, entrega de carro, etc — sem inventar nomes ou fatos reais, só sugerir o formato).

Cada ideia deve ter um texto_sugerido já pronto pra copiar e colar, curto (2-4 frases), com emojis moderados.`

    const gemini = new GeminiClient()
    const result = await gemini.generateStructured(prompt, IDEIAS_SCHEMA, { thinkingLevel: 'medium' })

    if (!result.json?.ideias) {
      throw new Error('IA não retornou ideias no formato esperado')
    }

    return new Response(JSON.stringify({ success: true, ideias: result.json.ideias }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Erro em gerar-ideias-social:', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
