import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchTodosMotivosPerdaAtivos } from '@/lib/motivos-perda'

interface MotivoPerdaModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: (motivo: string) => void
}

// Aberto quando um lead é arrastado pra coluna "Perdido" no Kanban (pedido
// da Adriana, 15/09/2026) — só aplica a mudança de status depois de
// escolher o motivo. Cancelar não move o card (a chamada de status fica
// pendente até confirmar aqui).
export function MotivoPerdaModal({ open, onCancel, onConfirm }: MotivoPerdaModalProps) {
  const [motivos, setMotivos] = useState<string[]>([])
  const [selecionado, setSelecionado] = useState('')

  useEffect(() => {
    if (open) {
      setSelecionado('')
      fetchTodosMotivosPerdaAtivos().then(setMotivos)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Por que esse lead foi perdido?</DialogTitle>
        </DialogHeader>
        <Select value={selecionado} onValueChange={setSelecionado}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha o motivo" />
          </SelectTrigger>
          <SelectContent>
            {motivos.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(selecionado)} disabled={!selecionado}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
