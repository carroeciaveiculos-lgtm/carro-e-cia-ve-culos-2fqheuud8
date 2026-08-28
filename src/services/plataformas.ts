import { supabase } from '@/lib/supabase/client'
import { getTierLabel } from '@/lib/platform-tiers'

const SLUG_MAP_PUBLICADO: Record<string, string> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

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
  cilindrada: number | null
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

export interface FiltrosPortais {
  plataforma?: string | null
  modalidade?: string | null
  tempoEstoque?: 'ate_30' | '30_60' | '60_90' | 'mais_90' | null
  statusPublicacao?: 'publicado' | 'nao_publicado' | null
}

// Modalidade real da Webmotors vive em wm_mapeamento_veiculos.codigo_modalidade_wm
// (não em ad_types, que é só preferência — wm-sync nunca lê isso, ver
// PortalTierSelector). Pra filtrar por ela sem trazer o catálogo inteiro,
// resolve o código real via wm_modalidades (mesmo casamento por texto que
// updateModalidadeWebmotors já usa) e busca os veiculo_id que batem.
async function resolverVeiculoIdsPorModalidadeWebmotors(tierLabel: string): Promise<string[] | null> {
  const termoBusca = tierLabel.replace(/^Anúncio\s+/i, '').replace(/\s+VIP$/i, '').trim()
  const { data: modalidade } = await supabase
    .from('wm_modalidades')
    .select('codigo_wm')
    .ilike('descricao', `%${termoBusca}%`)
    .maybeSingle()
  if (!modalidade) return []
  const { data: mapeamentos } = await supabase
    .from('wm_mapeamento_veiculos')
    .select('veiculo_id')
    .eq('codigo_modalidade_wm', modalidade.codigo_wm)
  return (mapeamentos || []).map((m: any) => m.veiculo_id)
}

const FAIXAS_TEMPO_ESTOQUE: Record<string, { minDias?: number; maxDias?: number }> = {
  ate_30: { maxDias: 30 },
  '30_60': { minDias: 30, maxDias: 60 },
  '60_90': { minDias: 60, maxDias: 90 },
  mais_90: { minDias: 90 },
}

