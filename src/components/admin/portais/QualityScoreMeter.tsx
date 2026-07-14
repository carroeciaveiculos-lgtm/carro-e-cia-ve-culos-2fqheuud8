import { Lock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  score: number
  missingItems?: string[]
  size?: 'sm' | 'md'
}

export function QualityScoreMeter({ score, missingItems = [], size = 'sm' }: Props) {
  const isReady = score === 100
  const dotColor = score >= 80 ? 'bg-green-500' : score >= 41 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor =
    score >= 80 ? 'text-green-700' : score >= 41 ? 'text-yellow-700' : 'text-red-700'
  const bgColor = score >= 80 ? 'bg-green-50' : score >= 41 ? 'bg-yellow-50' : 'bg-red-50'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  if (isReady) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2 py-0.5 shrink-0 bg-green-100',
          textSize,
        )}
      >
        <Lock className="w-3 h-3 text-green-600" />
        <span className="font-bold text-green-700">Apto</span>
      </div>
    )
  }

  const tooltip =
    missingItems.length > 0 ? `Faltando: ${missingItems.join(', ')}` : 'Pontos abaixo do ideal'

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2 py-0.5 shrink-0 cursor-help',
        bgColor,
        textSize,
      )}
      title={tooltip}
    >
      <AlertTriangle className={cn('w-3 h-3', textColor)} />
      <span className={cn('font-bold', textColor)}>{score}</span>
    </div>
  )
}
