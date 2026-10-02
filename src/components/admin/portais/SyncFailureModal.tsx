import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Wrench } from 'lucide-react'
import type { PlataformaMapeavel } from '@/lib/mapeamento-catalogo'

export interface SyncFailure {
  vehicleId: string
  vehicleName: string
  error: string
  // Preenchidos quando a falha é de mapeamento de catálogo e dá pra resolver
  // na hora (Webmotors / NaPista) — ver MapeamentoCatalogoDialog.
  platform?: PlataformaMapeavel
  precisaMapeamento?: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  failures: SyncFailure[]
  onResolverMapeamento?: (failure: SyncFailure) => void
}

export function SyncFailureModal({ open, onOpenChange, failures, onResolverMapeamento }: Props) {
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
              {failures.length} tentativa(s) de sincronização falharam (um veículo pode aparecer
              mais de uma vez, uma por plataforma):
            </p>
            {failures.map((f, i) => (
              <div
                key={`${f.vehicleId}-${f.platform ?? i}`}
                className="border rounded-lg p-3 bg-red-50"
              >
                <p className="font-medium text-sm text-gray-800">{f.vehicleName}</p>
                <p className="text-xs text-gray-500 mt-0.5">ID: {f.vehicleId}</p>
                <p className="text-xs text-red-700 mt-1 break-words">{f.error}</p>
                {f.precisaMapeamento && f.platform && onResolverMapeamento && (
                  <Button
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => onResolverMapeamento(f)}
                  >
                    <Wrench className="w-3 h-3 mr-1" /> Resolver mapeamento agora
                  </Button>
                )}
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