export async function fetchVeiculosForPortais(
  search?: string,
  page?: number,
  pageSize?: number,
  sortBy?: string,
  filtros?: FiltrosPortais,
): Promise<{ vehicles: VeiculoSync[]; total: number }> {
  const currentPage = page || 1
  const size = pageSize || 20
  const from = (currentPage - 1) * size
  const to = from + size - 1

  let query = supabase.from('veiculos').select('*', { count: 'exact' }).eq('status', 'disponivel')

  if (search) {
    query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,placa.ilike.%${search}%`)
  }

  if (filtros?.statusPublicacao && filtros.plataforma) {
    const campo = SLUG_MAP_PUBLICADO[filtros.plataforma]
    if (campo) query = query.eq(campo, filtros.statusPublicacao === 'publicado')
  }

  if (filtros?.plataforma === 'mercadolivre' && filtros.modalidade) {
    query = query.eq('ml_listing_type', filtros.modalidade)
  }

  if (filtros?.plataforma === 'webmotors' && filtros.modalidade) {
    const tierLabel = getTierLabel('webmotors', filtros.modalidade)
    const ids = await resolverVeiculoIdsPorModalidadeWebmotors(tierLabel)
    if (!ids || ids.length === 0) return { vehicles: [], total: 0 }
    query = query.in('id', ids)
  }

  if (filtros?.tempoEstoque) {
    const faixa = FAIXAS_TEMPO_ESTOQUE[filtros.tempoEstoque]
    const agora = new Date()
    if (faixa.maxDias !== undefined) {
      const limite = new Date(agora.getTime() - faixa.maxDias * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', limite.toISOString())
    }
    if (faixa.minDias !== undefined) {
      const limite = new Date(agora.getTime() - faixa.minDias * 24 * 60 * 60 * 1000)
      query = query.lt('created_at', limite.toISOString())
    }
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

export interface NapistaCatalogSyncResult {
  success: boolean
  error?: string
  combos_processadas?: number
  resultados?: Array<{ marca: string; modelo: string; versoes_encontradas?: number; erro?: string }>
}

// Aciona napista-sync-catalogo por trás de napista-catalogo-trigger (function
// autenticada, restrita ao e-mail da Adriana) — o secret interno nunca chega
// no navegador.
export async function syncNapistaCatalogo(): Promise<NapistaCatalogSyncResult> {
  const { data, error } = await supabase.functions.invoke('napista-catalogo-trigger', {
    body: {},
  })
  if (error) return { success: false, error: error.message }
  return data
}

export interface NapistaCandidato {
  id: string
  nome: string
  score: number
}

export interface NapistaPendencia {
  veiculo_id: string
  marca: string
  modelo: string
  versao: string | null
  fotos: string[] | null
  napista_marca_id: string | null
  napista_modelo_id: string | null
  napista_version_id: string | null
  erro_msg: string | null
  candidatos_modelo: NapistaCandidato[]
  candidatos_versao: NapistaCandidato[]
}

// Infere em qual etapa o auto-match parou (marca/modelo/versão/catálogo de
// atributos) a partir de quais ids já foram preenchidos — não guarda um
// campo "motivo" à parte, os próprios ids já contam a história.
export function motivoPendenciaNapista(p: NapistaPendencia): 'marca' | 'modelo' | 'versao' | 'catalogo_napista' {
  if (!p.napista_marca_id) return 'marca'
  if (!p.napista_modelo_id) return 'modelo'
  if (!p.napista_version_id) return 'versao'
  return 'catalogo_napista'
}

export interface NapistaSyncResult {
  success: boolean
  processed?: number
  error?: string
}

// Achado 17/08/2026: o botão "Sincronizar Agora" pro NaPista só trocava a
// flag `publicado_napista` do veículo (toggleVehiclePublication) — nunca
// chamava a napista-sync de verdade, então "publicar"/"despublicar" ali não
// tinha nenhum efeito real na NaPista. Mesmo padrão do triggerWMSync: marca
// o status em `estoque_publicacoes` e chama a function na hora.
export async function triggerNapistaSync(veiculoId?: string): Promise<NapistaSyncResult> {
  const { data, error } = await supabase.functions.invoke('napista-sync', {
    body: veiculoId ? { veiculo_id: veiculoId } : {},
  })
  if (error) return { success: false, error: error.message || 'Falha ao sincronizar com a NaPista' }
  if (data?.error) return { success: false, error: data.error }
  const results: Array<{ status?: string; error?: string }> = Array.isArray(data?.results)
    ? data.results
    : []
  const falhas = results.filter((r) => r.status === 'error')
  if (falhas.length > 0) {
    return {
      success: false,
      processed: data?.processed ?? 0,
      error: falhas.map((r) => r.error).filter(Boolean).join(' | ') || 'Falha ao sincronizar com a NaPista',
    }
  }
  return { success: true, processed: data?.processed ?? 0 }
}

export interface ModalidadeReal {
  codigo: string
  descricao: string
}

// A modalidade "real" (o que a Webmotors de fato usa pra publicar) vem de
// wm_mapeamento_veiculos.codigo_modalidade_wm — não de veiculos.ad_types,
// que é só a preferência salva pelo seletor e nunca foi lida por wm-sync.
// Achado 17/08/2026: o seletor mostrava ad_types (com fallback pro primeiro
// tier da lista, "Super Acelerador VIP") mesmo quando o anúncio real estava
// publicado como "Anúncio Básico" — informação errada mostrada pra Adriana.
export async function fetchModalidadeReal(
  veiculoId: string,
  platform: string,
): Promise<ModalidadeReal | null> {
  if (platform !== 'webmotors') return null
  const { data: mapeamento } = await supabase
    .from('wm_mapeamento_veiculos')
    .select('codigo_modalidade_wm')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()
  if (!mapeamento?.codigo_modalidade_wm) return null
  const { data: modalidade } = await supabase
    .from('wm_modalidades')
    .select('descricao')
    .eq('codigo_wm', mapeamento.codigo_modalidade_wm)
    .maybeSingle()
  return {
    codigo: mapeamento.codigo_modalidade_wm,
    descricao: modalidade?.descricao || `Código ${mapeamento.codigo_modalidade_wm}`,
  }
}

// Muda a modalidade que a Webmotors realmente usa (não só a preferência em
// ad_types). Casa pelo texto porque wm_modalidades só tem o que a conta já
// usou/consultou (hoje: "Anúncio Básico" e "Super Acelerador Vip"), sem
// tabela fixa de código por tier — se a Adriana contratar uma modalidade
// nova, ela precisa aparecer em wm_modalidades antes (via ObterModalidade,
// já roda a cada wm-sync) pra virar uma opção válida aqui.
export async function updateModalidadeWebmotors(veiculoId: string, tierLabel: string): Promise<void> {
  const termoBusca = tierLabel.replace(/^Anúncio\s+/i, '').replace(/\s+VIP$/i, '').trim()
  const { data: modalidade, error: findError } = await supabase
    .from('wm_modalidades')
    .select('codigo_wm')
    .ilike('descricao', `%${termoBusca}%`)
    .maybeSingle()
  if (findError || !modalidade) {
    throw new Error(
      `Não achei a modalidade "${tierLabel}" na conta Webmotors — confirme o nome exato em wm_modalidades.`,
    )
  }
  const { error } = await supabase
    .from('wm_mapeamento_veiculos')
    .update({ codigo_modalidade_wm: modalidade.codigo_wm })
    .eq('veiculo_id', veiculoId)
  if (error) throw error
}

export async function fetchNapistaPendencias(): Promise<NapistaPendencia[]> {
  const { data, error } = await supabase
    .from('napista_mapeamento_veiculos')
    .select(
      'veiculo_id, napista_marca_id, napista_modelo_id, napista_version_id, erro_msg, candidatos_modelo, candidatos_versao, veiculos(marca, modelo, versao, fotos)',
    )
    .eq('status_sincronizacao', 'revisao_necessaria')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r: any) => ({
    veiculo_id: r.veiculo_id,
    marca: r.veiculos?.marca || '',
    modelo: r.veiculos?.modelo || '',
    versao: r.veiculos?.versao || null,
    fotos: r.veiculos?.fotos || null,
    napista_marca_id: r.napista_marca_id,
    napista_modelo_id: r.napista_modelo_id,
    napista_version_id: r.napista_version_id,
    erro_msg: r.erro_msg,
    candidatos_modelo: r.candidatos_modelo || [],
    candidatos_versao: r.candidatos_versao || [],
  }))
}

export async function confirmarMapeamentoNapista(
  veiculoId: string,
  napistaModeloId?: string,
  napistaVersionId?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('napista-confirmar-mapeamento', {
    body: { veiculo_id: veiculoId, napista_modelo_id: napistaModeloId, napista_version_id: napistaVersionId },
  })
  if (error) return { success: false, error: error.message }
  return data
}

export async function remapearVeiculoNapista(
  veiculoId: string,
): Promise<{ success: boolean; status?: string; motivo?: string; error?: string }> {
  // force:true (26/08/2026) -- clique explícito em "Remapear" deve sempre
  // rodar de novo, mesmo que já esteja "mapeado" -- diferente da chamada
  // automática no salvar do formulário, que agora pula veículo já mapeado
  // pra não derrubar confirmação manual sem querer.
  const { data, error } = await supabase.functions.invoke('napista-mapear-veiculo', {
    body: { veiculo_id: veiculoId, force: true },
  })
  if (error) return { success: false, error: error.message }
  return data
}
