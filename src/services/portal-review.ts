import { supabase } from '@/lib/supabase/client'
import { translateError } from '@/lib/platform-errors'

export interface SyncErrorDetail {
  id: string
  acao: string
  status: string
  mensagem: string | null
  metadata: any
  created_at: string | null
  translatedMessage: string
  translatedAction: string
}

export interface PublicacaoErrorDetail {
  id: string
  platform: string
  status: string | null
  erro_msg: string | null
  updated_at: string | null
  translatedMessage: string
  translatedAction: string
}

export interface ReviewVehicle {
  id: string
  marca: string
  modelo: string
  versao: string | null
  ano_modelo: number | null
  placa: string | null
  preco_venda: number | null
  fotos: string[] | null
  status: string | null
  requires_review: boolean | null
  em_preparacao: boolean | null
  ml_listing_type: string | null
  syncErrors: SyncErrorDetail[]
  publicacaoErrors: PublicacaoErrorDetail[]
}

const VEHICLE_FIELDS =
  'id, marca, modelo, versao, ano_modelo, placa, preco_venda, fotos, status, requires_review, em_preparacao, ml_listing_type'

export async function fetchReviewVehicles(): Promise<ReviewVehicle[]> {
  const { data: reviewVehicles } = await supabase
    .from('veiculos')
    .select(VEHICLE_FIELDS)
    .or('requires_review.eq.true,em_preparacao.eq.true')
    .limit(30)

  const { data: syncErrorLogs } = await supabase
    .from('sync_log')
    .select('veiculo_id')
    .eq('status', 'erro')
    .not('veiculo_id', 'is', null)

  const syncErrorIds = new Set(
    (syncErrorLogs || []).map((l) => l.veiculo_id).filter(Boolean) as string[],
  )
  const reviewIds = new Set((reviewVehicles || []).map((v) => v.id))
  const allIds = [...new Set([...reviewIds, ...syncErrorIds])]

  if (allIds.length === 0) return []

  const { data: vehicles } = await supabase
    .from('veiculos')
    .select(VEHICLE_FIELDS)
    .in('id', allIds)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (!vehicles || vehicles.length === 0) return []

  const { data: syncLogs } = await supabase
    .from('sync_log')
    .select('id, veiculo_id, acao, status, mensagem, metadata, created_at')
    .in('veiculo_id', allIds)
    .in('status', ['erro', 'warning'])
    .order('created_at', { ascending: false })

  const { data: pubErrors } = await supabase
    .from('estoque_publicacoes')
    .select('id, veiculo_id, platform, status, erro_msg, updated_at')
    .in('veiculo_id', allIds)
    .not('erro_msg', 'is', null)
    .neq('erro_msg', '')

  const syncMap: Record<string, SyncErrorDetail[]> = {}
  const seenSyncErrors = new Set<string>()
  for (const log of syncLogs || []) {
    if (!log.veiculo_id) continue
    const dedupKey = `${log.veiculo_id}-${log.mensagem}`
    if (seenSyncErrors.has(dedupKey)) continue
    seenSyncErrors.add(dedupKey)
    if (!syncMap[log.veiculo_id]) syncMap[log.veiculo_id] = []
    const translated = translateError(log.mensagem || '')
    syncMap[log.veiculo_id].push({
      id: log.id,
      acao: log.acao,
      status: log.status,
      mensagem: log.mensagem,
      metadata: log.metadata,
      created_at: log.created_at,
      translatedMessage: translated.message,
      translatedAction: translated.action,
    })
  }

  const pubMap: Record<string, PublicacaoErrorDetail[]> = {}
  const seenPubErrors = new Set<string>()
  for (const pub of pubErrors || []) {
    const dedupKey = `${pub.veiculo_id}-${pub.erro_msg}`
    if (seenPubErrors.has(dedupKey)) continue
    seenPubErrors.add(dedupKey)
    if (!pubMap[pub.veiculo_id]) pubMap[pub.veiculo_id] = []
    const translated = translateError(pub.erro_msg || '')
    pubMap[pub.veiculo_id].push({
      id: pub.id,
      platform: pub.platform,
      status: pub.status,
      erro_msg: pub.erro_msg,
      updated_at: pub.updated_at,
      translatedMessage: translated.message,
      translatedAction: translated.action,
    })
  }

  return vehicles.map((v) => ({
    ...v,
    fotos: Array.isArray(v.fotos) ? v.fotos : [],
    syncErrors: syncMap[v.id] || [],
    publicacaoErrors: pubMap[v.id] || [],
  }))
}

export async function manualResync(
  veiculoId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.functions.invoke('ml-sync', {
    method: 'POST',
    body: { veiculo_id: veiculoId },
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
