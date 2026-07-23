import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, AlertCircle, AlertTriangle, FlaskConical } from 'lucide-react'
import { PreflightModal } from '@/components/admin/portais/PreflightModal'
import { MLDiagnosisPanel } from '@/components/admin/portais/MLDiagnosisPanel'
import { DryRunModal } from '@/components/admin/portais/DryRunModal'
import { SelectiveSyncToolbar } from '@/components/admin/portais/SelectiveSyncToolbar'
import { SelectiveSyncBar } from '@/components/admin/portais/SelectiveSyncBar'
import { validateMLPreflight } from '@/lib/ml-preflight'
import { validateVehicleForML } from '@/lib/ml-validation'
import { buildMLPayloadPreview } from '@/lib/ml-payload'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  fetchPlataformas,
  fetchVeiculosForPortais,
  forceSync,
  triggerSyncEstoque,
  toggleVehiclePublication,
  updateAdType,
  ensureMLListings,
  fetchMLErrors,
  type Plataforma,
  type VeiculoSync,
} from '@/services/plataformas'
import { fetchPublicacoes, bulkPublish, bulkUnpublish, bulkDelete } from '@/services/portais-sync'
import { VehicleAccordion } from '@/components/admin/portais/VehicleAccordion'
import { GlobalActionsBar } from '@/components/admin/portais/GlobalActionsBar'
import { ErrorHistoryPanel } from '@/components/admin/portais/ErrorHistoryPanel'
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
  const [syncingSlug, setSyncingSlug] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState('marca_modelo')
  const [preflightOpen, setPreflightOpen] = useState(false)
  const [preflightResults, setPreflightResults] = useState<
    Array<{ vehicleId: string; vehicleName: string; issues: string[] }>
  >([])
  const [dryRunOpen, setDryRunOpen] = useState(false)
  const [dryRunVehicleId, setDryRunVehicleId] = useState<string | null>(null)
  const [dryRunVehicleName, setDryRunVehicleName] = useState<string>('')
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({})
  const [dryRunPayload, setDryRunPayload] = useState<any>(null)
  const [dryRunValidation, setDryRunValidation] = useState<any>(null)
  const [mlErrors, setMLErrors] = useState<
    Array<{ veiculo_id: string; marca: string; modelo: string; error: string }>
  >([])

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

  const allSelected = vehicles.length > 0 && vehicles.every((v) => selectedIds.has(v.id))
  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(vehicles.map((v) => v.id)) : new Set())
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      await Promise.all(plataformas.map((p) => forceSync(p.slug).catch(() => {})))
      await triggerSyncEstoque()
      toast({ title: 'Sincronização global iniciada!' })
      loadVeiculos()
    } catch {
      toast({ title: 'Erro ao sincronizar', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const handleDryRun = async (veiculoId?: string) => {
    const targetId = veiculoId || [...selectedIds][0]
    if (!targetId) return
    const vehicle = vehicles.find((v) => v.id === targetId)
    if (!vehicle) return
    const payload = buildMLPayloadPreview(vehicle)
    const validation = await validateVehicleForML(vehicle)
    setDryRunPayload(payload)
    setDryRunValidation(validation)
    setDryRunVehicleName(`${vehicle.marca} ${vehicle.modelo}`)
    setDryRunOpen(true)
  }

  const handleQuickSync = async (slug: string, skipPreflight = false) => {
    if (slug === 'mercadolivre' && !skipPreflight) {
      const allIssues = vehicles
        .map((v) => ({
          vehicleId: v.id,
          vehicleName: `${v.marca} ${v.modelo}`,
          issues: validateMLPreflight(v),
        }))
        .filter((v) => v.issues.length > 0)
      if (allIssues.length > 0) {
        setPreflightResults(allIssues)
        setPreflightOpen(true)
        return
      }
    }
    setSyncingSlug(slug)
    setSyncing(true)
    try {
      if (slug === 'mercadolivre') {
        await ensureMLListings(vehicles.map((v) => v.id))
      }
      await forceSync(slug)
      toast({ title: `Sync de ${slug} iniciado!` })
      loadVeiculos()
    } catch {
      toast({ title: 'Erro ao sincronizar', variant: 'destructive' })
    } finally {
      setSyncing(false)
      setSyncingSlug(null)
    }
  }

  const handleToggle = async (slug: string, veiculoId: string, publicar: boolean) => {
    if (slug === 'mercadolivre' && publicar) {
      const vehicle = vehicles.find((v) => v.id === veiculoId)
      if (vehicle) {
        const issues = validateMLPreflight(vehicle)
        if (issues.length > 0) {
          setPreflightResults([
            { vehicleId: veiculoId, vehicleName: `${vehicle.marca} ${vehicle.modelo}`, issues },
          ])
          setPreflightOpen(true)
          return
        }
      }
    }
    const key = `${veiculoId}-${slug}`
    setToggling((p) => ({ ...p, [key]: true }))
    setVehicles((prev) =>
      prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: publicar })),
    )
    try {
      await toggleVehiclePublication(slug, veiculoId, publicar)
    } catch (err: any) {
      setVehicles((prev) =>
        prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: !publicar })),
      )
      toast({ title: 'Erro na operação', description: err.message, variant: 'destructive' })
    } finally {
      setToggling((p) => ({ ...p, [key]: false }))
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

  const handleBulkPublish = async () => {
    setSyncing(true)
    try {
      const slugs = plataformas.map((p) => p.slug)
      const { success, failed } = await bulkPublish([...selectedIds], slugs)
      toast({ title: `${success} publicações enviadas${failed ? `, ${failed} falharam` : ''}` })
      setSelectedIds(new Set())
      loadVeiculos()
    } catch {
      toast({ title: 'Erro na publicação', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const handleBulkUnpublish = async () => {
    setSyncing(true)
    try {
      const slugs = plataformas.map((p) => p.slug)
      const { success } = await bulkUnpublish([...selectedIds], slugs)
      toast({ title: `${success} anúncios desativados` })
      setSelectedIds(new Set())
      loadVeiculos()
    } catch {
      toast({ title: 'Erro ao desativar', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.size} veículos? Esta ação não pode ser desfeita.`)) return
    setSyncing(true)
    try {
      await bulkDelete([...selectedIds])
      toast({ title: 'Veículos excluídos!' })
      setSelectedIds(new Set())
      loadVeiculos()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">Sincronização de Portais</h1>
          <Link to="/admin/ml-diagnosis">
            <Button variant="outline" size="sm">
              <FlaskConical className="w-4 h-4 mr-2" />
              Diagnóstico ML
            </Button>
          </Link>
          <Link to="/admin/portais/revisao">
            <Button variant="outline" size="sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              Revisão de Pendências
            </Button>
          </Link>
        </div>
      </div>

      <GlobalActionsBar
        plataformas={plataformas}
        selectedCount={selectedIds.size}
        totalCount={total}
        allSelected={allSelected}
        onSelectAll={handleSelectAll}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkDelete={handleBulkDelete}
        onQuickSync={handleQuickSync}
        onSyncAll={handleSyncAll}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s)
          setPage(1)
        }}
        syncing={syncing}
        syncingSlug={syncingSlug}
      />

      <SelectiveSyncBar
        selectedIds={[...selectedIds]}
        onClear={() => setSelectedIds(new Set())}
        onDryRun={(vid) => {
          const v = vehicles.find((x) => x.id === vid)
          setDryRunVehicleId(vid)
          setDryRunVehicleName(v ? `${v.marca} ${v.modelo}` : '')
          setDryRunOpen(true)
        }}
        onSyncComplete={loadVeiculos}
      />

      <SelectiveSyncToolbar
        selectedIds={selectedIds}
        selectedPlans={selectedPlans}
        vehicleNames={Object.fromEntries(vehicles.map((v) => [v.id, `${v.marca} ${v.modelo}`]))}
        onSyncComplete={loadVeiculos}
        onDryRun={() => handleDryRun()}
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
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-lg border text-center py-20 text-gray-500">
          Nenhum veículo encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {vehicles.map((v) => (
            <VehicleAccordion
              key={v.id}
              veiculo={v}
              plataformas={plataformas}
              isSelected={selectedIds.has(v.id)}
              onSelect={(c) => handleSelect(v.id, c)}
              onToggle={handleToggle}
              onUpdateAdType={handleUpdateAdType}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages} · {total} veículos
          </span>
          <div className="flex gap-2">
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

      <div className="mt-8">
        <MLDiagnosisPanel />
      </div>

      <DryRunModal
        open={dryRunOpen}
        onOpenChange={setDryRunOpen}
        vehicleId={dryRunVehicleId}
        payload={dryRunPayload}
        validation={dryRunValidation}
        vehicleName={dryRunVehicleName}
      />

      <PreflightModal
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        results={preflightResults}
        onProceed={() => {
          setPreflightOpen(false)
          handleQuickSync('mercadolivre', true)
        }}
      />
    </div>
  )
}
