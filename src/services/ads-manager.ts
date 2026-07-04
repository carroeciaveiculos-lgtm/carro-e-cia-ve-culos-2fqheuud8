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
