import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { PlataformaDashboard } from '@/services/plataformas'

interface Props {
  dashboard: PlataformaDashboard | null
}

export function PlatformStatsBar({ dashboard }: Props) {
  const stats = [
    {
      label: 'Anúncios Ativos',
      value: dashboard?.ativos ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    { label: 'Pendentes', value: dashboard?.pendentes ?? 0, icon: Clock, color: 'text-amber-600' },
    { label: 'Erros', value: dashboard?.erros ?? 0, icon: AlertCircle, color: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-gray-200">
          <CardContent className="p-3 flex items-center gap-2">
            <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none">{s.value}</p>
              <p className="text-[10px] text-gray-500 truncate">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
