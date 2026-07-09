import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const META_API_BASE = 'https://graph.facebook.com/v20.0'
const META_ADS_TOKEN = Deno.env.get('META_ADS_TOKEN') ?? ''
const META_AD_ACCOUNT_ID = (Deno.env.get('META_AD_ACCOUNT_ID') ?? '').replace(/^act_/, '')

async function metaGet(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${META_API_BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('access_token', META_ADS_TOKEN)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Meta API ${res.status}: ${await res.text()}`)
  return res.json()
}

async function metaPost(endpoint: string, body: Record<string, any> = {}): Promise<any> {
  const res = await fetch(`${META_API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: META_ADS_TOKEN }),
  })
  if (!res.ok) throw new Error(`Meta API ${res.status}: ${await res.text()}`)
  return res.json()
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

    if (!userId && action !== 'pause_sold_ads') {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'chat') {
      const apiKey = Deno.env.get('GEMINI_APY_KEY')
      if (!apiKey) throw new Error('AI API key not configured')
      const sysPrompt = `You are an Ads management AI agent for Carro e Cia Veiculos, a dealership in Uberaba, MG. Focus: vehicle sales, consignment, financing, trade-in. Parse the user instruction and return JSON: {"action":"list_campaigns|get_metrics|update_budget|toggle_status","platform":"google|meta","campaign_id":"optional","new_budget":optional_number,"new_status":"optional ACTIVE|PAUSED","description":"Portuguese description"}`
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
      result = {
        proposed_action: JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'),
      }
    } else if (action === 'list_campaigns') {
      const data = await metaGet(`act_${META_AD_ACCOUNT_ID}/campaigns`, {
        fields: 'id,name,status,daily_budget,objective',
        limit: '100',
      })
      result = { campaigns: data.data || [] }
    } else if (action === 'get_metrics') {
      const campData = await metaGet(`act_${META_AD_ACCOUNT_ID}/campaigns`, {
        fields: 'id,name,status',
        limit: '100',
      })
      const metrics = await Promise.all(
        (campData.data || []).map(async (c: any) => {
          try {
            const ins = await metaGet(`${c.id}/insights`, {
              fields: 'impressions,clicks,spend,ctr,actions',
              date_preset: 'last_30d',
            })
            const d = ins.data?.[0] || {}
            return {
              id: c.id,
              name: c.name,
              status: c.status,
              metrics: {
                impressions: +(d.impressions || 0),
                clicks: +(d.clicks || 0),
                cost: +(d.spend || 0),
                ctr: +(d.ctr || 0),
                conversions: +(
                  d.actions?.find((a: any) => a.action_type === 'offsite_conversion')?.value || 0
                ),
              },
            }
          } catch {
            return { id: c.id, name: c.name, status: c.status, metrics: null }
          }
        }),
      )
      result = { metrics }
    } else if (action === 'update_budget') {
      const data = await metaPost(params?.campaign_id, {
        daily_budget: Math.round((params?.new_budget || 0) * 100).toString(),
      })
      result = {
        success: true,
        campaign_id: params?.campaign_id,
        new_budget: params?.new_budget,
        data,
      }
    } else if (action === 'toggle_status') {
      const data = await metaPost(params?.campaign_id, { status: params?.new_status })
      result = {
        success: true,
        campaign_id: params?.campaign_id,
        new_status: params?.new_status,
        data,
      }
    } else if (action === 'pause_sold_ads') {
      const { data: soldVehicles } = await supabase
        .from('veiculos')
        .select('id,marca,modelo')
        .eq('status', 'Vendido')
      if (!soldVehicles?.length) {
        result = { success: true, message: 'No sold vehicles found', paused: 0 }
      } else {
        const campData = await metaGet(`act_${META_AD_ACCOUNT_ID}/campaigns`, {
          fields: 'id,name,status',
          limit: '100',
        })
        const active = (campData.data || []).filter((c: any) => c.status === 'ACTIVE')
        const paused: any[] = []
        for (const v of soldVehicles) {
          const matched = active.filter(
            (c: any) =>
              c.name?.toLowerCase().includes(v.marca?.toLowerCase()) &&
              c.name?.toLowerCase().includes(v.modelo?.toLowerCase()),
          )
          for (const ad of matched) {
            try {
              await metaPost(ad.id, { status: 'PAUSED' })
              paused.push({
                campaign_id: ad.id,
                campaign_name: ad.name,
                vehicle: `${v.marca} ${v.modelo}`,
              })
            } catch (e) {
              console.error(`Pause failed for ${ad.id}:`, e)
            }
          }
        }
        result = { success: true, paused: paused.length, campaigns: paused }
      }
    }

    await supabase.from('ads_audit_logs').insert({
      usuario_id: userId,
      plataforma: platform || 'meta',
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
