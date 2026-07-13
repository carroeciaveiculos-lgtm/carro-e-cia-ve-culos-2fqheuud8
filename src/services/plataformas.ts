import { supabase } from '@/lib/supabase/client'

export interface Plataforma {
  id: string
  slug: string
  nome: string
  icone: string | null
  cor: string | null
  ativo: boolean | null
}

export interface PlataformaDashboard {
  ativos: number
  erros: number
  pendentes: number
  ultima_sincronizacao: string | null
  ultimo_erro: string | null
  status_conexao: string
}

export interface VeiculoSync {
  id: string
  marca: string
  modelo: string
  versao: string | null
  ano_modelo: number | null
  quilometragem: number | null
  placa: string | null
  preco_venda: number | null
  fotos: string[] | null
  publicado_mercadolivre: boolean | null
  publicado_webmotors: boolean | null
  publicado_olx: boolean | null
  publicado_icarros: boolean | null
  publicado_napista: boolean | null
  status: string | null
}

export async function fetchPlataformas(): Promise<Plataforma[]> {
  const { data, error } = await supabase
    .from('plataformas')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data || []
}

export async function fetchDashboard(slug: string): Promise<PlataformaDashboard> {
  const { data, error } = await supabase.functions.invoke('admin-plataformas-api', {
    method: 'GET',
    body: { path: `${slug}/dashboard` },
  })
  if (error) throw error
  return data
}

export async function fetchVeiculosSync(
  slug: string,
  page = 1,
  search = '',
): Promise<{ veiculos: VeiculoSync[]; total: number }> {
  const { data, error } = await supabase.functions.invoke('admin-plataformas-api', {
    method: 'GET',
    body: { path: `${slug}/veiculos`, page, search },
  })
  if (error) throw error
  return data
}

export async function forceSync(slug: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-plataformas-api', {
    method: 'POST',
    body: { path: `${slug}/sync/forcar` },
  })
  if (error) throw error
}

export async function triggerSyncEstoque(): Promise<void> {
  const { error } = await supabase.functions.invoke('sync-estoque', {
    method: 'POST',
    body: {},
  })
  if (error) throw error
}

export async function toggleVehiclePublication(
  slug: string,
  veiculoId: string,
  publicar: boolean,
): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-plataformas-api', {
    method: 'POST',
    body: { path: `${slug}/veiculos/publicar`, veiculo_id: veiculoId, publicar },
  })
  if (error) throw error
}
