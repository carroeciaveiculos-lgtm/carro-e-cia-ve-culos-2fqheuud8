import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, RefreshCw, Car, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { WMStatusBadge } from './WMStatusBadge'
import {
  getWMDashboard,
  triggerWMSync,
  getWMVehicles,
  getWMSyncLogs,
  type WMDashboardData,
  type WMVehicleRow,
  type WMSyncLog,
} from '@/services/wm-sync'
import { getImageUrl } from '@/lib/image-utils'

export function WMDashboard() {
  const [data, setData] = useState<WMDashboardData | null>(null)
  const [vehicles, setVehicles] = useState<WMVehicleRow[]>([])
  const [logs, setLogs] = useState<WMSyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [d, v, l] = await Promise.all([
        getWMDashboard().catch(() => null),
        getWMVehicles().catch(() => []),
        getWMSyncLogs().catch(() => []),
      ])
      setData(d)
      setVehicles(v)
      setLogs(l)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await triggerWMSync()
      await loadAll()
    } catch {
      /* handled by reload */
    } finally {
      setSyncing(false)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )

  const metrics = [
    {
      label: 'Anúncios Ativos',
      value: data?.total_published ?? 0,
      icon: Car,
      color: 'text-blue-600',
    },
    {
      label: 'Erros (7 dias)',
      value: data?.sync_errors_7d ?? 0,
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      label: 'Sincronizações Pendentes',
      value: data?.pending_syncs ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'Leads (7 dias)',
      value: data?.leads_7d ?? 0,
      icon: TrendingUp,
      color: 'text-green-600',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Dashboard Webmotors</h3>
        <Button
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="bg-[#E6332A] hover:bg-[#c52d25]"
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          )}
          Sincronizar Agora
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-gray-200">
            <CardContent className="p-3 flex items-center gap-2">
              <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">{m.value}</p>
                <p className="text-[10px] text-gray-500 truncate">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border overflow-hidden">
          <h4 className="text-xs font-bold text-gray-700 p-3 border-b">Veículos no Webmotors</h4>
          <div className="max-h-[300px] overflow-y-auto">
            {vehicles.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">Nenhum veículo publicado.</p>
            ) : (
              vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 px-3 py-2 border-b last:border-0 hover:bg-slate-50"
                >
                  <img
                    src={getImageUrl(v.veiculos?.fotos?.[0])}
                    alt=""
                    className="w-10 h-8 object-cover rounded bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {v.veiculos?.marca} {v.veiculos?.modelo}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {v.veiculos?.ano_modelo || 'N/A'} · {v.veiculos?.placa || 'S/Placa'}
                    </p>
                  </div>
                  <WMStatusBadge status={v.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <h4 className="text-xs font-bold text-gray-700 p-3 border-b">
            Timeline de Sincronização
          </h4>
          <div className="max-h-[300px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">Nenhum log registrado.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="px-3 py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <WMStatusBadge status={log.status === 'success' ? 'publicado' : log.status} />
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.created_at || '').toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{log.mensagem || log.acao}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
