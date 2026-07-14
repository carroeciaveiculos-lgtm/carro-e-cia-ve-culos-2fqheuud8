import { supabase } from '@/lib/supabase/client'
import { toggleVehiclePublication, type PublicacaoStatus } from './plataformas'

export async function fetchPublicacoes(
  veiculoIds: string[],
): Promise<Record<string, PublicacaoStatus[]>> {
  if (veiculoIds.length === 0) return {}
  const { data, error } = await supabase
    .from('estoque_publicacoes')
    .select('id, veiculo_id, platform, status, erro_msg, publicado_em, updated_at, url_publicacao')
    .in('veiculo_id', veiculoIds)
  if (error || !data) return {}
  const map: Record<string, PublicacaoStatus[]> = {}
  for (const pub of data as unknown as PublicacaoStatus[]) {
    if (!map[pub.veiculo_id]) map[pub.veiculo_id] = []
    map[pub.veiculo_id].push(pub)
  }
  return map
}

export async function bulkPublish(
  veiculoIds: string[],
  platformSlugs: string[],
): Promise<{ success: number; failed: number }> {
  const promises = veiculoIds.flatMap((vid) =>
    platformSlugs.map((slug) => toggleVehiclePublication(slug, vid, true).catch(() => null)),
  )
  const results = await Promise.allSettled(promises)
  const failed = results.filter((r) => r.status === 'rejected').length
  return { success: results.length - failed, failed }
}

export async function bulkUnpublish(
  veiculoIds: string[],
  platformSlugs: string[],
): Promise<{ success: number; failed: number }> {
  const promises = veiculoIds.flatMap((vid) =>
    platformSlugs.map((slug) => toggleVehiclePublication(slug, vid, false).catch(() => null)),
  )
  const results = await Promise.allSettled(promises)
  const failed = results.filter((r) => r.status === 'rejected').length
  return { success: results.length - failed, failed }
}

export async function bulkDelete(veiculoIds: string[]): Promise<void> {
  await supabase.from('leads').update({ veiculo_id: null }).in('veiculo_id', veiculoIds)
  await supabase.from('notas_fiscais').update({ veiculo_id: null }).in('veiculo_id', veiculoIds)
  const { error } = await supabase.from('veiculos').delete().in('id', veiculoIds)
  if (error) throw error
}

export async function checkPlateDuplicity(placa: string, excludeId?: string): Promise<boolean> {
  if (!placa) return false
  let query = supabase.from('veiculos').select('id').eq('placa', placa)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return !!data
}
