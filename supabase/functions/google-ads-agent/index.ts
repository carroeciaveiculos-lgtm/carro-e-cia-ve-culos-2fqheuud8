import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Fase 2 do painel de Gestao de Anuncios (docs/gestao-anuncios.md). Espelha
// supabase/functions/ads-agent/index.ts (Meta), mas pra API REST do Google
// Ads. Credenciais migradas de C:\Projeto\carroecia-api-google-ads\google-ads.yaml
// (servidor MCP local, so funciona numa sessao do Claude Code aberta naquela
// pasta -- aqui vira parte do site de verdade). Testado ao vivo em
// 10/09/2026 contra a conta real (customer 8695704366) antes de escrever
// este arquivo -- ver docs/gestao-anuncios.md, secao Fase 2.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const GOOGLE_ADS_API_VERSION = 'v25'
const DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? ''
const CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID') ?? ''
const CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET') ?? ''
const REFRESH_TOKEN = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN') ?? ''
const LOGIN_CUSTOMER_ID = (Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID') ?? '').replace(/-/g, '')
const CUSTOMER_ID = (Deno.env.get('GOOGLE_ADS_CUSTOMER_ID') ?? '').replace(/-/g, '')

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.access_token
}

async function gaqlSearch(query: string): Promise<any[]> {
  const accessToken = await getAccessToken()
  const res = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': DEVELOPER_TOKEN,
        'login-customer-id': LOGIN_CUSTOMER_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  )
  if (!res.ok) throw new Error(`Google Ads API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.results || []
}

async function gaqlMutate(resource: string, operations: any[]): Promise<any> {
  const accessToken = await getAccessToken()
  const res = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${CUSTOMER_ID}/${resource}:mutate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': DEVELOPER_TOKEN,
        'login-customer-id': LOGIN_CUSTOMER_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations }),
    },
  )
  if (!res.ok) throw new Error(`Google Ads API ${res.status}: ${await res.text()}`)
  return res.json()
}

// Traducao dos tipos de recomendacao mais comuns -- a API do Google nao
// devolve um texto pronto como a da Meta, so o enum do tipo. Lista curta,
// completar conforme aparecer tipo novo (fica em "Recomendação" generico
// se nao tiver traducao).
const TIPOS_RECOMENDACAO: Record<string, string> = {
  PERFORMANCE_MAX_OPT_IN: 'Ativar uma campanha Performance Max pode melhorar o desempenho.',
  CAMPAIGN_BUDGET: 'Aumentar o orçamento de uma campanha pode gerar mais resultados.',
  KEYWORD: 'Adicionar novas palavras-chave pode ampliar o alcance da campanha.',
  TEXT_AD: 'Criar novas variações de texto pode melhorar o desempenho dos anúncios.',
  RESPONSIVE_SEARCH_AD: 'Adicionar um anúncio de pesquisa responsivo pode melhorar o desempenho.',
  MAXIMIZE_CONVERSIONS_OPT_IN: 'Mudar a estratégia de lances para maximizar conversões.',
  TARGET_CPA_OPT_IN: 'Definir um CPA alvo pode otimizar o gasto por conversão.',
}

async function getBudgetIdForCampaign(campaignId: string): Promise<string> {
  const rows = await gaqlSearch(
    `SELECT campaign_budget.id FROM campaign WHERE campaign.id = ${campaignId}`,
  )
  const budgetResourceName = rows[0]?.campaignBudget?.resourceName
  if (!budgetResourceName) throw new Error(`Orçamento não encontrado para campanha ${campaignId}`)
  return rows[0].campaignBudget.id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    const authHeader = req.headers.get('Authorization')
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
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, params } = await req.json()
    let result: any = {}

    if (action === 'list_campaigns') {
      const rows = await gaqlSearch(`
        SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros
        FROM campaign WHERE campaign.status != 'REMOVED'
      `)
      result = {
        campaigns: rows.map((r) => ({
          id: r.campaign.id,
          name: r.campaign.name,
          status: r.campaign.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED',
          daily_budget: r.campaignBudget?.amountMicros
            ? Number(r.campaignBudget.amountMicros) / 1_000_000
            : null,
        })),
      }
    } else if (action === 'get_metrics') {
      const rows = await gaqlSearch(`
        SELECT campaign.id, campaign.name, campaign.status,
               metrics.impressions, metrics.clicks, metrics.cost_micros,
               metrics.ctr, metrics.conversions
        FROM campaign WHERE campaign.status != 'REMOVED' AND segments.date DURING LAST_30_DAYS
      `)
      result = {
        metrics: rows.map((r) => ({
          id: r.campaign.id,
          name: r.campaign.name,
          status: r.campaign.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED',
          metrics: {
            impressions: Number(r.metrics?.impressions || 0),
            clicks: Number(r.metrics?.clicks || 0),
            cost: Number(r.metrics?.costMicros || 0) / 1_000_000,
            ctr: Number(r.metrics?.ctr || 0) * 100,
            conversions: Number(r.metrics?.conversions || 0),
          },
        })),
      }
    } else if (action === 'get_account_balance') {
      // Google Ads tambem nao tem "saldo pra gastar" -- e limite de gasto
      // aprovado (account_budget), mesmo espirito do spend_cap da Meta.
      // Testado ao vivo 10/09/2026: essa conta tem billing_setup com
      // payments_account (cobranca automatica), nao e pre-paga.
      const rows = await gaqlSearch(`
        SELECT account_budget.approved_spending_limit_micros, account_budget.amount_served_micros
        FROM account_budget WHERE account_budget.status = 'APPROVED'
      `)
      const r = rows[0]?.accountBudget
      // amount_spent/spend_cap sao consumidos em centavos pelo front (igual
      // a Meta devolve), por isso *100 depois de converter de micros pra reais.
      result = {
        account: {
          balance: '0',
          amount_spent: r ? String(Math.round((Number(r.amountServedMicros) / 1_000_000) * 100)) : '0',
          spend_cap: r
            ? String(Math.round((Number(r.approvedSpendingLimitMicros) / 1_000_000) * 100))
            : '0',
          currency: 'BRL',
        },
      }
    } else if (action === 'get_recommendations') {
      const rows = await gaqlSearch(`
        SELECT recommendation.type, recommendation.campaign, recommendation.dismissed
        FROM recommendation WHERE recommendation.dismissed = false
      `)
      result = {
        recomendacoes: rows.map((r) => ({
          object_ids: [r.recommendation.campaign || r.recommendation.resourceName],
          type: r.recommendation.type,
          recommendation_content: {
            body: TIPOS_RECOMENDACAO[r.recommendation.type] || `Recomendação: ${r.recommendation.type}`,
          },
        })),
      }
    } else if (action === 'criar_solicitacao') {
      const { data, error } = await supabase
        .from('ads_solicitacoes_ajuste')
        .insert({
          plataforma: 'google',
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
          const budgetId = await getBudgetIdForCampaign(solicitacao.campanha_id)
          apiResult = await gaqlMutate('campaignBudgets', [
            {
              updateMask: 'amountMicros',
              update: {
                resourceName: `customers/${CUSTOMER_ID}/campaignBudgets/${budgetId}`,
                amountMicros: String(
                  Math.round((solicitacao.valor_novo?.daily_budget || 0) * 1_000_000),
                ),
              },
            },
          ])
        } else if (solicitacao.tipo_ajuste === 'status') {
          apiResult = await gaqlMutate('campaigns', [
            {
              updateMask: 'status',
              update: {
                resourceName: `customers/${CUSTOMER_ID}/campaigns/${solicitacao.campanha_id}`,
                status: solicitacao.valor_novo?.status === 'ACTIVE' ? 'ENABLED' : 'PAUSED',
              },
            },
          ])
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
        plataforma: 'google',
        acao: `aplicar_solicitacao:${solicitacao.tipo_ajuste}`,
        campanha_id: solicitacao.campanha_id,
        detalhes: { solicitacao_id: solicitacao.id, valor_novo: solicitacao.valor_novo },
        status: novoStatus === 'aplicado' ? 'sucesso' : 'erro',
      })

      result = { solicitacao: atualizada }
    }

    if (action !== 'aplicar_solicitacao' && action !== 'criar_solicitacao') {
      await supabase.from('ads_audit_logs').insert({
        usuario_id: userId,
        plataforma: 'google',
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
