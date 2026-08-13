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
  portas: number | null
  categoria: string | null
  created_at: string | null
  publicacoes?: PublicacaoStatus[]
}

export async function fetchPlataformas(): Promise<Plataforma[]> {
  const { data, error } = await supabase
    .from('plataformas')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) return []
  return (data || []) as Plataforma[]
}

export async function fetchVeiculosForPortais(
  search?: string,
  page?: number,
  pageSize?: number,
  sortBy?: string,
): Promise<{ vehicles: VeiculoSync[]; total: number }> {
  const currentPage = page || 1
  const size = pageSize || 20
  const from = (currentPage - 1) * size
  const to = from + size - 1

  let query = supabase.from('veiculos').select('*', { count: 'exact' }).eq('status', 'disponivel')

  if (search) {
    query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,placa.ilike.%${search}%`)
  }

  if (sortBy === 'recentes') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('marca', { ascending: true }).order('modelo', { ascending: true })
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) return { vehicles: [], total: 0 }
  return { vehicles: (data || []) as VeiculoSync[], total: count || 0 }
}

export async function fetchDashboard(slug: string): Promise<PlataformaDashboard> {
  const { count: ativos } = await supabase
    .from('estoque_publicacoes')
    .select('*', { count: 'exact', head: true })
    .eq('platform', slug)
    .in('status', ['published', 'ativo'])

  const { count: erros } = await supabase
    .from('estoque_publicacoes')
    .select('*', { count: 'exact', head: true })
    .eq('platform', slug)
    .in('status', ['error', 'erro'])

  const { count: pendentes } = await supabase
    .from('estoque_publicacoes')
    .select('*', { count: 'exact', head: true })
    .eq('platform', slug)
    .in('status', ['pending', 'agendado'])

  const { data: lastSync } = await supabase
    .from('estoque_publicacoes')
    .select('publicado_em, erro_msg, updated_at')
    .eq('platform', slug)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    ativos: ativos || 0,
    erros: erros || 0,
    pendentes: pendentes || 0,
    ultima_sincronizacao: lastSync?.publicado_em || lastSync?.updated_at || null,
    ultimo_erro: lastSync?.erro_msg || null,
    status_conexao: 'connected',
  }
}

export async function forceSync(slug: string): Promise<void> {
  await supabase.functions.invoke('sync-estoque', {
    body: { platform: slug },
  })
}

export async function triggerSyncEstoque(): Promise<void> {
  await supabase.functions.invoke('sync-estoque', {
    body: { force: true },
  })
}

export async function toggleVehiclePublication(
  slug: string,
  veiculoId: string,
  publicar: boolean,
): Promise<void> {
  const column = `publicado_${slug}`
  const { error } = await supabase
    .from('veiculos')
    .update({ [column]: publicar })
    .eq('id', veiculoId)
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
    const { data: veiculo } = await supabase
      .from('veiculos')
      .select('ad_types')
      .eq('id', veiculoId)
      .single()
    const currentAdTypes = (veiculo?.ad_types as Record<string, string>) || {}
    const { error } = await supabase
      .from('veiculos')
      .update({ ad_types: { ...currentAdTypes, [platform]: adType } })
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

export async function ensureMLListings(veiculoIds: string[]): Promise<void> {
  if (veiculoIds.length === 0) return

  const { data: existing } = await supabase
    .from('ml_listings')
    .select('veiculo_id')
    .in('veiculo_id', veiculoIds)

  const existingIds = new Set((existing || []).map((r: any) => r.veiculo_id))
  const newIds = veiculoIds.filter((id) => !existingIds.has(id))

  if (newIds.length === 0) return

  const inserts = newIds.map((veiculo_id) => ({
    veiculo_id,
    status: 'pending_create',
    last_synced_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('ml_listings').insert(inserts)
  if (error) throw error
}

export async function fetchMLErrors(): Promise<
  Array<{ veiculo_id: string; marca: string; modelo: string; error: string }>
> {
  const { data: pubs, error } = await supabase
    .from('estoque_publicacoes')
    .select('veiculo_id, erro_msg')
    .eq('platform', 'mercadolivre')
    .in('status', ['error', 'erro'])
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error || !pubs || pubs.length === 0) return []

  const veiculoIds = [...new Set(pubs.map((p: any) => p.veiculo_id))]
  const { data: veiculos } = await supabase
    .from('veiculos')
    .select('id, marca, modelo')
    .in('id', veiculoIds)

  const veiculoMap = new Map((veiculos || []).map((v: any) => [v.id, v]))

  return pubs.map((p: any) => ({
    veiculo_id: p.veiculo_id,
    marca: veiculoMap.get(p.veiculo_id)?.marca || '',
    modelo: veiculoMap.get(p.veiculo_id)?.modelo || '',
    error: p.erro_msg || 'Erro desconhecido',
  }))
}

export async function getMLAuthUrl(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ml-auth', {
    body: { action: 'get_auth_url' },
  })
  if (error) throw error
  return data?.auth_url || ''
}
