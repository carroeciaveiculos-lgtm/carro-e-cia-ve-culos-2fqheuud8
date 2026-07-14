import { cn } from '@/lib/utils'

interface Props {
  score: number
  size?: 'sm' | 'md'
}

export function AdQualityBadge({ score, size = 'sm' }: Props) {
  const dotColor = score >= 80 ? 'bg-green-500' : score >= 41 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor =
    score >= 80 ? 'text-green-700' : score >= 41 ? 'text-yellow-700' : 'text-red-700'
  const bgColor = score >= 80 ? 'bg-green-50' : score >= 41 ? 'bg-yellow-50' : 'bg-red-50'

  return (
    <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 shrink-0', bgColor)}>
      <div className={cn('w-2 h-2 rounded-full', dotColor)} />
      <span className={cn('font-bold', size === 'sm' ? 'text-xs' : 'text-sm', textColor)}>
        {score}
      </span>
    </div>
  )
}
