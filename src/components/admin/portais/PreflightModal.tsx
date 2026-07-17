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
import type { PreflightIssue } from '@/lib/ml-preflight'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: PreflightIssue[]
  onProceed: () => void
}

export function PreflightModal({ open, onOpenChange, results, onProceed }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Validação Pré-Sincronização - Mercado Livre
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {results.length} veículo(s) com pendências para sincronização com o Mercado Livre:
            </p>
            {results.map((r) => (
              <div key={r.vehicleId} className="border rounded-lg p-3 bg-amber-50">
                <p className="font-medium text-sm text-gray-800">{r.vehicleName}</p>
                <ul className="list-disc pl-5 mt-1 text-xs text-amber-700 space-y-0.5">
                  {r.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onProceed}>Sincronizar Mesmo Assim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
