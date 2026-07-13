import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Zap } from 'lucide-react'
import {
  fetchPlataformas,
  fetchDashboard,
  fetchVeiculosSync,
  forceSync,
  triggerSyncEstoque,
  toggleVehiclePublication,
  type Plataforma,
  type VeiculoSync,
  type PlataformaDashboard,
} from '@/services/plataformas'
import { PlatformHealthBadge } from '@/components/admin/portais/PlatformHealthBadge'
import { PlatformStatsBar } from '@/components/admin/portais/PlatformStatsBar'
import { VehicleSyncCard } from '@/components/admin/portais/VehicleSyncCard'
import { useToast } from '@/hooks/use-toast'

export default function Portais() {
  const { toast } = useToast()
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [selectedSlug, setSelectedSlug] = useState('mercadolivre')
  const [dashboard, setDashboard] = useState<PlataformaDashboard | null>(null)
  const [veiculos, setVeiculos] = useState<VeiculoSync[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toggling, setToggling] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPlataformas()
      .then(setPlataformas)
      .catch(() => toast({ title: 'Erro ao carregar plataformas', variant: 'destructive' }))
  }, [toast])

  useEffect(() => {
    fetchDashboard(selectedSlug)
      .then(setDashboard)
      .catch(() => setDashboard(null))
  }, [selectedSlug])

  const loadVeiculos = useCallback(async () => {
    setLoading(true)
    try {
      const { veiculos: data } = await fetchVeiculosSync(selectedSlug, 1, search)
      setVeiculos(data || [])
    } catch {
      setVeiculos([])
    } finally {
      setLoading(false)
    }
  }, [selectedSlug, search])

  useEffect(() => {
    const timer = setTimeout(loadVeiculos, 300)
    return () => clearTimeout(timer)
  }, [loadVeiculos])

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      await Promise.all([forceSync(selectedSlug), triggerSyncEstoque()])
      toast({ title: 'Sincronização iniciada com sucesso!' })
      fetchDashboard(selectedSlug)
        .then(setDashboard)
        .catch(() => {})
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
    setVeiculos((prev) =>
      prev.map((v) => {
        if (v.id !== veiculoId) return v
        const field = `publicado_${slug}` as keyof VeiculoSync
        return { ...v, [field]: publicar }
      }),
    )
    try {
      await toggleVehiclePublication(slug, veiculoId, publicar)
      toast({ title: publicar ? 'Veículo enviado para publicação' : 'Anúncio encerrado' })
    } catch (err: any) {
      setVeiculos((prev) =>
        prev.map((v) => {
          if (v.id !== veiculoId) return v
          const field = `publicado_${slug}` as keyof VeiculoSync
          return { ...v, [field]: !publicar }
        }),
      )
      toast({ title: 'Erro na operação', description: err.message, variant: 'destructive' })
    } finally {
      setToggling((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="lg:w-56 shrink-0 space-y-2">
        <h2 className="text-xs font-bold text-gray-500 uppercase px-2">Plataformas</h2>
        {plataformas.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedSlug(p.slug)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedSlug === p.slug ? 'bg-[#0D47A1] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.cor || '#999' }} />
            {p.nome}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Sincronização de Portais</h1>
          <PlatformHealthBadge
            status={dashboard?.status_conexao || 'desconectado'}
            ultimoErro={dashboard?.ultimo_erro}
          />
          <Button size="sm" onClick={handleSyncNow} disabled={syncing} className="ml-auto">
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Sincronizar Agora
          </Button>
        </div>

        <PlatformStatsBar dashboard={dashboard} />

        {dashboard?.ultimo_erro && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-2 px-3 text-xs text-red-700">
              <strong>Último erro:</strong> {dashboard.ultimo_erro}
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar veículo por modelo, placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : veiculos.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-gray-500">
              Nenhum veículo encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {veiculos.map((v) => (
              <VehicleSyncCard
                key={v.id}
                veiculo={v}
                plataformas={plataformas}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
