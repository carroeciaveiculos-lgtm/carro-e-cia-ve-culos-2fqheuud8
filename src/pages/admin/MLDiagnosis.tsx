import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { fetchDiagnosisVehicles, type DiagnosisVehicle } from '@/services/ml-sync-advanced'

export default function MLDiagnosis() {
  const [vehicles, setVehicles] = useState<DiagnosisVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadVehicles = useCallback(async () => {
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
    loadVehicles()
  }, [loadVehicles])

  const ready = vehicles.filter((v) => v.status === 'ready').length
  const pending = vehicles.filter((v) => v.status === 'pending').length
  const blocked = vehicles.filter((v) => v.status === 'blocked').length

  const statusConfig = {
    ready: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Pronto',
      badge: 'bg-green-100 text-green-700',
    },
    pending: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      label: 'Pendente',
      badge: 'bg-yellow-100 text-yellow-700',
    },
    blocked: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Bloqueado',
      badge: 'bg-red-100 text-red-700',
    },
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
          <h1 className="text-xl font-bold text-gray-800">
            Diagnóstico do Estoque — Mercado Livre
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Validação em tempo real de prontidão para sincronização
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadVehicles}>
          <RefreshCw className="w-4 h-4 mr-2" /> Recalcular
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className={`p-4 ${statusConfig.ready.bg}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-5 h-5 ${statusConfig.ready.color}`} />
            <div>
              <p className="text-2xl font-bold">{ready}</p>
              <p className="text-xs text-gray-600">Prontos</p>
            </div>
          </div>
        </Card>
        <Card className={`p-4 ${statusConfig.pending.bg}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${statusConfig.pending.color}`} />
            <div>
              <p className="text-2xl font-bold">{pending}</p>
              <p className="text-xs text-gray-600">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card className={`p-4 ${statusConfig.blocked.bg}`}>
          <div className="flex items-center gap-2">
            <XCircle className={`w-5 h-5 ${statusConfig.blocked.color}`} />
            <div>
              <p className="text-2xl font-bold">{blocked}</p>
              <p className="text-xs text-gray-600">Bloqueados</p>
            </div>
          </div>
        </Card>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg border text-center py-20 text-gray-500">
          Nenhum veículo disponível.
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => {
            const cfg = statusConfig[v.status]
            const isExpanded = expanded === v.id
            return (
              <Card key={v.id} className="p-3 border-gray-200">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : v.id)}
                >
                  <cfg.icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {v.marca} {v.modelo} {v.versao || ''}
                    </p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{v.ano_modelo || 'N/A'}</span>
                      <span>·</span>
                      <span>{v.placa || 'S/ Placa'}</span>
                      <span>·</span>
                      <span>{v.fotos?.length || 0} fotos</span>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${cfg.badge}`}>{cfg.label}</Badge>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2 animate-fade-in">
                    {v.validation.blockingErrors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-red-700">Bloqueios:</p>
                        {v.validation.blockingErrors.map((e, i) => (
                          <p key={i} className="text-xs text-red-600 pl-3">
                            • {e}
                          </p>
                        ))}
                      </div>
                    )}
                    {v.validation.qualityAlerts.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-yellow-700">Alertas:</p>
                        {v.validation.qualityAlerts.map((e, i) => (
                          <p key={i} className="text-xs text-yellow-600 pl-3">
                            • {e}
                          </p>
                        ))}
                      </div>
                    )}
                    {v.validation.success && v.validation.qualityAlerts.length === 0 && (
                      <p className="text-xs text-green-600">Veículo pronto para sincronização!</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
