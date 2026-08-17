import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { Setor, listSetores, criarSetor } from '@/services/setores'
import { useToast } from '@/hooks/use-toast'

interface SetoresSelectProps {
  selecionados: string[]
  onChange: (setorIds: string[]) => void
}

export function SetoresSelect({ selecionados, onChange }: SetoresSelectProps) {
  const { toast } = useToast()
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [novoSetor, setNovoSetor] = useState('')
  const [criando, setCriando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const { data } = await listSetores()
    setSetores(data)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const toggle = (setorId: string) => {
    onChange(
      selecionados.includes(setorId)
        ? selecionados.filter((id) => id !== setorId)
        : [...selecionados, setorId],
    )
  }

  const handleCriarSetor = async () => {
    if (!novoSetor.trim()) return
    setCriando(true)
    const { data, error } = await criarSetor(novoSetor.trim())
    setCriando(false)
    if (error || !data) {
      toast({
        title: 'Erro ao criar setor',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
      return
    }
    setSetores((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
    onChange([...selecionados, data.id])
    setNovoSetor('')
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  }

  return (
    <div className="space-y-3">
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

      <div className="flex gap-2">
        <Input
          placeholder="Nome do novo setor"
          value={novoSetor}
          onChange={(e) => setNovoSetor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCriarSetor()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCriarSetor}
          disabled={criando || !novoSetor.trim()}
        >
          {criando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
