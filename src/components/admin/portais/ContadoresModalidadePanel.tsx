import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getContadoresModalidadeTodasPlataformas,
  type ContadorModalidade,
} from '@/services/platform-sync'

// Pedido da Adriana 28/08/2026: antes só existia contador de modalidade pra
// Webmotors (vagas contratadas). Este painel junta as 4 plataformas com
// modalidade (Webmotors, Mercado Livre, NaPista, OLX) num só lugar.
export function ContadoresModalidadePanel() {
  const [dados, setDados] = useState<ContadorModalidade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContadoresModalidadeTodasPlataformas()
      .then(setDados)
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  if (dados.length === 0) return null

  const porPlataforma = dados.reduce<Record<string, ContadorModalidade[]>>((acc, d) => {
    ;(acc[d.plataforma] ||= []).push(d)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-lg border p-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Veículos por modalidade</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(porPlataforma).map(([plataforma, itens]) => (
          <div key={plataforma} className="border rounded-md p-2">
            <Badge variant="secondary" className="text-[9px] mb-1.5">
              {plataforma}
            </Badge>
            <div className="space-y-1">
              {itens.map((item) => (
                <div
                  key={item.modalidade}
                  className="flex items-center justify-between text-xs text-gray-600"
                >
                  <span className="truncate pr-2">{item.modalidade}</span>
                  <span className="font-semibold text-gray-800 shrink-0">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
