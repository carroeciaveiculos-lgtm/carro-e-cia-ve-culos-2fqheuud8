import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { Setor, listSetores } from '@/services/setores'

interface SetoresSelectProps {
  selecionados: string[]
  onChange: (setorIds: string[]) => void
}

export function SetoresSelect({ selecionados, onChange }: SetoresSelectProps) {
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSetores().then(({ data }) => {
      setSetores(data)
      setLoading(false)
    })
  }, [])

  const toggle = (setorId: string) => {
    onChange(
      selecionados.includes(setorId)
        ? selecionados.filter((id) => id !== setorId)
        : [...selecionados, setorId],
    )
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border">
      {setores.length === 0 && (
        <p className="text-sm text-muted-foreground col-span-2">Nenhum setor cadastrado ainda.</p>
      )}
      {setores.map((s) => (
        <div
          key={s.id}
          className="flex items-center space-x-3 bg-white p-2 rounded-md border shadow-sm"
        >
          <Checkbox
            id={`setor-${s.id}`}
            checked={selecionados.includes(s.id)}
            onCheckedChange={() => toggle(s.id)}
            className="data-[state=checked]:bg-[#1565C0] data-[state=checked]:border-[#1565C0]"
          />
          <label
            htmlFor={`setor-${s.id}`}
            className="text-sm font-medium leading-none cursor-pointer text-slate-700 flex-1"
          >
            {s.nome}
          </label>
        </div>
      ))}
    </div>
  )
}
