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

export interface PublicacaoStatus {
  id: string
  veiculo_id: string
  platform: string
  status: string | null
  erro_msg: string | null
  publicado_em: string | null
  updated_at: string | null
  url_publicacao: string | null
}

export interface VeiculoSync {
  id: string
  marca: string
  modelo: string
  versao: string | null
  ano_modelo: number | null
  ano_fabricacao: number | null
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
  ml_listing_type: string | null
  elegivel_portais: boolean | null
  ad_types: Record<string, string> | null
  cor: string | null
  combustivel: string | null
  cambio: string | null
  cilindrada: string | null
  direcao: string | null
  descricao: string | null
  created_at: string | null
  publicacoes?: PublicacaoStatus[]
}

const VEHICLE_SELECT = `
  id, marca, modelo, versao, ano_modelo, ano_fabricacao, quilometragem,
  placa, preco_venda, fotos, status, cor, combustivel, cambio, cilindrada,
  direcao, descricao, ml_listing_type, created_at, elegivel_portais, ad_types,
  publicado_mercadolivre, publicado_webmotors, publicado_olx,
  publicado_icarros, publicado_napista
`

export async function fetchPlataformas(): Promise<Plataforma[]> {
  const { data, error } = await supabase
    .from('plataformas')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data || []
}

export async function fetchVeiculosForPortais(
  search = '',
  page = 1,
  pageSize = 20,
  sortBy = 'marca_modelo',
): Promise<{ vehicles: VeiculoSync[]; total: number }> {
  let query = supabase
    .from('veiculos')
    .select(VEHICLE_SELECT, { count: 'exact' })
    .eq('status', 'disponivel')
  if (sortBy === 'marca_modelo') {
    query = query.order('marca', { ascending: true }).order('modelo', { ascending: true })
  } else if (sortBy === 'recentes') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('modelo', { ascending: true })
  }
  if (search) {
    query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,placa.ilike.%${search}%`)
  }
  query = query.range((page - 1) * pageSize, page * pageSize - 1)
  const { data, count, error } = await query
  if (error) throw error
  return { vehicles: (data || []) as unknown as VeiculoSync[], total: count || 0 }
}

export async function fetchDashboard(slug: string): Promise<PlataformaDashboard> {
  const { data, error } = await supabase.functions.invoke('admin-plataformas-api', {
    method: 'POST',
    body: { path: `${slug}/dashboard` },
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
  const { error } = await supabase.functions.invoke('sync-estoque', { method: 'POST', body: {} })
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

export async function updateAdType(
  veiculoId: string,
  platform: string,
  adType: string,
): Promise<void> {
  if (platform === 'mercadolivre') {
    const { error } = await supabase
      .from('veiculos')
      .update({ ml_listing_type: adType })
      .eq('id', veiculoId)
    if (error) throw error
  } else {
    const { data: vehicle, error: fetchError } = await supabase
      .from('veiculos')
      .select('ad_types')
      .eq('id', veiculoId)
      .single()
    if (fetchError) throw fetchError
    const current = (vehicle?.ad_types as Record<string, string>) || {}
    const { error } = await supabase
      .from('veiculos')
      .update({ ad_types: { ...current, [platform]: adType } })
      .eq('id', veiculoId)
    if (error) throw error
  }
}

export async function toggleElegivelPortais(veiculoId: string, elegivel: boolean): Promise<void> {
  const { error } = await supabase
    .from('veiculos')
    .update({ elegivel_portais: elegivel })
    .eq('id', veiculoId)
  if (error) throw error
}
