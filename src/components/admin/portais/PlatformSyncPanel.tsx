import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, Car, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { WMStatusBadge } from './WMStatusBadge'
import { useToast } from '@/hooks/use-toast'
import {
  getPlatformSyncDashboard,
  triggerPlatformSync,
  getPlatformVehicles,
  getPlatformSyncLogs,
  getWMModalidadesQuota,
  type PlatformSyncDashboardData,
  type PlatformVehicleRow,
  type PlatformSyncLog,
  type WMModalidadeQuota,
} from '@/services/platform-sync'
import { batchSyncVehicles } from '@/services/sync-plataforma'
import { getImageUrl } from '@/lib/image-utils'

// Generaliza WMDashboard.tsx (12/08/2026) — usado dentro de um Accordion em
// Portais.tsx, uma seção por plataforma real (Webmotors, Mercado Livre).
interface Props {
  platformSlug: string
  platformColor: string
}

export function PlatformSyncPanel({ platformSlug, platformColor }: Props) {
  const [data, setData] = useState<PlatformSyncDashboardData | null>(null)
  const [vehicles, setVehicles] = useState<PlatformVehicleRow[]>([])
  const [logs, setLogs] = useState<PlatformSyncLog[]>([])
  const [quotas, setQuotas] = useState<WMModalidadeQuota[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [d, v, l, q] = await Promise.all([
        getPlatformSyncDashboard(platformSlug).catch(() => null),
        getPlatformVehicles(platformSlug).catch(() => []),
        getPlatformSyncLogs(platformSlug).catch(() => []),
        platformSlug === 'webmotors' ? getWMModalidadesQuota().catch(() => []) : Promise.resolve([]),
      ])
      setData(d)
      setVehicles(v)
      setLogs(l)
      setQuotas(q)
    } finally {
      setLoading(false)
    }
  }, [platformSlug])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleSync = async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      if (platformSlug === 'mercadolivre') {
        // sync-plataforma (a função real por trás do ML) só sincroniza um
        // veículo por vez — não existe modo "tudo de uma vez" pra essa
        // plataforma. triggerPlatformSync manda um corpo sem veiculo_id
        // nesse caso, que sempre falhava com um erro genérico. Sincroniza
        // um a um os veículos já rastreados nessa plataforma.
        if (vehicles.length === 0) {
          toast({ title: 'Nada para sincronizar', description: 'Nenhum veículo publicado nessa plataforma ainda.' })
          return
        }
        const { successCount, failCount, results } = await batchSyncVehicles(
          vehicles.map((v) => v.veiculo_id),
          'mercadolivre',
        )
        await loadAll()
        if (failCount > 0) {
          const msg = results
            .filter((r) => !r.success)
            .map((r) => r.message)
            .join('; ')
          setSyncError(msg)
          toast({
            variant: 'destructive',
            title: `${successCount} ok, ${failCount} com erro`,
            description: msg,
          })
        } else {
          toast({ title: 'Sincronização concluída', description: `${successCount} veículo(s) sincronizado(s).` })
        }
        return
      }
      const result = await triggerPlatformSync(platformSlug)
      if (!result.success) throw new Error(result.error || 'Falha na sincronização')
      await loadAll()
      toast({ title: 'Sincronização concluída', description: `${platformSlug} sincronizado.` })
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível sincronizar agora. Tente novamente mais tarde.'
      setSyncError(msg)
      toast({ variant: 'destructive', title: 'Erro na sincronização', description: msg })
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
    { label: 'Anúncios Ativos', value: data?.total_published ?? 0, icon: Car, color: 'text-blue-600' },
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
    { label: 'Leads (7 dias)', value: data?.leads_7d ?? 0, icon: TrendingUp, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-4">
      {syncError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end">
        <Button size="sm" onClick={handleSync} disabled={syncing} style={{ backgroundColor: platformColor }}>
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

      {platformSlug === 'webmotors' && quotas.length > 0 && (
        <div className="bg-white rounded-lg border p-3">
          <h4 className="text-xs font-bold text-gray-700 mb-2">
            Vagas de anúncio simultâneo por modalidade
          </h4>
          <p className="text-[10px] text-gray-400 mb-3">
            Não é limite de estoque — é quanto pode ficar publicado ao mesmo tempo em cada
            modalidade contratada.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quotas.map((q) => {
              const total = q.quantidade_total ?? 0
              const usados = q.quantidade_usados ?? 0
              const livres = Math.max(0, total - usados)
              const cheio = total > 0 && usados >= total
              return (
                <div key={q.codigo_wm} className="border rounded-md p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{q.descricao}</span>
                    <span
                      className={`text-xs font-bold ${cheio ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {usados}/{total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cheio ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${total > 0 ? Math.min(100, (usados / total) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {livres} vaga{livres === 1 ? '' : 's'} livre{livres === 1 ? '' : 's'}
                    {q.atualizado_em &&
                      ` · atualizado ${new Date(q.atualizado_em).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border overflow-hidden">
          <h4 className="text-xs font-bold text-gray-700 p-3 border-b">Veículos</h4>
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
          <h4 className="text-xs font-bold text-gray-700 p-3 border-b">Timeline de Sincronização</h4>
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
