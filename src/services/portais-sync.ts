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
    .order('updated_at', { ascending: false })
  if (error || !data) return {}
  // Achado 19/09/2026 (caso real: Jaguar F-Pace): estoque_publicacoes não
  // garante uma linha só por veículo+plataforma — sincronizações antigas
  // (erro) ficam acumuladas junto com a mais recente (sucesso). O card lia
  // a primeira linha que encontrasse pra cada plataforma, sem olhar pra
  // data, então podia continuar mostrando um erro de dias atrás mesmo
  // depois de uma sincronização nova ter dado certo. Ordenado por
  // updated_at desc acima, então a primeira ocorrência de cada combinação
  // veiculo+plataforma já é a mais recente — descarta o resto.
  const vistos = new Set<string>()
  const map: Record<string, PublicacaoStatus[]> = {}
  for (const pub of data as unknown as PublicacaoStatus[]) {
    const chave = `${pub.veiculo_id}|${pub.platform}`
    if (vistos.has(chave)) continue
    vistos.add(chave)
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
