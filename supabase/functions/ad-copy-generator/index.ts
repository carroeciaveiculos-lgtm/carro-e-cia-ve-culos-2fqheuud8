import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { product, audience, tone } = await req.json()
    const apiKey = Deno.env.get('GEMINI_APY_KEY')
    if (!apiKey) throw new Error('AI API key not configured')

    const prompt = `You are an expert ad copywriter for automotive products in Brazil.
Generate exactly 3 variations of headlines and descriptions for "${product}" targeting "${audience}".
Tone: ${tone || 'professional'}.

SUSEP COMPLIANCE RULES (CRITICAL):
1. NEVER promise guaranteed returns or profits.
2. Clearly distinguish between "consórcio" (group savings plan, delivery subject to draw/bid) and "seguro" (risk transfer, coverage subject to policy terms).
3. Never use "consórcio" and "seguro" interchangeably.
4. Avoid superlatives like "melhor", "garantido" without qualification.
5. All claims must be verifiable.
6. Include appropriate disclaimers in compliance_notes.

Return JSON:
{
  "variations": [
    {
      "headline": "string max 60 chars",
      "description": "string max 125 chars",
      "cta": "string max 25 chars",
      "compliance_notes": "SUSEP compliance notes in Portuguese"
    }
  ]
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        }),
      },
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsed = JSON.parse(text)

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
