import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, AlertTriangle } from 'lucide-react'
import { PreflightModal } from '@/components/admin/portais/PreflightModal'
import { MLDiagnosisPanel } from '@/components/admin/portais/MLDiagnosisPanel'
import { DryRunModal } from '@/components/admin/portais/DryRunModal'
import { validateMLPreflight } from '@/lib/ml-preflight'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  fetchPlataformas,
  fetchVeiculosForPortais,
  toggleVehiclePublication,
  updateAdType,
  fetchMLErrors,
  type Plataforma,
  type VeiculoSync,
} from '@/services/plataformas'
import { fetchPublicacoes } from '@/services/portais-sync'
import { syncVehicleToPlatform, batchSyncVehicles } from '@/services/sync-plataforma'
import { triggerWMSync } from '@/services/wm-sync'
import { supabase } from '@/lib/supabase/client'
import { VehicleAccordion } from '@/components/admin/portais/VehicleAccordion'
import { GlobalActionsBar } from '@/components/admin/portais/GlobalActionsBar'
import { ErrorHistoryPanel } from '@/components/admin/portais/ErrorHistoryPanel'
import { SyncFailureModal } from '@/components/admin/portais/SyncFailureModal'
import type { SyncFailure } from '@/components/admin/portais/SyncFailureModal'
import { ConversionMonitor } from '@/components/admin/portais/ConversionMonitor'
import { WMDashboard } from '@/components/admin/portais/WMDashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

