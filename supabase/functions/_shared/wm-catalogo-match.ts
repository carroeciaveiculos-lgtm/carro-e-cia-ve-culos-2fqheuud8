// Match exato (case-insensitive) contra o catálogo Webmotors de cor/câmbio/
// combustível. Compara contra as DUAS colunas de nome (nome_wm e nome_crm)
// porque o CRM tem grafias concorrentes pro mesmo valor (ex.: "PRETA" vs
// "preto"). Devolve sempre nome_wm — é o termo que vai no XML da Webmotors.
//
// Extraído de wm-mapear-veiculo em 20/08/2026 e reaproveitado também em
// wm-confirmar-mapeamento: até então essa função só existia lá, e
// wm-confirmar-mapeamento (confirmação manual de modelo/versão numa revisão)
// nunca rodava esse match — deixava codigo_cor_wm/codigo_cambio_wm/
// codigo_combustivel_wm vazios mesmo com o mapeamento marcado como
// "confirmado manualmente", e o guard em wm-sync bloqueava a publicação
// sem erro claro nenhum na hora da confirmação.
export async function matchCatalogoExato(
  supabase: any,
  tabela: string,
  valor: string | null | undefined,
): Promise<{ codigo_wm: string; nome_wm: string } | null> {
  if (!valor) return null
  const alvo = valor.trim().toLowerCase()
  if (!alvo) return null
  const { data } = await supabase.from(tabela).select('codigo_wm, nome_wm, nome_crm')
  const achado = (data || []).find(
    (r: any) =>
      (r.nome_crm || '').trim().toLowerCase() === alvo ||
      (r.nome_wm || '').trim().toLowerCase() === alvo,
  )
  return achado ? { codigo_wm: achado.codigo_wm, nome_wm: achado.nome_wm } : null
}
