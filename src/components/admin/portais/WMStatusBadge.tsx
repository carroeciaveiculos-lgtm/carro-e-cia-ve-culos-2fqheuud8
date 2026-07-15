import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react'

interface Props {
  status: string | null
}

export function WMStatusBadge({ status }: Props) {
  const normalized = (status || '').toLowerCase()

  const config: Record<string, { icon: any; label: string; className: string }> = {
    publicado: { icon: CheckCircle2, label: 'Publicado', className: 'bg-green-100 text-green-700' },
    active: { icon: CheckCircle2, label: 'Ativo', className: 'bg-green-100 text-green-700' },
    agendado: { icon: Clock, label: 'Agendado', className: 'bg-yellow-100 text-yellow-700' },
    pending: { icon: Clock, label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
    pending_create: { icon: Clock, label: 'Criando', className: 'bg-yellow-100 text-yellow-700' },
    pending_update: {
      icon: Clock,
      label: 'Atualizando',
      className: 'bg-yellow-100 text-yellow-700',
    },
    pending_close: { icon: Clock, label: 'Removendo', className: 'bg-yellow-100 text-yellow-700' },
    error: { icon: AlertCircle, label: 'Erro', className: 'bg-red-100 text-red-700' },
    erro: { icon: AlertCircle, label: 'Erro', className: 'bg-red-100 text-red-700' },
    despublicado: { icon: XCircle, label: 'Despublicado', className: 'bg-gray-100 text-gray-600' },
  }

  const c = config[normalized] || {
    icon: XCircle,
    label: status || 'Desconhecido',
    className: 'bg-gray-100 text-gray-600',
  }
  const Icon = c.icon

  return (
    <Badge className={`${c.className} gap-1 border-none text-[10px]`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </Badge>
  )
}
