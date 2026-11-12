import { Link } from 'react-router-dom'
import { MessageSquare, Phone, Mail, Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  type Agendamento,
  STATUS_COLOR,
  STATUS_LABEL,
  horaDoAgendamento,
} from '@/services/agendamentos'
import { AcoesAgendamento } from './AcoesAgendamento'

type Props = {
  /** Dia no formato `2026-11-12`; `null` fecha a janela. */
  dia: string | null
  agendamentos: Agendamento[]
  atualizandoId: string | null
  onFechar: () => void
  onMudarStatus: (id: string, status: string) => void
}

const tituloDoDia = (dia: string) => {
  const [ano, mes, d] = dia.split('-').map(Number)
  return new Date(ano, mes - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div>
      <dt className="text-xs text-slate-400">{rotulo}</dt>
      <dd className="text-sm text-slate-700 capitalize">{valor}</dd>
    </div>
  )
}

export function AgendamentosDoDia({
  dia,
  agendamentos,
  atualizandoId,
  onFechar,
  onMudarStatus,
}: Props) {
  return (
    <Dialog open={dia !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">{dia ? tituloDoDia(dia) : ''}</DialogTitle>
          <DialogDescription>
            {agendamentos.length === 0
              ? 'Nenhum agendamento neste dia com os filtros escolhidos.'
              : `${agendamentos.length} agendamento${agendamentos.length > 1 ? 's' : ''} neste dia.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {agendamentos.map((a) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {horaDoAgendamento(a.data_hora)}
                  </span>
                  <span className="text-sm text-slate-500 capitalize">{a.tipo}</span>
                </div>
                <Badge variant="outline" className={STATUS_COLOR[a.status] || ''}>
                  {STATUS_LABEL[a.status] || a.status}
                </Badge>
              </div>

              <div className="mt-3">
                <div className="font-medium text-slate-800">{a.leads?.nome || 'Sem nome'}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {a.leads?.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {a.leads.telefone}
                    </span>
                  )}
                  {a.leads?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {a.leads.email}
                    </span>
                  )}
                  {a.veiculos && (
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> {a.veiculos.marca} {a.veiculos.modelo}
                    </span>
                  )}
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Dado rotulo="Origem" valor={a.leads?.origem} />
                <Dado rotulo="Etapa do lead" valor={a.leads?.status?.replace(/_/g, ' ')} />
                <Dado rotulo="Temperatura" valor={a.leads?.temperatura} />
                <Dado rotulo="Pagamento" valor={a.leads?.forma_pagamento} />
              </dl>

              {!a.veiculos && a.leads?.veiculo_interesse && (
                <p className="mt-3 text-sm text-slate-600">
                  <span className="text-slate-400">Interesse: </span>
                  {a.leads.veiculo_interesse}
                </p>
              )}
              {a.observacoes && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="text-slate-400">Observações: </span>
                  {a.observacoes}
                </p>
              )}
              {a.leads?.ai_summary && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="text-slate-400">Resumo da Clara: </span>
                  {a.leads.ai_summary}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <Button asChild size="sm" variant="outline" className="h-7">
                  <Link to={`/admin/conversas?lead_id=${a.lead_id}`}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Ir para a conversa
                  </Link>
                </Button>
                <AcoesAgendamento
                  status={a.status}
                  desabilitado={atualizandoId === a.id}
                  onMudar={(status) => onMudarStatus(a.id, status)}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
