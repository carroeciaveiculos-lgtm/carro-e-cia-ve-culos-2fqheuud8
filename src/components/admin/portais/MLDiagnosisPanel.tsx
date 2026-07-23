import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, CircleCheck, CircleAlert, CircleX } from 'lucide-react'
import { fetchDiagnosisVehicles, type DiagnosisVehicle } from '@/services/ml-diagnosis'

export function MLDiagnosisPanel() {
  const [vehicles, setVehicles] = useState<DiagnosisVehicle[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDiagnosisVehicles()
      setVehicles(data)
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const readyCount = vehicles.filter((v) => v.status === 'ready').length
  const pendingCount = vehicles.filter((v) => v.status === 'pending').length
  const blockedCount = vehicles.filter((v) => v.status === 'blocked').length

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800">Painel de Diagnóstico ML</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <CircleCheck className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium">{readyCount} Prontos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CircleAlert className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-medium">{pendingCount} Pendentes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CircleX className="w-4 h-4 text-red-500" />
          <span className="text-xs font-medium">{blockedCount} Bloqueados</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {vehicles.map((v) => (
            <div key={v.id} className="border rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {v.status === 'ready' ? '🟢' : v.status === 'pending' ? '🟡' : '🔴'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {v.marca} {v.modelo} {v.versao || ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {v.ano_modelo || 'N/A'} · {v.placa || 'S/ Placa'}
                  </p>
                </div>
              </div>
              {v.validation.blockingErrors.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {v.validation.blockingErrors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">
                      ✗ {e}
                    </p>
                  ))}
                </div>
              )}
              {v.validation.qualityAlerts.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {v.validation.qualityAlerts.map((a, i) => (
                    <p key={i} className="text-xs text-yellow-600">
                      ⚠ {a}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
