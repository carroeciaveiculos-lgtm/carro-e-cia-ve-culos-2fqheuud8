import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { fetchReviewVehicles, manualResync, type ReviewVehicle } from '@/services/portal-review'
import { ReviewVehicleCard } from '@/components/admin/portais/ReviewVehicleCard'
import { useToast } from '@/hooks/use-toast'

export default function PortalReview() {
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<ReviewVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [resyncing, setResyncing] = useState<Record<string, boolean>>({})

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchReviewVehicles()
      setVehicles(data)
    } catch {
      toast({ title: 'Erro ao carregar veículos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  const handleResync = async (veiculoId: string) => {
    setResyncing((p) => ({ ...p, [veiculoId]: true }))
    try {
      const result = await manualResync(veiculoId)
      if (result.success) {
        toast({ title: 'Sincronização iniciada para o veículo!' })
        setTimeout(loadVehicles, 3000)
      } else {
        toast({
          title: 'Erro na sincronização',
          description: result.error,
          variant: 'destructive',
        })
      }
    } finally {
      setResyncing((p) => ({ ...p, [veiculoId]: false }))
    }
  }

  const handleRefresh = () => {
    loadVehicles()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/portais"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Portais
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Revisão de Pendências</h1>
          <p className="text-sm text-gray-500 mt-1">
            Veículos com erros de sincronização ou aguardando revisão técnica
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg border text-center py-20 text-gray-500">
          Nenhum veículo com pendência. Tudo certo!
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            {vehicles.length} veículo(s) com pendências encontrados
          </div>
          {vehicles.map((v) => (
            <ReviewVehicleCard
              key={v.id}
              veiculo={v}
              onResync={handleResync}
              resyncing={resyncing[v.id] || false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
