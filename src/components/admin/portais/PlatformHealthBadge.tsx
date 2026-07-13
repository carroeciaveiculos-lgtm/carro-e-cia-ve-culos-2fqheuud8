import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  status: string
  ultimoErro?: string | null
}

export function PlatformHealthBadge({ status, ultimoErro }: Props) {
  const config = {
    conectado: { icon: CheckCircle2, label: 'Conectado', className: 'bg-green-100 text-green-700' },
    expirando: {
      icon: AlertTriangle,
      label: 'Expirando',
      className: 'bg-amber-100 text-amber-700',
    },
    erro: { icon: XCircle, label: 'Erro', className: 'bg-red-100 text-red-700' },
    sincronizando: {
      icon: Loader2,
      label: 'Sincronizando',
      className: 'bg-blue-100 text-blue-700',
    },
    desconectado: { icon: XCircle, label: 'Desconectado', className: 'bg-gray-100 text-gray-600' },
  }
  const c = config[status as keyof typeof config] || config.desconectado
  const Icon = c.icon

  return (
    <Badge className={`${c.className} gap-1 border-none`}>
      <Icon className={`w-3 h-3 ${status === 'sincronizando' ? 'animate-spin' : ''}`} />
      {c.label}
    </Badge>
  )
}
