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

    const prompt = `You are an expert automotive marketing copywriter for "Carro e Cia Veículos", a used car dealership in Uberaba, MG, Brazil.
Generate exactly 3 variations of headlines and descriptions for "${product}" targeting "${audience}".
Tone: ${tone || 'professional'}.

AUTOMOTIVE MARKETING GUIDELINES:
1. Highlight vehicle condition, low mileage, and ownership history (único dono) when relevant.
2. Emphasize financing accessibility — mention competitive rates, flexible down payments, and fast approval.
3. For consignment, focus on security, fast sale process, and transparent contracts.
4. For trade-in evaluations, stress free, no-obligation appraisals and fair market value.
5. Always include a clear, action-oriented CTA directing users to WhatsApp or the dealership.
6. Use persuasive but honest language — avoid false promises about guaranteed approval or unrealistic prices.
7. Reference Uberaba and Triângulo Mineiro region to build local trust.
8. Mention "1 ano de garantia" (1-year warranty) and "laudo cautelar" (inspection report) for sales ads when appropriate.

Return JSON:
{
  "variations": [
    {
      "headline": "string max 60 chars",
      "description": "string max 125 chars",
      "cta": "string max 25 chars",
      "compliance_notes": "Marketing best-practice notes in Portuguese"
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
