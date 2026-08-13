import { supabase } from '@/lib/supabase/client'

// Generaliza o que já existia só pra Webmotors em src/services/wm-sync.ts —
// usado pelo painel por plataforma em acordeão (PlatformSyncPanel) e pelo
// reprocessamento corrigido em portal-review.ts (12/08/2026).

export interface PlatformSyncDashboardData {
  total_published: number
  sync_errors_7d: number
  pending_syncs: number
  leads_7d: number
}

export interface PlatformVehicleRow {
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

export interface PlatformSyncLog {
  id: string
  acao: string
  status: string
  mensagem: string | null
  created_at: string | null
  veiculo_id: string | null
}

export interface PlatformSyncResult {
  success: boolean
  processed?: number
  error?: string
  isNetworkError?: boolean
}

// Cada plataforma real tem sua própria function de sincronização e sua
// própria fila — Webmotors usa estoque_publicacoes, Mercado Livre usa
// ml_listings (schema diferente, sem coluna de erro por linha; os erros de
// ML só existem em sync_log). OLX/iCarros/Napista não têm function nem fila
// real ainda — não entram aqui.
const SYNC_FUNCTION_BY_PLATFORM: Record<string, string> = {
  webmotors: 'wm-sync',
  mercadolivre: 'sync-plataforma',
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function triggerPlatformSync(
  platform: string,
  veiculoId?: string,
): Promise<PlatformSyncResult> {
  const fn = SYNC_FUNCTION_BY_PLATFORM[platform]
  if (!fn) {
    return { success: false, error: `Sem sincronização real configurada para "${platform}" ainda.` }
  }
  // sync-plataforma (Mercado Livre) só sincroniza 1 veículo por vez e exige
  // veiculo_id + platform no corpo — sem veiculoId aqui não tem o que fazer
  // (não existe endpoint de "sincronizar tudo" pra essa plataforma; o botão
  // que precisava disso foi ajustado em PlatformSyncPanel.tsx pra sincronizar
  // veículo a veículo em vez de chamar isso sem id).
  if (platform === 'mercadolivre' && !veiculoId) {
    return {
      success: false,
      error: 'Sincronização em massa não existe pro Mercado Livre — sincronize veículo a veículo.',
    }
  }

  let lastError = ''
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body =
        platform === 'mercadolivre'
          ? { veiculo_id: veiculoId, platform: 'mercadolivre', action: 'publish' }
          : veiculoId
            ? { veiculo_id: veiculoId }
            : {}
      const { data, error } = await supabase.functions.invoke(fn, { body })
      if (error) {
        const errMsg = error.message || `Failed to sync with ${platform}.`
        if (
          attempt < MAX_RETRIES &&
          (errMsg.includes('Failed to fetch') || errMsg.includes('Network error'))
        ) {
          lastError = errMsg
          await sleep(RETRY_DELAY_MS * (attempt + 1))
          continue
        }
        return {
          success: false,
          error: errMsg,
          isNetworkError: errMsg.includes('Failed to fetch') || errMsg.includes('Network error'),
        }
      }
      // sync-plataforma (ML) responde {success, message} pra 1 veículo, sem
      // "results" — trata separado de wm-sync (que processa em lote).
      if (platform === 'mercadolivre') {
        if (!data?.success) return { success: false, error: data?.message || `Falha ao sincronizar com ${platform}` }
        return { success: true, processed: 1 }
      }
      if (data && data.error) return { success: false, error: data.error }
      const results: Array<{ status?: string; error?: string }> = Array.isArray(data?.results)
        ? data.results
        : []
      const falhas = results.filter((r) => r.status === 'error')
      if (falhas.length > 0) {
        return {
          success: false,
          processed: data?.processed ?? 0,
          error:
            falhas
              .map((r) => r.error)
              .filter(Boolean)
              .join(' | ') || `Falha ao sincronizar com ${platform}`,
        }
      }
      return { success: true, processed: data?.processed ?? 0 }
    } catch (err: any) {
      const errMsg = err?.message || `Failed to sync with ${platform}.`
      lastError = errMsg
      const isNetwork =
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('Network error') ||
        err?.name === 'TypeError'
      if (attempt < MAX_RETRIES && isNetwork) {
        await sleep(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
      return { success: false, error: errMsg, isNetworkError: isNetwork }
    }
  }
  return { success: false, error: lastError, isNetworkError: true }
}

export async function getPlatformSyncDashboard(platform: string): Promise<PlatformSyncDashboardData> {
  const { data, error } = await supabase.rpc('get_platform_sync_dashboard', {
    p_platform: platform,
  })
  if (error) throw error
  return data as PlatformSyncDashboardData
}

export async function getPlatformVehicles(
  platform: string,
  limit = 20,
): Promise<PlatformVehicleRow[]> {
  if (platform === 'mercadolivre') {
    const { data, error } = await supabase
      .from('ml_listings')
      .select(
        `id, veiculo_id, status, ml_item_id, last_synced_at, veiculos(marca, modelo, ano_modelo, fotos, placa)`,
      )
      .order('last_synced_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    if (error) throw error
    return ((data || []) as any[]).map((row) => ({
      id: row.id,
      veiculo_id: row.veiculo_id,
      status: row.status,
      post_id: row.ml_item_id,
      erro_msg: null,
      updated_at: row.last_synced_at,
      veiculos: row.veiculos,
    }))
  }
  const { data, error } = await supabase
    .from('estoque_publicacoes')
    .select(
      `id, veiculo_id, status, post_id, erro_msg, updated_at, veiculos(marca, modelo, ano_modelo, fotos, placa)`,
    )
    .eq('platform', platform)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as unknown as PlatformVehicleRow[]
}

export async function getPlatformSyncLogs(platform: string, limit = 20): Promise<PlatformSyncLog[]> {
  const { data: plat } = await supabase
    .from('plataformas')
    .select('id')
    .eq('slug', platform)
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
