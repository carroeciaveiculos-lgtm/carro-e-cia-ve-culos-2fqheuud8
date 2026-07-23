import { supabase } from '@/lib/supabase/client'

export interface WMDashboardData {
  total_published: number
  sync_errors_7d: number
  pending_syncs: number
  leads_7d: number
}

export interface WMVehicleRow {
  id: string
  veiculo_id: string
  status: string | null
  post_id: string | null
  erro_msg: string | null
  updated_at: string | null
  veiculos: {
    marca: string | null
    modelo: string | null
    ano_modelo: number | null
    fotos: string[] | null
    placa: string | null
  } | null
}

export interface WMSyncLog {
  id: string
  acao: string
  status: string
  mensagem: string | null
  created_at: string | null
  veiculo_id: string | null
}

export async function getWMDashboard(): Promise<WMDashboardData> {
  const { data, error } = await supabase.rpc('get_wm_dashboard')
  if (error) throw error
  return data as WMDashboardData
}

export async function triggerWMSync(veiculoId?: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('wm-sync', {
    body: veiculoId ? { veiculo_id: veiculoId } : {},
  })
  if (error) {
    throw new Error(error.message || 'Failed to sync with Webmotors. Please try again later.')
  }
  if (data && data.error) {
    throw new Error(data.error)
  }
}

export async function getWMVehicles(limit = 20): Promise<WMVehicleRow[]> {
  const { data, error } = await supabase
    .from('estoque_publicacoes')
    .select(`
      id, veiculo_id, status, post_id, erro_msg, updated_at,
      veiculos(marca, modelo, ano_modelo, fotos, placa)
    `)
    .eq('platform', 'webmotors')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as unknown as WMVehicleRow[]
}

export async function getWMSyncLogs(limit = 20): Promise<WMSyncLog[]> {
  const { data: plat } = await supabase
    .from('plataformas')
    .select('id')
    .eq('slug', 'webmotors')
    .maybeSingle()
  if (!plat) return []
  const { data, error } = await supabase
    .from('sync_log')
    .select('id, acao, status, mensagem, created_at, veiculo_id')
    .eq('plataforma_id', plat.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
