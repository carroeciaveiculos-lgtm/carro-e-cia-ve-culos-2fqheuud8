import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context } = await req.json()
    const apiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('API Key missing. Configured as GEMINI_APY_KEY in secrets.')
    }

    const sysPrompt = `Você é um assistente de conteúdo otimizado para SEO e conversão.\nContexto atual:\n${context || 'Nenhum'}\n\nTarefa:\n${prompt}\n\nResponda apenas com o texto final gerado, sem formatação markdown de bloco (\`\`\`) e sem aspas extras.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
