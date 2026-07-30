import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PublishStatus = 'pending' | 'published' | 'error' | 'not_published' | 'syncing'

interface PublishStatusBadgeProps {
  status: PublishStatus
  platform?: string
  className?: string
}

const STATUS_CONFIG: Record<PublishStatus, { label: string; variant: string; icon: any }> = {
  pending: {
    label: 'Pendente',
    variant: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  published: {
    label: 'Publicado',
    variant: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  error: { label: 'Erro', variant: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  not_published: {
    label: 'Não publicado',
    variant: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: XCircle,
  },
  syncing: {
    label: 'Sincronizando',
    variant: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Clock,
  },
}

export function PublishStatusBadge({ status, platform, className }: PublishStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_published
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', config.variant, className)}>
      <Icon className="h-3 w-3" />
      {platform ? `${platform}: ` : ''}
      {config.label}
    </Badge>
  )
}

export function getPublishStatus(
  publicado: boolean | null,
  hasError: boolean | null,
  emPreparacao: boolean | null,
): PublishStatus {
  if (hasError) return 'error'
  if (publicado) return 'published'
  if (emPreparacao) return 'syncing'
  return 'pending'
}
