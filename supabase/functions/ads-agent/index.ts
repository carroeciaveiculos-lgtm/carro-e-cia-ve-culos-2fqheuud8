import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

function mockCampaigns(platform: string) {
  const base = [
    { id: `${platform}_001`, name: 'Consignação - Uberaba', status: 'ACTIVE', daily_budget: 50 },
    {
      id: `${platform}_002`,
      name: 'Estoque - Carros Seminovos',
      status: 'PAUSED',
      daily_budget: 80,
    },
    { id: `${platform}_003`, name: 'Retargeting - Visitantes', status: 'ACTIVE', daily_budget: 30 },
  ]
  return base.map((c) => {
    const imp = Math.floor(Math.random() * 50000) + 5000
    const clk = Math.floor(Math.random() * 500) + 50
    return {
      ...c,
      metrics: {
        impressions: imp,
        clicks: clk,
        cost: Math.random() * 2000 + 200,
        conversions: Math.floor(Math.random() * 30) + 2,
        ctr: (clk / imp) * 100,
      },
    }
  })
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

    const { action, platform, params, message } = await req.json()
    let result: any = {}

    if (action === 'chat') {
      const apiKey = Deno.env.get('GEMINI_APY_KEY')
      if (!apiKey) throw new Error('AI API key not configured')

      const sysPrompt = `You are an Ads management AI agent for Carro e Cia Veículos, an automotive dealership in Uberaba, MG.
The dealership focuses on: vehicle sales, consignment, financing, and trade-in evaluations.
Parse the user's instruction and return a JSON object with the proposed action.
Supported actions: list_campaigns, get_metrics, update_budget, toggle_status
Platforms: google, meta
Return ONLY JSON: {"action":"...","platform":"google|meta","campaign_id":"optional","new_budget":optional_number,"new_status":"optional ACTIVE|PAUSED","description":"human readable description in Portuguese"}`

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${sysPrompt}\n\nUser: ${message}` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
          }),
        },
      )
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      result = { proposed_action: JSON.parse(text) }
    } else if (action === 'list_campaigns' || action === 'get_metrics') {
      result =
        action === 'list_campaigns'
          ? { campaigns: mockCampaigns(platform) }
          : {
              metrics: mockCampaigns(platform).map((c) => ({
                id: c.id,
                name: c.name,
                ...c.metrics,
              })),
            }
    } else if (action === 'update_budget') {
      result = { success: true, campaign_id: params?.campaign_id, new_budget: params?.new_budget }
    } else if (action === 'toggle_status') {
      result = { success: true, campaign_id: params?.campaign_id, new_status: params?.new_status }
    }

    await supabase.from('ads_audit_logs').insert({
      usuario_id: userId,
      plataforma: platform || 'unknown',
      acao: action,
      campanha_id: params?.campaign_id || null,
      detalhes: params || {},
      status: 'sucesso',
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
