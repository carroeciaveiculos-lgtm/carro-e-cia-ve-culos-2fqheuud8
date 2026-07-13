import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getImageUrl } from '@/lib/image-utils'
import { ChevronDown, Settings2 } from 'lucide-react'
import type { VeiculoSync, Plataforma } from '@/services/plataformas'

interface Props {
  veiculo: VeiculoSync
  plataformas: Plataforma[]
  onToggle: (slug: string, veiculoId: string, publicar: boolean) => void
  toggling: Record<string, boolean>
  onUpdateListingType: (veiculoId: string, listingType: string) => void
}

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

export function VehicleSyncCard({
  veiculo,
  plataformas,
  onToggle,
  toggling,
  onUpdateListingType,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const foto = veiculo.fotos?.[0]
    ? getImageUrl(veiculo.fotos[0])
    : 'https://img.usecurling.com/p/400/300?q=car'

  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        <img
          src={foto}
          alt={`${veiculo.marca} ${veiculo.modelo}`}
          className="w-28 h-20 object-cover rounded-md bg-muted shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm truncate">
              {veiculo.marca} {veiculo.modelo} {veiculo.versao || ''}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary" className="text-[10px]">
                {veiculo.ano_modelo || 'N/A'}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {veiculo.placa || 'S/ Placa'}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {Number(veiculo.quilometragem || 0).toLocaleString('pt-BR')} km
              </Badge>
            </div>
          </div>
          <p className="text-primary font-bold text-sm">
            R${' '}
            {Number(veiculo.preco_venda || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
          {plataformas.map((p) => {
            const field = SLUG_MAP[p.slug]
            const checked = veiculo[field] as boolean
            const toggleKey = `${veiculo.id}-${p.slug}`
            return (
              <div key={p.slug} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.cor || '#999' }}
                />
                <span className="text-[10px] font-medium hidden sm:inline w-16 truncate">
                  {p.nome}
                </span>
                <Switch
                  checked={checked || false}
                  disabled={toggling[toggleKey]}
                  onCheckedChange={(val) => onToggle(p.slug, veiculo.id, val)}
                  className="scale-75 origin-center"
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Configurar Anúncios
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        {expanded && (
          <div className="px-3 pb-3 space-y-2 bg-gray-50/50">
            <div className="flex items-center gap-2 py-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: '#FFF059' }}
              />
              <span className="text-xs font-medium flex-1">Mercado Livre</span>
              <Select
                value={veiculo.ml_listing_type || 'gold_special'}
                onValueChange={(v) => onUpdateListingType(veiculo.id, v)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold_pro">Diamante</SelectItem>
                  <SelectItem value="gold_special">Ouro</SelectItem>
                  <SelectItem value="silver">Prata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
