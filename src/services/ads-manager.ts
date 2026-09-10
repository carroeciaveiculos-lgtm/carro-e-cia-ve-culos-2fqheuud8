import { supabase } from '@/lib/supabase/client'

export interface ProposedAction {
  action: 'list_campaigns' | 'get_metrics' | 'update_budget' | 'toggle_status'
  platform: 'google' | 'meta'
  campaign_id?: string
  new_budget?: number
  new_status?: string
  description: string
}

export interface Campaign {
  id: string
  name: string
  status: string
  daily_budget: number
  metrics?: {
    impressions: number
    clicks: number
    cost: number
    conversions: number
    ctr: number
  }
}

export async function chatWithAgent(message: string): Promise<ProposedAction> {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: { action: 'chat', message },
  })
  if (error) throw error
  return data?.proposed_action
}

export async function executeAction(action: ProposedAction) {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: {
      action: action.action,
      platform: action.platform,
      params: {
        campaign_id: action.campaign_id,
        new_budget: action.new_budget,
        new_status: action.new_status,
      },
    },
  })
  if (error) throw error
  return data
}

export async function listCampaigns(platform: 'google' | 'meta'): Promise<Campaign[]> {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: { action: 'list_campaigns', platform },
  })
  if (error) throw error
  return data?.campaigns || []
}

export async function updateBudget(
  platform: 'google' | 'meta',
  campaignId: string,
  newBudget: number,
) {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: {
      action: 'update_budget',
      platform,
      params: { campaign_id: campaignId, new_budget: newBudget },
    },
  })
  if (error) throw error
  return data
}

export async function toggleStatus(
  platform: 'google' | 'meta',
  campaignId: string,
  newStatus: string,
) {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: {
      action: 'toggle_status',
      platform,
      params: { campaign_id: campaignId, new_status: newStatus },
    },
  })
  if (error) throw error
  return data
}

export async function generateAdCopy(product: string, audience: string, tone: string) {
  const { data, error } = await supabase.functions.invoke('ad-copy-generator', {
    body: { product, audience, tone },
  })
  if (error) throw error
  return data?.data
}

export interface AccountBalance {
  balance: string
  amount_spent: string
  spend_cap: string
  currency: string
}

export async function getAccountBalance(platform: 'google' | 'meta'): Promise<AccountBalance> {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: { action: 'get_account_balance', platform },
  })
  if (error) throw error
  return data?.account
}

export interface Recommendation {
  object_ids: string[]
  type: string
  recommendation_content: {
    body: string
    lift_estimate?: string
    opportunity_score_lift?: string
  }
  url?: string
}

export async function getRecommendations(platform: 'google' | 'meta'): Promise<Recommendation[]> {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: { action: 'get_recommendations', platform },
  })
  if (error) throw error
  return data?.recomendacoes || []
}

export interface SolicitacaoAjuste {
  id: string
  plataforma: 'google' | 'meta'
  tipo_ajuste: 'orcamento' | 'status'
  campanha_id: string
  campanha_nome: string | null
  valor_atual: any
  valor_novo: any
  origem: string
  descricao: string | null
  status: 'pendente' | 'aplicado' | 'rejeitado' | 'erro'
  solicitado_em: string
  decidido_em: string | null
  resultado_api: any
  erro: string | null
}

export async function criarSolicitacaoAjuste(params: {
  platform: 'google' | 'meta'
  tipo_ajuste: 'orcamento' | 'status'
  campanha_id: string
  campanha_nome?: string
  valor_atual?: any
  valor_novo: any
  descricao?: string
}): Promise<SolicitacaoAjuste> {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: {
      action: 'criar_solicitacao',
      platform: params.platform,
      params: {
        tipo_ajuste: params.tipo_ajuste,
        campanha_id: params.campanha_id,
        campanha_nome: params.campanha_nome,
        valor_atual: params.valor_atual,
        valor_novo: params.valor_novo,
        descricao: params.descricao,
        origem: 'manual',
      },
    },
  })
  if (error) throw error
  return data?.solicitacao
}

export async function aplicarSolicitacaoAjuste(solicitacaoId: string): Promise<SolicitacaoAjuste> {
  const { data, error } = await supabase.functions.invoke('ads-agent', {
    body: { action: 'aplicar_solicitacao', params: { solicitacao_id: solicitacaoId } },
  })
  if (error) throw error
  return data?.solicitacao
}

export async function rejeitarSolicitacaoAjuste(solicitacaoId: string): Promise<void> {
  const { error } = await supabase
    .from('ads_solicitacoes_ajuste')
    .update({ status: 'rejeitado', decidido_em: new Date().toISOString() })
    .eq('id', solicitacaoId)
  if (error) throw error
}

export async function listSolicitacoesAjuste(
  platform: 'google' | 'meta',
): Promise<SolicitacaoAjuste[]> {
  const { data, error } = await supabase
    .from('ads_solicitacoes_ajuste')
    .select('*')
    .eq('plataforma', platform)
    .order('solicitado_em', { ascending: false })
    .limit(30)
  if (error) throw error
  return data || []
}

export async function getAuditLogs(platform: 'google' | 'meta', limit = 20) {
  const { data, error } = await supabase
    .from('ads_audit_logs')
    .select('*')
    .eq('plataforma', platform)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
