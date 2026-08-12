import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Lead = Database['public']['Tables']['leads']['Row']

export const getLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

const STATUS_TERMINAIS = ['fechado', 'perdido']

// Trava de duplicidade (12/08/2026, achado da auditoria de leads): antes,
// cada preenchimento de formulário virava um lead novo, mesmo com o mesmo
// telefone de um lead ainda ativo — e cada um disparava uma conversa nova com
// a Clara (SDR IA) do zero, mandando WhatsApp de boas-vindas duplicado pro
// mesmo cliente. Agora, se já existe um lead ativo (não fechado/perdido) com
// o mesmo telefone ou e-mail, reaproveita esse lead em vez de criar outro —
// e não dispara e-mail/Brevo/Clara de novo, só anota o novo contato.
async function encontrarLeadAtivo(telefone?: string | null, email?: string | null) {
  const telefoneNormalizado = (telefone || '').replace(/\D/g, '')

  if (telefoneNormalizado) {
    const { data } = await supabase
      .from('leads')
      .select('id, status, observacoes')
      .eq('telefone', telefoneNormalizado)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data && !STATUS_TERMINAIS.includes(data.status || '')) return data
  }

  if (email) {
    const { data } = await supabase
      .from('leads')
      .select('id, status, observacoes')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data && !STATUS_TERMINAIS.includes(data.status || '')) return data
  }

  return null
}

export const createLead = async (
  lead: Database['public']['Tables']['leads']['Insert'] & { cta_type?: string },
) => {
  const telefoneNormalizado = (lead.telefone || '').replace(/\D/g, '')
  const leadExistente = await encontrarLeadAtivo(telefoneNormalizado, lead.email)

  if (leadExistente) {
    const nota = `[${new Date().toISOString().slice(0, 16).replace('T', ' ')}] Novo contato recebido via ${lead.origem || 'site'} — lead reaproveitado (mesmo telefone/e-mail).`
    const { data, error } = await supabase
      .from('leads')
      .update({
        veiculo_interesse: lead.veiculo_interesse || undefined,
        observacoes: leadExistente.observacoes ? `${leadExistente.observacoes}\n${nota}` : nota,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', leadExistente.id)
      .select()
      .single()

    if (data && !error) {
      // Só o alerta interno — sem repetir boas-vindas/Brevo/Clara pra quem já
      // está em conversa ativa.
      supabase.functions
        .invoke('send-lead-email', {
          body: {
            nome: data.nome,
            telefone: data.telefone,
            email: data.email,
            mensagem: `Cliente já tinha lead ativo — novo contato: ${data.observacoes}`,
            origem: data.origem,
            veiculo: data.veiculo_interesse,
          },
        })
        .catch(console.error)
    }

    return { data, error }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([lead as any])
    .select()
    .single()

  if (data && !error) {
    // Alerta interno
    supabase.functions
      .invoke('send-lead-email', {
        body: {
          nome: data.nome,
          telefone: data.telefone,
          email: data.email,
          mensagem: data.observacoes,
          origem: data.origem,
          veiculo: data.veiculo_interesse,
        },
      })
      .catch(console.error)

    // Dispara gatilho do CRM (Boas-vindas e Brevo)
    supabase.functions.invoke('on-lead-created', { body: data }).catch(console.error)

    // Trigger AI SDR Orchestrator
    supabase.functions
      .invoke('ai-sdr', {
        body: {
          action: 'init_conversation',
          lead_id: data.id,
          source: data.origem || 'site',
          veiculo: data.veiculo_interesse,
        },
      })
      .catch(console.error)
  }

  return { data, error }
}

export const updateLeadStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteLead = async (id: string) => {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  return { error }
}
