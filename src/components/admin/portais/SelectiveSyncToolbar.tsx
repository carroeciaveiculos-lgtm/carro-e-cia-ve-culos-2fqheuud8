import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, FlaskConical, CheckCircle2, XCircle } from 'lucide-react'
import { syncSelectedVehicles, type SelectiveSyncResult } from '@/services/ml-selective-sync'

interface Props {
  selectedIds: Set<string>
  selectedPlans: Record<string, string>
  vehicleNames: Record<string, string>
  onSyncComplete: () => void
  onDryRun: () => void
}

export function SelectiveSyncToolbar({
  selectedIds,
  selectedPlans,
  vehicleNames,
  onSyncComplete,
  onDryRun,
}: Props) {
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<SelectiveSyncResult[]>([])

  const selections = [...selectedIds].map((id) => ({
    veiculoId: id,
    plan: selectedPlans[id] || 'prata',
  }))

  const handleSync = async () => {
    if (selections.length === 0) return
    setSyncing(true)
    setResults([])
    setProgress({ current: 0, total: selections.length })

    const res = await syncSelectedVehicles(selections, (current, total) => {
      setProgress({ current, total })
    })

    setResults(res)
    setSyncing(false)
    setProgress(null)
    onSyncComplete()
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-600">Sync Seletivo ML:</span>
        <Badge variant="secondary" className="text-xs">
          {selectedIds.size} selecionado(s)
        </Badge>
        <Button
          size="sm"
          className="h-8 bg-[#0D47A1] hover:bg-[#0B3E8F]"
          onClick={handleSync}
          disabled={selectedIds.size === 0 || syncing}
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 mr-1.5" />
          )}
          Sincronizar Selecionados
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onDryRun}
          disabled={selectedIds.size === 0 || syncing}
        >
          <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
          Simular Sync
        </Button>
      </div>

      {progress && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processando {progress.current}/{progress.total}...
        </div>
      )}

      {results.length > 0 && !syncing && (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> {successCount} sucesso
          </span>
          {failCount > 0 && (
            <span className="flex items-center gap-1 text-red-700">
              <XCircle className="w-3.5 h-3.5" /> {failCount} falha(s)
            </span>
          )}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="text-xs text-gray-400">
          Intervalo de 6s entre cada veículo (limite: 10/min)
        </div>
      )}
    </div>
  )
}
