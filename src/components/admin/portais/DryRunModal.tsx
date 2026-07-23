import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { generateDryRunPayload } from '@/services/ml-sync-advanced'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: string | null
  vehicleName?: string
}

export function DryRunModal({ open, onOpenChange, vehicleId, vehicleName }: Props) {
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<Record<string, any>>({})
  const [blockingErrors, setBlockingErrors] = useState<string[]>([])
  const [qualityAlerts, setQualityAlerts] = useState<string[]>([])

  useEffect(() => {
    if (!open || !vehicleId) return
    setLoading(true)
    setPayload({})
    setBlockingErrors([])
    setQualityAlerts([])
    generateDryRunPayload(vehicleId)
      .then((result) => {
        setPayload(result.payload)
        setBlockingErrors(result.validation.blockingErrors)
        setQualityAlerts(result.validation.qualityAlerts)
      })
      .finally(() => setLoading(false))
  }, [open, vehicleId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Simulação de Sync — {vehicleName || 'Veículo'}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {blockingErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">
                    Bloqueios ({blockingErrors.length})
                  </span>
                </div>
                <ul className="list-disc pl-5 text-xs text-red-600 space-y-0.5">
                  {blockingErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {qualityAlerts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-700">
                    Alertas ({qualityAlerts.length})
                  </span>
                </div>
                <ul className="list-disc pl-5 text-xs text-yellow-600 space-y-0.5">
                  {qualityAlerts.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {blockingErrors.length === 0 && qualityAlerts.length === 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Todas as validações passaram!</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px]">
                  Payload JSON
                </Badge>
                <span className="text-xs text-gray-400">
                  Apenas visualização — nada será enviado
                </span>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border bg-gray-950">
                <pre className="text-xs text-green-400 p-4 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
