// Reserva atômica da criação de anúncio no Mercado Livre.
//
// Achado real 09/10/2026 (Yaris RTX3J06): a mesma publicação foi processada duas vezes ao mesmo
// tempo (19 ms de diferença) e criou DOIS anúncios ativos (MLB7769296652 e MLB7769296654). Cada
// execução leu "sem ml_item_id" e deu POST; no fim o upsert por veiculo_id da segunda sobrescreveu o
// vínculo e a primeira virou anúncio órfão (preço antigo, que ninguém mais atualizava).
//
// Quem for criar anúncio chama claimMLCreate ANTES do POST. O UPDATE condicional é atômico no
// Postgres: só um chamador consegue mudar a linha para 'creating'. O outro recebe ok:false e NÃO cria.
// A reserva vence sozinha depois de CLAIM_TTL_MS, para uma execução que caiu no meio não travar o
// veículo para sempre.

export const CLAIM_TTL_MS = 5 * 60 * 1000

export type ResultadoClaim =
  | { ok: true }
  | { ok: false; motivo: 'em_andamento' }
  | { ok: false; motivo: 'ja_criado'; itemId: string }

export async function claimMLCreate(
  supabase: any,
  veiculoId: string,
  itemIdAntes: string | null,
): Promise<ResultadoClaim> {
  const agora = new Date().toISOString()
  const limite = new Date(Date.now() - CLAIM_TTL_MS).toISOString()

  const { data: reservado } = await supabase
    .from('ml_listings')
    .update({ status: 'creating', last_synced_at: agora })
    .eq('veiculo_id', veiculoId)
    .or(`status.neq.creating,last_synced_at.lt.${limite}`)
    .select('id, ml_item_id')

  if (reservado && reservado.length > 0) {
    // Outra execução pode ter terminado entre a leitura de quem chamou e a reserva: se a linha
    // ganhou um anúncio novo nesse intervalo, devolve a linha ao normal e NÃO cria outro.
    const atual = reservado[0].ml_item_id ?? null
    if (atual && atual !== itemIdAntes) {
      await supabase
        .from('ml_listings')
        .update({ status: 'active', last_synced_at: agora })
        .eq('veiculo_id', veiculoId)
      return { ok: false, motivo: 'ja_criado', itemId: atual }
    }
    return { ok: true }
  }

  const { data: existe } = await supabase
    .from('ml_listings')
    .select('id')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()
  if (existe) return { ok: false, motivo: 'em_andamento' }

  // Sem linha ainda: o índice único em veiculo_id garante um único vencedor.
  const { error } = await supabase
    .from('ml_listings')
    .insert({ veiculo_id: veiculoId, status: 'creating', last_synced_at: agora })
  return error ? { ok: false, motivo: 'em_andamento' } : { ok: true }
}
