// Trava de duplicidade de lead por telefone/email (12/08/2026, pedido da
// Adriana — achado da auditoria: cada ponto de entrada checava duplicado do
// seu próprio jeito, ou não checava nada, e o mesmo cliente virava vários
// leads soltos, cada um dando início a uma conversa nova com a Clara (SDR IA).
//
// Regra: se já existe um lead ATIVO (status != 'fechado'/'perdido') com o
// mesmo telefone (ou e-mail, se não tiver telefone), reaproveita esse lead em
// vez de criar um novo — mesmo padrão que já existia só pros webhooks da Meta
// em receive-leads. Se o lead encontrado já está fechado ou perdido, cria um
// novo (é um ciclo de venda diferente).

export function normalizarTelefone(telefone: string | null | undefined): string {
  return (telefone || '').replace(/\D/g, '')
}

const STATUS_TERMINAIS = ['fechado', 'perdido']

export async function encontrarLeadAtivo(
  supabase: any,
  { telefone, email }: { telefone?: string | null; email?: string | null },
): Promise<{ id: string; status: string | null; observacoes: string | null } | null> {
  const telefoneNormalizado = normalizarTelefone(telefone)

  if (telefoneNormalizado) {
    const { data } = await supabase
      .from('leads')
      .select('id, status, observacoes')
      .eq('telefone', telefoneNormalizado)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data && !STATUS_TERMINAIS.includes(data.status)) return data
  }

  if (email) {
    const { data } = await supabase
      .from('leads')
      .select('id, status, observacoes')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data && !STATUS_TERMINAIS.includes(data.status)) return data
  }

  return null
}

// Anexa uma nota de "novo contato" às observações existentes, sem apagar
// histórico — quem vê o lead no Kanban precisa saber que o cliente voltou.
export function anexarNotaContato(observacoesAtuais: string | null, origem: string): string {
  const nota = `[${new Date().toISOString().slice(0, 16).replace('T', ' ')}] Novo contato recebido via ${origem} — lead reaproveitado (mesmo telefone/e-mail).`
  return observacoesAtuais ? `${observacoesAtuais}\n${nota}` : nota
}
