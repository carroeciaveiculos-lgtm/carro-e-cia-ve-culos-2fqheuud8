import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle } from 'lucide-react'

export interface SyncFailure {
  vehicleId: string
  vehicleName: string
  error: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  failures: SyncFailure[]
}

export function SyncFailureModal({ open, onOpenChange, failures }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Falhas na Sincronização
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {failures.length} veículo(s) falharam durante a sincronização:
            </p>
            {failures.map((f) => (
              <div key={f.vehicleId} className="border rounded-lg p-3 bg-red-50">
                <p className="font-medium text-sm text-gray-800">{f.vehicleName}</p>
                <p className="text-xs text-gray-500 mt-0.5">ID: {f.vehicleId}</p>
                <p className="text-xs text-red-700 mt-1 break-words">{f.error}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
