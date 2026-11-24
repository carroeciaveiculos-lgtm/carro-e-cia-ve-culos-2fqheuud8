import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type AgendamentoRow = Database['public']['Tables']['agendamentos_visita']['Row']
type LeadRow = Database['public']['Tables']['leads']['Row']

export type LeadDoAgendamento = Pick<
  LeadRow,
  | 'id'
  | 'nome'
  | 'telefone'
  | 'email'
  | 'origem'
  | 'status'
  | 'temperatura'
  | 'veiculo_interesse'
  | 'forma_pagamento'
  | 'ai_summary'
>

export type Agendamento = AgendamentoRow & {
  leads: LeadDoAgendamento | null
  veiculos: { id: string; marca: string | null; modelo: string | null } | null
}

export const STATUS_AGENDAMENTO = ['agendado', 'realizado', 'nao_compareceu', 'cancelado'] as const

export const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado',
  realizado: 'Compareceu',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
}

export const STATUS_COLOR: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700 border-blue-200',
  realizado: 'bg-green-100 text-green-700 border-green-200',
  cancelado: 'bg-slate-100 text-slate-600 border-slate-200',
  nao_compareceu: 'bg-red-100 text-red-700 border-red-200',
}

const FUSO_LOJA = 'America/Sao_Paulo'

/** Dia do agendamento no horário da loja, no formato `2026-11-12` (chave do calendário). */
export const diaDoAgendamento = (dataHora: string) =>
  new Date(dataHora).toLocaleDateString('en-CA', { timeZone: FUSO_LOJA })

export const horaDoAgendamento = (dataHora: string) =>
  new Date(dataHora).toLocaleTimeString('pt-BR', {
    timeZone: FUSO_LOJA,
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Decide se um agendamento entra no número "( 3 )" que aparece no dia do
 * calendário.
 *
 * Regra da Adriana (12/11/2026): conta TUDO o que foi marcado, inclusive
 * cancelado e "não veio" — o número é o total real de visitas agendadas no
 * dia. Nenhum agendamento é apagado: o resultado fica no `status`, e é dele
 * que saem os relatórios (marcadas x vieram x não vieram).
 */
export const contaNoNumeroDoDia = (_agendamento: Pick<Agendamento, 'status'>) => true

export const listarAgendamentos = async () => {
  const { data, error } = await supabase
    .from('agendamentos_visita')
    .select(
      '*, leads(id, nome, telefone, email, origem, status, temperatura, veiculo_interesse, forma_pagamento, ai_summary), veiculos(id, marca, modelo)',
    )
    .order('data_hora', { ascending: true })
  return { data: (data ?? []) as unknown as Agendamento[], error }
}

export const atualizarStatusAgendamento = async (id: string, status: string) => {
  const { error } = await supabase.from('agendamentos_visita').update({ status }).eq('id', id)
  return { error }
}

/**
 * Resumo para o relatório de agendamentos (A3, 24/11/2026).
 *
 * Regra da Adriana (24/11/2026): VISITA só conta quando o agendamento foi
 * marcado como "Compareceu" (status `realizado`). Remarcar não vira duas
 * visitas — o agendamento antigo fica cancelado e só o que o cliente de fato
 * compareceu entra em "Visitas". Taxa de comparecimento considera só os
 * agendamentos que já têm resultado (veio ou não veio); cancelado e ainda
 * agendado ficam de fora da conta.
 */
export type ResumoAgendamentos = {
  total: number
  visitas: number
  naoVieram: number
  cancelados: number
  aindaAgendados: number
  /** Agendados com data já passada, sem resultado marcado. */
  semResultado: number
  /** 0 a 100, ou null quando ainda não há resultado pra calcular. */
  taxaComparecimento: number | null
}

export const resumirAgendamentos = (
  lista: Pick<Agendamento, 'status' | 'data_hora'>[],
): ResumoAgendamentos => {
  const agora = Date.now()
  const conta = (status: string) => lista.filter((a) => a.status === status).length
  const visitas = conta('realizado')
  const naoVieram = conta('nao_compareceu')
  const comResultado = visitas + naoVieram
  return {
    total: lista.length,
    visitas,
    naoVieram,
    cancelados: conta('cancelado'),
    aindaAgendados: conta('agendado'),
    semResultado: lista.filter(
      (a) => a.status === 'agendado' && new Date(a.data_hora).getTime() < agora,
    ).length,
    taxaComparecimento: comResultado > 0 ? Math.round((visitas / comResultado) * 100) : null,
  }
}
