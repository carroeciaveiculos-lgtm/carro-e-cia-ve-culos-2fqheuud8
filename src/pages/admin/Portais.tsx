import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'
import {
  fetchPlataformas,
  fetchVeiculosForPortais,
  forceSync,
  triggerSyncEstoque,
  toggleVehiclePublication,
  updateAdType,
  type Plataforma,
  type VeiculoSync,
} from '@/services/plataformas'
import { fetchPublicacoes, bulkPublish, bulkUnpublish, bulkDelete } from '@/services/portais-sync'
import { VehicleAccordion } from '@/components/admin/portais/VehicleAccordion'
import { GlobalActionsBar } from '@/components/admin/portais/GlobalActionsBar'
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

  useEffect(() => {
    fetchPlataformas().then(setPlataformas)
      .catch(() => toast({ title: 'Erro ao carregar plataformas', variant: 'destructive' }))
  }, [toast])

  const loadVeiculos = useCallback(async () => {
    setLoading(true)
    try {
      const { vehicles: data, total: count } = await fetchVeiculosForPortais(search, page, pageSize)
      const ids = data.map(v => v.id)
      const pubMap = ids.length > 0 ? await fetchPublicacoes(ids) : {}
      setVehicles(data.map(v => ({ ...v, publicacoes: pubMap[v.id] || [] })))
      setTotal(count)
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize])

  useEffect(() => {
    const timer = setTimeout(loadVeiculos, 300)
    return () => clearTimeout(timer)
  }, [loadVeiculos])

  const allSelected = vehicles.length > 0 && vehicles.every(v => selectedIds.has(v.id))
  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(vehicles.map(v => v.id)) : new Set())
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id); else next.delete(id)
    setSelectedIds(next)
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      await Promise.all(plataformas.map(p => forceSync(p.slug).catch(() => {})))
      await triggerSyncEstoque()
      toast({ title: 'Sincronização global iniciada!' })
      loadVeiculos()
    } catch { toast({ title: 'Erro ao sincronizar', variant: 'destructive' }) }
    finally { setSyncing(false) }
  }

  const handleQuickSync = async (slug: string) => {
    setSyncingSlug(slug); setSyncing(true)
    try { await forceSync(slug); toast({ title: `Sync de ${slug} iniciado!` }); loadVeiculos() }
    catch { toast({ title: 'Erro ao sincronizar', variant: 'destructive' }) }
    finally { setSyncing(false); setSyncingSlug(null) }
  }

  const handleToggle = async (slug: string, veiculoId: string, publicar: boolean) => {
    const key = `${veiculoId}-${slug}`
    setToggling(p => ({ ...p, [key]: true }))
    setVehicles(prev => prev.map(v => v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: publicar }))
    try { await toggleVehiclePublication(slug, veiculoId, publicar) }
    catch (err: any) {
      setVehicles(prev => prev.map(v => v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: !publicar })))
      toast({ title: 'Erro na operação', description: err.message, variant: 'destructive' })
    } finally { setToggling(p => ({ ...p, [key]: false })) }
  }

  const handleUpdateAdType = async (veiculoId: string, platform: string, adType: string) => {
    try { await updateAdType(veiculoId, platform, adType); toast({ title: 'Tipo de anúncio atualizado!' }) }
    catch (err: any) { toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' }) }
  }

  const handleBulkPublish = async () => {
    setSyncing(true)
    try {
      const slugs = plataformas.map(p => p.slug)
      const { success, failed } = await bulkPublish([...selectedIds], slugs)
      toast({ title: `${success} publicações enviadas${failed ? `, ${failed} falharam` : ''}` })
      setSelectedIds(new Set()); loadVeiculos()
    } catch { toast({ title: 'Erro na publicação', variant: 'destructive' }) }
    finally { setSyncing(false) }
  }

  const handleBulkUnpublish = async () => {
    setSyncing(true)
    try {
      const slugs = plataformas.map(p => p.slug)
      const { success } = await bulkUnpublish([...selectedIds], slugs)
      toast({ title: `${success} anúncios desativados` })
      setSelectedIds(new Set()); loadVeiculos()
    } catch { toast({ title: 'Erro ao desativar', variant: 'destructive' }) }
    finally { setSyncing(false) }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.size} veículos? Esta ação não pode ser desfeita.`)) return
    setSyncing(true)
    try { await bulkDelete([...selectedIds]); toast({ title: 'Veículos excluídos!' }); setSelectedIds(new Set()); loadVeiculos() }
    catch (err: any) { toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' }) }
    finally { setSyncing(false) }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Sincronização de Portais</h1>

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
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        syncing={syncing}
        syncingSlug={syncingSlug}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar veículo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-lg border text-center py-20 text-gray-500">Nenhum veículo encontrado.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {vehicles.map(v => (
            <VehicleAccordion key={v.id} veiculo={v} plataformas={plataformas}
              isSelected={selectedIds.has(v.id)} onSelect={(c) => handleSelect(v.id, c)}
              onToggle={handleToggle} onUpdateAdType={handleUpdateAdType} toggling={toggling} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages} · {total} veículos
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}
