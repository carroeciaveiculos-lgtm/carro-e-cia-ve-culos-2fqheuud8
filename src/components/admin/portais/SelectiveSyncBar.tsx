import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Send, FlaskConical } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { selectiveSync } from '@/services/ml-sync-advanced'

interface Props {
  selectedIds: string[]
  onClear: () => void
  onDryRun: (vehicleId: string) => void
  onSyncComplete: () => void
}

export function SelectiveSyncBar({ selectedIds, onClear, onDryRun, onSyncComplete }: Props) {
  const { toast } = useToast()
  const [plan, setPlan] = useState('gold_pro')
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleSync = async () => {
    if (selectedIds.length === 0) return
    setSyncing(true)
    setProgress({ current: 0, total: selectedIds.length })
    try {
      const result = await selectiveSync(selectedIds, 'mercadolivre', (i, total) => {
        setProgress({ current: i, total })
      })
      toast({
        title: 'Sincronização concluída',
        description: `${result.success} sucesso, ${result.failed} falhas`,
      })
      onClear()
      onSyncComplete()
    } catch (err: any) {
      toast({ title: 'Erro na sincronização', description: err.message, variant: 'destructive' })
    } finally {
      setSyncing(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const handleDryRunFirst = () => {
    if (selectedIds.length > 0) onDryRun(selectedIds[0])
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-wrap items-center gap-3 animate-fade-in">
      <span className="text-sm font-bold text-blue-800">{selectedIds.length} selecionado(s)</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Plano:</span>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gold_pro" className="text-xs">
              Diamante
            </SelectItem>
            <SelectItem value="silver" className="text-xs">
              Prata
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        size="sm"
        onClick={handleSync}
        disabled={syncing}
        className="h-8 bg-[#0D47A1] hover:bg-[#0B3E8F]"
      >
        {syncing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            {progress.current}/{progress.total}
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Sincronizar Selecionados
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDryRunFirst}
        disabled={syncing}
        className="h-8"
      >
        <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
        Simular Sync
      </Button>
      {syncing && (
        <span className="text-xs text-gray-500">Intervalo de 6s entre cada veículo...</span>
      )}
    </div>
  )
}
