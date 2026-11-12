import { Button } from '@/components/ui/button'
import { Check, X, CalendarX2 } from 'lucide-react'

type Props = {
  status: string
  desabilitado?: boolean
  onMudar: (status: string) => void
}

/** Botões de resultado da visita — usados na lista e na janela do dia. */
export function AcoesAgendamento({ status, desabilitado, onMudar }: Props) {
  if (status !== 'agendado') {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled={desabilitado}
        className="h-7 px-2 text-slate-400"
        onClick={() => onMudar('agendado')}
      >
        Reabrir
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={desabilitado}
        className="h-7 px-2 text-green-700 border-green-200 hover:bg-green-50"
        onClick={() => onMudar('realizado')}
      >
        <Check className="w-3.5 h-3.5 mr-1" /> Compareceu
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={desabilitado}
        className="h-7 px-2 text-red-700 border-red-200 hover:bg-red-50"
        onClick={() => onMudar('nao_compareceu')}
      >
        <CalendarX2 className="w-3.5 h-3.5 mr-1" /> Não veio
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={desabilitado}
        className="h-7 px-2 text-slate-600"
        onClick={() => onMudar('cancelado')}
      >
        <X className="w-3.5 h-3.5 mr-1" /> Cancelar
      </Button>
    </div>
  )
}