export default function Portais() {
  const { toast } = useToast()
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [vehicles, setVehicles] = useState<VeiculoSync[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('marca_modelo')
  const [preflightOpen, setPreflightOpen] = useState(false)
  const [preflightResults, setPreflightResults] = useState<
    Array<{ vehicleId: string; vehicleName: string; issues: string[] }>
  >([])
  const [dryRunOpen, setDryRunOpen] = useState(false)
  const [dryRunVehicleId, setDryRunVehicleId] = useState<string | null>(null)
  const [dryRunVehicleName, setDryRunVehicleName] = useState<string>('')
  const [mlErrors, setMLErrors] = useState<
    Array<{ veiculo_id: string; marca: string; modelo: string; error: string }>
  >([])
  const [activePortalFilter, setActivePortalFilter] = useState<string | null>(null)
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const preflightProceedRef = useRef<(() => void) | null>(null)
  const [syncFailures, setSyncFailures] = useState<SyncFailure[]>([])
  const [failureModalOpen, setFailureModalOpen] = useState(false)

  useEffect(() => {
    fetchPlataformas()
      .then(setPlataformas)
      .catch(() => toast({ title: 'Erro ao carregar plataformas', variant: 'destructive' }))
  }, [toast])

  const loadVeiculos = useCallback(async () => {
    setLoading(true)
    try {
      const { vehicles: data, total: count } = await fetchVeiculosForPortais(
        search,
        page,
        pageSize,
        sortBy,
      )
      const ids = data.map((v) => v.id)
      const pubMap = ids.length > 0 ? await fetchPublicacoes(ids) : {}
      setVehicles(data.map((v) => ({ ...v, publicacoes: pubMap[v.id] || [] })))
      setTotal(count)
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, sortBy])

  useEffect(() => {
    const timer = setTimeout(loadVeiculos, 300)
    return () => clearTimeout(timer)
  }, [loadVeiculos])

  useEffect(() => {
    fetchMLErrors()
      .then(setMLErrors)
      .catch(() => {})
  }, [loadVeiculos])

  const filteredVehicles = activePortalFilter
    ? vehicles.filter((v) => v[SLUG_MAP[activePortalFilter]] as boolean)
    : vehicles

  const allSelected =
    filteredVehicles.length > 0 && filteredVehicles.every((v) => selectedIds.has(v.id))

  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(filteredVehicles.map((v) => v.id)) : new Set())

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const handleBulkSync = async (skipPreflight = false) => {
    if (selectedIds.size === 0) return
    setSyncing(true)

    if (!skipPreflight) {
      const allIssues = vehicles
        .filter((v) => selectedIds.has(v.id))
        .map((v) => ({
          vehicleId: v.id,
          vehicleName: `${v.marca} ${v.modelo}`,
          issues: validateMLPreflight(v),
        }))
        .filter((v) => v.issues.length > 0)

      if (allIssues.length > 0) {
        setPreflightResults(allIssues)
        preflightProceedRef.current = () => {
          handleBulkSync(true)
        }
        setPreflightOpen(true)
        setSyncing(false)
        return
      }
    }

    try {
      const ids = [...selectedIds]
      const result = await batchSyncVehicles(ids, 'mercadolivre')

      const failures: SyncFailure[] = result.results
        .map((r, i) => {
          const v = vehicles.find((v) => v.id === ids[i])
          return {
            vehicleId: ids[i],
            vehicleName: v ? `${v.marca} ${v.modelo}` : ids[i],
            error: r.success ? '' : r.message,
          }
        })
        .filter((f) => f.error)

      if (failures.length > 0) {
        setSyncFailures(failures)
        setFailureModalOpen(true)
      }

      toast({
        title: 'Sincronização concluída',
        description: `${result.successCount} sucesso, ${result.failCount} falha(s)`,
      })
      setSelectedIds(new Set())
      loadVeiculos()
    } catch (err: any) {
      toast({
        title: 'Erro na sincronização',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleDryRun = () => {
    const targetId = [...selectedIds][0]
    if (!targetId) return
    const vehicle = vehicles.find((v) => v.id === targetId)
    if (!vehicle) return
    setDryRunVehicleId(targetId)
    setDryRunVehicleName(`${vehicle.marca} ${vehicle.modelo}`)
    setDryRunOpen(true)
  }

  const handleSync = async (
    slug: string,
    veiculoId: string,
    publicar: boolean,
  ): Promise<{ success: boolean; message: string }> => {
    if (slug === 'mercadolivre') {
      const result = await syncVehicleToPlatform(
        veiculoId,
        'mercadolivre',
        publicar ? 'publish' : 'unpublish',
      )
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id !== veiculoId) return v
          return { ...v, [`publicado_${slug}`]: result.success ? publicar : !publicar }
        }),
      )
      if (!result.success) {
        toast({
          title: 'Erro na sincronização',
          description: result.message,
          variant: 'destructive',
        })
      }
      return result
    } else if (slug === 'webmotors') {
      try {
        await toggleVehiclePublication(slug, veiculoId, publicar)
        setVehicles((prev) =>
          prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: publicar })),
        )

        // Sem isso, o toggle só marcava a flag local e nunca disparava o
        // wm-sync de verdade — o veículo ficava marcado como "publicado" no
        // nosso banco sem nenhuma tentativa real de IncluirCarro/ExcluirCarro
        // na Webmotors. Garante que existe uma linha pendente antes de chamar.
        const { data: existingPub } = await supabase
          .from('estoque_publicacoes')
          .select('id, status, post_id')
          .eq('veiculo_id', veiculoId)
          .eq('platform', 'webmotors')
          .maybeSingle()

        const novoStatus = publicar ? 'pending_create' : 'pending_close'
        if (existingPub) {
          await supabase
            .from('estoque_publicacoes')
            .update({ status: novoStatus, erro_msg: null })
            .eq('id', existingPub.id)
        } else {
          await supabase
            .from('estoque_publicacoes')
            .insert({ veiculo_id: veiculoId, platform: 'webmotors', status: novoStatus })
        }

        const wmResult = await triggerWMSync(veiculoId)
        if (!wmResult.success) {
          setVehicles((prev) =>
            prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: !publicar })),
          )
          return { success: false, message: wmResult.error || 'Falha ao sincronizar com a Webmotors' }
        }
        return { success: true, message: `${wmResult.processed ?? 0} processado(s) na Webmotors` }
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    } else {
      try {
        await toggleVehiclePublication(slug, veiculoId, publicar)
        setVehicles((prev) =>
          prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: publicar })),
        )
        return { success: true, message: 'Status atualizado' }
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    }
  }

  const handleUpdateAdType = async (veiculoId: string, platform: string, adType: string) => {
    try {
      await updateAdType(veiculoId, platform, adType)
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id !== veiculoId) return v
          if (platform === 'mercadolivre') return { ...v, ml_listing_type: adType }
          return { ...v, ad_types: { ...(v.ad_types || {}), [platform]: adType } }
        }),
      )
      toast({ title: 'Modalidade atualizada com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Sincronização de Portais</h1>
      </div>

      <GlobalActionsBar
        plataformas={plataformas}
        selectedCount={selectedIds.size}
        allSelected={allSelected}
        onSelectAll={handleSelectAll}
        onBulkSync={() => handleBulkSync()}
        onDryRun={handleDryRun}
        onToggleDiagnosis={() => setShowDiagnosis((p) => !p)}
        activePortalFilter={activePortalFilter}
        onPortalFilter={setActivePortalFilter}
        syncing={syncing}
      />

      {mlErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erros de Sincronização - Mercado Livre</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 text-sm">
              {mlErrors.map((e, i) => (
                <li key={i}>
                  {e.marca} {e.modelo}: {e.error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={sortBy}
          onValueChange={(v) => {
            setSortBy(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="marca_modelo">Marca + Modelo</SelectItem>
            <SelectItem value="recentes">Mais Recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg border text-center py-20 text-gray-500">
          {activePortalFilter
            ? 'Nenhum veículo publicado neste portal.'
            : 'Nenhum veículo encontrado.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {filteredVehicles.map((v) => (
            <VehicleAccordion
              key={v.id}
              veiculo={v}
              plataformas={plataformas}
              isSelected={selectedIds.has(v.id)}
              onSelect={(c) => handleSelect(v.id, c)}
              onSync={handleSync}
              onUpdateAdType={handleUpdateAdType}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages} · {total} veículos
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Histórico de Erros</h2>
          <ErrorHistoryPanel />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Monitoramento de Conversão</h2>
          <ConversionMonitor />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 mt-8">
        <WMDashboard />
      </div>

      {showDiagnosis && (
        <div className="mt-8 animate-fade-in">
          <MLDiagnosisPanel />
        </div>
      )}

      <DryRunModal
        open={dryRunOpen}
        onOpenChange={setDryRunOpen}
        vehicleId={dryRunVehicleId}
        vehicleName={dryRunVehicleName}
      />

      <PreflightModal
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        results={preflightResults}
        onProceed={() => {
          setPreflightOpen(false)
          preflightProceedRef.current?.()
          preflightProceedRef.current = null
        }}
      />

      <SyncFailureModal
        open={failureModalOpen}
        onOpenChange={setFailureModalOpen}
        failures={syncFailures}
      />
    </div>
  )
}
