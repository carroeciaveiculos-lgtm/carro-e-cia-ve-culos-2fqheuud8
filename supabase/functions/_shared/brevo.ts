// Unifica o envio de contato pro Brevo (12/08/2026, achado da auditoria de
// leads): antes, on-lead-created e lead-automation faziam a chamada HTTP pro
// Brevo cada uma do seu jeito — chave de API de fontes diferentes (env var vs
// configuracoes_api no banco) e log de erro em tabelas diferentes
// (logs_integracao vs lead_integracao_log). Se alguém trocasse a chave só no
// admin (configuracoes_api), lead-automation continuaria usando a chave
// antiga da env var, sem avisar ninguém.
//
// Fonte única da API key: configuracoes_api (portal='Brevo'), editável pelo
// admin sem precisar de deploy. Log único: lead_integracao_log (tem lead_id,
// diferente de logs_integracao).

export interface BrevoContactParams {
  email: string
  nome?: string | null
  telefone?: string | null
  listId: number
  attributes?: Record<string, string | number | undefined>
}

export async function getBrevoApiKey(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('configuracoes_api')
    .select('api_key, ativo')
    .eq('portal', 'Brevo')
    .maybeSingle()
  if (!data || !data.ativo || !data.api_key) return null
  return data.api_key
}

export async function enviarContatoBrevo(
  supabase: any,
  leadId: string | null,
  { email, nome, telefone, listId, attributes }: BrevoContactParams,
): Promise<{ success: boolean; brevoContactId?: string; error?: string }> {
  const apiKey = await getBrevoApiKey(supabase)
  if (!apiKey) return { success: false, error: 'Brevo não configurado ou desativado' }

  const firstName = (nome || '').split(' ')[0]
  const lastName = (nome || '').split(' ').slice(1).join(' ')

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      attributes: { NOME: nome, WHATSAPP: telefone, ...attributes },
      listIds: [listId],
      updateEnabled: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    await supabase.from('lead_integracao_log').insert({
      lead_id: leadId,
      ferramenta: 'brevo',
      acao: 'erro_criacao',
      status_code: res.status,
      mensagem_erro: err,
    })
    return { success: false, error: err }
  }

  const data = await res.json().catch(() => ({}))
  await supabase.from('lead_integracao_log').insert({
    lead_id: leadId,
    ferramenta: 'brevo',
    acao: 'contato_criado',
    status_code: res.status,
  })
  return { success: true, brevoContactId: data.id?.toString() }
}
