import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GeminiClient } from '../_shared/gemini-client.ts'
import { isInternalRequestAuthorized } from '../_shared/internal-auth.ts'

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

    // Comando via WhatsApp (whatsapp-ads.ts) chama servidor-a-servidor, sem
    // sessao de usuario -- aceita o header x-internal-secret como alternativa
    // ao login, mesmo padrao ja usado em daily-report-cron/publicar-social.
    const internalCall = isInternalRequestAuthorized(req)
    if (!userId && !internalCall && action !== 'pause_sold_ads') {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'chat') {
      const sysPrompt = `You are an Ads management AI agent for Carro e Cia Veiculos, a dealership in Uberaba, MG. Focus: vehicle sales, consignment, financing, trade-in. Parse the user instruction and return JSON: {"action":"list_campaigns|get_metrics|update_budget|toggle_status","platform":"google|meta","campaign_id":"optional","new_budget":optional_number,"new_status":"optional ACTIVE|PAUSED","description":"Portuguese description"}`
      const gemini = new GeminiClient()
      const geminiResult = await gemini.generate(`${sysPrompt}\n\nUser: ${message}`, {
        thinkingLevel: 'minimal',
        temperature: 0.3,
        jsonSchema: {
          type: 'OBJECT',
          properties: {
            action: { type: 'STRING' },
            platform: { type: 'STRING' },
            campaign_id: { type: 'STRING' },
            new_budget: { type: 'NUMBER' },
            new_status: { type: 'STRING' },
            description: { type: 'STRING' },
          },
        },
      })
      result = {
        proposed_action: geminiResult.json || JSON.parse(geminiResult.text || '{}'),
      }
    } else if (action === 'list_campaigns') {
      const data = await metaGet(`act_${META_AD_ACCOUNT_ID}/campaigns`, {
        fields: 'id,name,status,daily_budget,objective',
        limit: '100',
      })
      const campanhas = data.data || []
      // Formato do criativo (video/carrossel/imagem) e do ANUNCIO dentro da
      // campanha, nao da campanha em si -- busca TODOS os anuncios de cada
      // campanha (13/09/2026, pedido da Adriana: ver o conjunto completo de
      // anuncios, nao so 1 por campanha). Testado ao vivo em 13/09 contra a
      // conta real -- deteccao de formato confirmada certa (Video/Carrossel
      // batendo com o que a Adriana via no Gerenciador de Anuncios).
      const comAnuncios = await Promise.all(
        campanhas.map(async (c: any) => {
          try {
            const adsData = await metaGet(`${c.id}/ads`, {
              fields: 'id,name,status,creative{object_story_spec}',
              limit: '50',
            })
            const ads = (adsData.data || []).map((ad: any) => {
              const spec = ad.creative?.object_story_spec
              let ad_format = 'Desconhecido'
              if (spec?.video_data) ad_format = 'Vídeo'
              else if ((spec?.link_data?.child_attachments?.length || 0) > 1) ad_format = 'Carrossel'
              else if (spec?.link_data) ad_format = 'Imagem'
              return { id: ad.id, name: ad.name, status: ad.status, ad_format }
            })
            return { ...c, ads, ad_format: ads[0]?.ad_format || 'Desconhecido' }
          } catch {
            return { ...c, ads: [], ad_format: 'Desconhecido' }
          }
        }),
      )
      result = { campaigns: comAnuncios }
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
    } else if (action === 'get_account_balance') {
      const data = await metaGet(`act_${META_AD_ACCOUNT_ID}`, {
        fields: 'balance,amount_spent,spend_cap,currency,funding_source_details',
      })
      result = { account: data }
    } else if (action === 'get_recommendations') {
      // Recomendacoes da Meta sao por CONTA, nao por campanha -- testado
      // 10/09/2026, `/{campaign_id}/recommendations` devolve erro "nonexisting
      // field"; `act_{id}/recommendations` funciona e traz recomendacao real
      // (ex: variar texto/criativo do anuncio, com estimativa de ganho).
      const data = await metaGet(`act_${META_AD_ACCOUNT_ID}/recommendations`, {})
      result = { recomendacoes: data.data?.[0]?.recommendations || [] }
    } else if (action === 'criar_solicitacao') {
      // NUNCA chama a API da plataforma aqui -- so grava um pedido pendente.
      // Decisao da Adriana (10/09/2026): todo ajuste de orcamento/status
      // espera aprovacao explicita antes de mexer em dinheiro de verdade.
      const { data, error } = await supabase
        .from('ads_solicitacoes_ajuste')
        .insert({
          plataforma: platform || 'meta',
          tipo_ajuste: params?.tipo_ajuste,
          campanha_id: params?.campanha_id,
          campanha_nome: params?.campanha_nome || null,
          valor_atual: params?.valor_atual ?? null,
          valor_novo: params?.valor_novo,
          origem: params?.origem || 'manual',
          descricao: params?.descricao || null,
          solicitado_por: userId,
        })
        .select()
        .single()
      if (error) throw error
      result = { solicitacao: data }
    } else if (action === 'aplicar_solicitacao') {
      const { data: solicitacao, error: fetchError } = await supabase
        .from('ads_solicitacoes_ajuste')
        .select('*')
        .eq('id', params?.solicitacao_id)
        .single()
      if (fetchError) throw fetchError
      if (solicitacao.status !== 'pendente') {
        throw new Error(`Solicitação já está com status "${solicitacao.status}", não pode aplicar de novo.`)
      }

      let apiResult: any = null
      let novoStatus = 'aplicado'
      let erroMsg: string | null = null
      try {
        if (solicitacao.tipo_ajuste === 'orcamento') {
          apiResult = await metaPost(solicitacao.campanha_id, {
            daily_budget: Math.round((solicitacao.valor_novo?.daily_budget || 0) * 100).toString(),
          })
        } else if (solicitacao.tipo_ajuste === 'status') {
          apiResult = await metaPost(solicitacao.campanha_id, {
            status: solicitacao.valor_novo?.status,
          })
        } else {
          throw new Error(`tipo_ajuste "${solicitacao.tipo_ajuste}" não tem execução automática.`)
        }
      } catch (e: any) {
        novoStatus = 'erro'
        erroMsg = e.message
      }

      const { data: atualizada, error: updateError } = await supabase
        .from('ads_solicitacoes_ajuste')
        .update({
          status: novoStatus,
          decidido_por: userId,
          decidido_em: new Date().toISOString(),
          resultado_api: apiResult,
          erro: erroMsg,
        })
        .eq('id', solicitacao.id)
        .select()
        .single()
      if (updateError) throw updateError

      await supabase.from('ads_audit_logs').insert({
        usuario_id: userId,
        plataforma: solicitacao.plataforma,
        acao: `aplicar_solicitacao:${solicitacao.tipo_ajuste}`,
        campanha_id: solicitacao.campanha_id,
        detalhes: { solicitacao_id: solicitacao.id, valor_novo: solicitacao.valor_novo },
        status: novoStatus === 'aplicado' ? 'sucesso' : 'erro',
      })

      result = { solicitacao: atualizada }
    } else if (action === 'pause_sold_ads') {
      const { data: soldVehicles } = await supabase
        .from('veiculos')
        .select('id,marca,modelo')
        .eq('status', 'vendido')
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

    // aplicar_solicitacao ja grava seu proprio log (com o status real,
    // sucesso ou erro) porque captura o resultado da API dentro do proprio
    // bloco -- esse log generico sempre grava "sucesso", registraria errado.
    // criar_solicitacao nao precisa de log aqui: o pedido em si ja fica
    // rastreado em ads_solicitacoes_ajuste, sem chamar a API da plataforma.
    if (action !== 'aplicar_solicitacao' && action !== 'criar_solicitacao') {
      await supabase.from('ads_audit_logs').insert({
        usuario_id: userId,
        plataforma: platform || 'meta',
        acao: action,
        campanha_id: params?.campaign_id || null,
        detalhes: params || {},
        status: 'sucesso',
      })
    }

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
