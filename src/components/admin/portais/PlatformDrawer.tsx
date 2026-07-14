import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AdQualityBadge } from './AdQualityBadge'
import { calculateAdQualityScore, getQualityLabel } from '@/lib/ad-quality-score'
import { getImageUrl } from '@/lib/image-utils'
import type { VeiculoSync, Plataforma } from '@/services/plataformas'

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

const AD_TYPE_OPTIONS = [
  { value: 'gold_pro', label: 'Diamante' },
  { value: 'gold_special', label: 'Ouro' },
  { value: 'silver', label: 'Prata' },
]

interface Props {
  vehicle: VeiculoSync | null
  plataformas: Plataforma[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggle: (slug: string, veiculoId: string, publicar: boolean) => void
  onUpdateAdType: (veiculoId: string, platform: string, adType: string) => void
  toggling: Record<string, boolean>
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-24">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-gray-600 w-10 text-right">
        {value}/{max}
      </span>
    </div>
  )
}

export function PlatformDrawer({
  vehicle,
  plataformas,
  open,
  onOpenChange,
  onToggle,
  onUpdateAdType,
  toggling,
}: Props) {
  if (!vehicle) return null
  const score = calculateAdQualityScore(vehicle)
  const foto = vehicle.fotos?.[0]
    ? getImageUrl(vehicle.fotos[0])
    : 'https://img.usecurling.com/p/400/300?q=car'
  const getAdType = (slug: string) => {
    if (slug === 'mercadolivre') return vehicle.ml_listing_type || 'gold_special'
    return ((vehicle.ad_types as Record<string, string>) || {})[slug] || 'gold_special'
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">Gerenciar Portais</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex gap-3">
          <img
            src={foto}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="w-24 h-18 object-cover rounded-lg shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">
              {vehicle.marca} {vehicle.modelo} {vehicle.versao || ''}
            </h3>
            <p className="text-xs text-gray-500">
              {vehicle.ano_modelo} · {Number(vehicle.quilometragem || 0).toLocaleString('pt-BR')} km
              · {vehicle.placa}
            </p>
            <p className="font-bold text-green-700 text-sm mt-1">
              R${' '}
              {Number(vehicle.preco_venda || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
          <AdQualityBadge score={score.score} size="md" />
        </div>

        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-bold text-gray-600 mb-2">
            Qualidade do Anúncio: {getQualityLabel(score.score)}
          </p>
          <div className="space-y-1">
            <ScoreBar label="Fotos" value={score.breakdown.photos} max={40} />
            <ScoreBar label="Info Básica" value={score.breakdown.basicInfo} max={30} />
            <ScoreBar label="Descrição" value={score.breakdown.description} max={20} />
            <ScoreBar label="Specs Técnicas" value={score.breakdown.techSpecs} max={10} />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <h4 className="font-bold text-sm text-gray-700">Plataformas</h4>
          {plataformas.map((p) => {
            const field = SLUG_MAP[p.slug]
            const published = vehicle[field] as boolean
            const toggleKey = `${vehicle.id}-${p.slug}`
            return (
              <div key={p.slug} className="flex items-center gap-3 p-3 border rounded-lg">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.cor || '#999' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.nome}</p>
                  <Badge
                    variant={published ? 'default' : 'secondary'}
                    className={`text-[10px] ${published ? 'bg-green-100 text-green-700' : ''}`}
                  >
                    {published ? 'Publicado' : 'Não publicado'}
                  </Badge>
                </div>
                <Select
                  value={getAdType(p.slug)}
                  onValueChange={(v) => onUpdateAdType(vehicle.id, p.slug, v)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Switch
                  checked={published || false}
                  disabled={toggling[toggleKey]}
                  onCheckedChange={(val) => onToggle(p.slug, vehicle.id, val)}
                />
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
