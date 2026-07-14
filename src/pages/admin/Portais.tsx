import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Zap } from 'lucide-react'
import {
  fetchPlataformas,
  fetchVeiculosForPortais,
  forceSync,
  triggerSyncEstoque,
  toggleVehiclePublication,
  updateAdType,
  toggleElegivelPortais,
  type Plataforma,
  type VeiculoSync,
} from '@/services/plataformas'
import { VehicleSyncRow } from '@/components/admin/portais/VehicleSyncRow'
import { PlatformDrawer } from '@/components/admin/portais/PlatformDrawer'
import { calculateAdQualityScore } from '@/lib/ad-quality-score'
import { useToast } from '@/hooks/use-toast'

export default function Portais() {
  const { toast } = useToast()
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [vehicles, setVehicles] = useState<VeiculoSync[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [qualityFilter, setQualityFilter] = useState('todos')
  const [sortBy, setSortBy] = useState('alpha')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<VeiculoSync | null>(null)
  const [toggling, setToggling] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPlataformas()
      .then(setPlataformas)
      .catch(() => toast({ title: 'Erro ao carregar plataformas', variant: 'destructive' }))
  }, [toast])

  const loadVeiculos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchVeiculosForPortais(search)
      setVehicles(data || [])
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadVeiculos, 300)
    return () => clearTimeout(timer)
  }, [loadVeiculos])

  const filteredVehicles = useMemo(() => {
    let result = [...vehicles]
    if (statusFilter === 'publicados') {
      result = result.filter(
        (v) =>
          v.publicado_mercadolivre ||
          v.publicado_webmotors ||
          v.publicado_olx ||
          v.publicado_icarros ||
          v.publicado_napista,
      )
    } else if (statusFilter === 'nao_publicados') {
      result = result.filter(
        (v) =>
          !v.publicado_mercadolivre &&
          !v.publicado_webmotors &&
          !v.publicado_olx &&
          !v.publicado_icarros &&
          !v.publicado_napista,
      )
    }
    if (qualityFilter === 'alto')
      result = result.filter((v) => calculateAdQualityScore(v).score >= 80)
    else if (qualityFilter === 'medio')
      result = result.filter((v) => {
        const s = calculateAdQualityScore(v).score
        return s >= 41 && s < 80
      })
    else if (qualityFilter === 'baixo')
      result = result.filter((v) => calculateAdQualityScore(v).score < 41)
    if (sortBy === 'alpha')
      result.sort((a, b) => `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`))
    else if (sortBy === 'preco') result.sort((a, b) => (b.preco_venda || 0) - (a.preco_venda || 0))
    return result
  }, [vehicles, statusFilter, qualityFilter, sortBy])

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

  const handleToggle = async (slug: string, veiculoId: string, publicar: boolean) => {
    const key = `${veiculoId}-${slug}`
    setToggling((prev) => ({ ...prev, [key]: true }))
    setVehicles((prev) =>
      prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: publicar })),
    )
    if (selectedVehicle?.id === veiculoId) {
      setSelectedVehicle((prev) => (prev ? { ...prev, [`publicado_${slug}`]: publicar } : null))
    }
    try {
      await toggleVehiclePublication(slug, veiculoId, publicar)
      toast({ title: publicar ? 'Veículo enviado para publicação' : 'Anúncio encerrado' })
    } catch (err: any) {
      setVehicles((prev) =>
        prev.map((v) => (v.id !== veiculoId ? v : { ...v, [`publicado_${slug}`]: !publicar })),
      )
      toast({ title: 'Erro na operação', description: err.message, variant: 'destructive' })
    } finally {
      setToggling((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleUpdateAdType = async (veiculoId: string, platform: string, adType: string) => {
    try {
      await updateAdType(veiculoId, platform, adType)
      toast({ title: 'Tipo de anúncio atualizado!' })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  const handleToggleElegivel = async (veiculoId: string, elegivel: boolean) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id !== veiculoId ? v : { ...v, elegivel_portais: elegivel })),
    )
    try {
      await toggleElegivelPortais(veiculoId, elegivel)
    } catch {
      setVehicles((prev) =>
        prev.map((v) => (v.id !== veiculoId ? v : { ...v, elegivel_portais: !elegivel })),
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">Sincronização de Portais</h1>
        <Button
          size="sm"
          onClick={handleSyncAll}
          disabled={syncing}
          className="ml-auto bg-[#0D47A1] hover:bg-[#0B3E8F]"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Sincronizar Tudo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="publicados">Publicados</SelectItem>
            <SelectItem value="nao_publicados">Não Publicados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={qualityFilter} onValueChange={setQualityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Qualidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="alto">Alta (80+)</SelectItem>
            <SelectItem value="medio">Média (41-79)</SelectItem>
            <SelectItem value="baixo">Baixa (0-40)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ordem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alpha">A-Z</SelectItem>
            <SelectItem value="preco">Maior Preço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg border text-center py-20 text-gray-500">
          Nenhum veículo encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {filteredVehicles.map((v) => (
            <VehicleSyncRow
              key={v.id}
              veiculo={v}
              plataformas={plataformas}
              onClick={() => setSelectedVehicle(v)}
              onToggleElegivel={handleToggleElegivel}
            />
          ))}
        </div>
      )}

      <PlatformDrawer
        vehicle={selectedVehicle}
        plataformas={plataformas}
        open={!!selectedVehicle}
        onOpenChange={(open) => {
          if (!open) setSelectedVehicle(null)
        }}
        onToggle={handleToggle}
        onUpdateAdType={handleUpdateAdType}
        toggling={toggling}
      />
    </div>
  )
}
