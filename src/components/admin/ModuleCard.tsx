import { LucideIcon } from 'lucide-react'

interface ModuleCardProps {
  icon: LucideIcon
  line1: string
  line2: string
  isNew?: boolean
  badgeText?: string
  onClick: () => void
}

export function ModuleCard({
  icon: Icon,
  line1,
  line2,
  isNew,
  badgeText,
  onClick,
}: ModuleCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-[30px_20px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg relative min-h-[160px] shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
    >
      {isNew && (
        <span className="absolute top-3 right-3 bg-[#C62828] text-white text-[10px] font-bold px-2 py-0.5 rounded">
          NOVO
        </span>
      )}
      {badgeText && (
        <span className="absolute top-3 right-3 bg-[#E3F2FD] text-[#1565C0] text-[10px] font-bold px-2 py-0.5 rounded border border-[#1565C0]/20">
          {badgeText}
        </span>
      )}
      <Icon className="w-16 h-16 text-[#1565C0] mb-4" strokeWidth={1.5} />
      <div className="text-center">
        <h3 className="text-[14px] font-bold text-[#1565C0] uppercase tracking-wide">{line1}</h3>
        <p className="text-[13px] text-[#1565C0]">{line2}</p>
      </div>
    </div>
  )
}
