import { createClient } from 'jsr:@supabase/supabase-js@2'
import { fetchWithBackoff } from '../_shared/ml-client.ts'

type SupabaseClient = ReturnType<typeof createClient>

export async function fetchAndStorePerformance(
  supabase: SupabaseClient,
  token: string,
  mlItemId: string,
  veiculoId: string,
): Promise<void> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const res = await fetchWithBackoff(
      `https://api.mercadolibre.com/items/${mlItemId}/performance`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return
    const data = await res.json()
    const score = typeof data.score === 'number' ? data.score : null
    const level = data.level || null

    if (score !== null) {
      await supabase.from('ml_quality_scores').insert({
        ml_item_id: mlItemId,
        score,
        level,
        veiculo_id: veiculoId,
        checked_at: new Date().toISOString(),
      })

      if (score < 70) {
        const { data: veiculo } = await supabase
          .from('veiculos')
          .select('marca, modelo')
          .eq('id', veiculoId)
          .maybeSingle()

        const veiculoNome = veiculo
          ? `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim()
          : 'Veículo'

        await supabase.from('notificacoes').insert({
          tipo: 'ml_low_performance',
          titulo: 'Qualidade do anúncio baixa',
          mensagem: `${veiculoNome} tem score ${score} — abaixo do ideal.`,
        })

        const { data: vehicle } = await supabase
          .from('veiculos')
          .select('notas_internas')
          .eq('id', veiculoId)
          .maybeSingle()

        const existingNotes = vehicle?.notas_internas || ''
        const note = `ML Performance Score: ${score}/100 — requires optimization`
        if (!existingNotes.includes(note)) {
          await supabase
            .from('veiculos')
            .update({
              requires_review: true,
              notas_internas: existingNotes ? `${existingNotes}\n${note}` : note,
            })
            .eq('id', veiculoId)
        }
      }
    }
  } catch {
    // Performance fetch is non-critical
  }
}
