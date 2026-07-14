import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTiersForPlatform, hasTiers } from '@/lib/platform-tiers'
import type { VeiculoSync } from '@/services/plataformas'

interface Props {
  plataforma: { slug: string; nome: string }
  veiculo: VeiculoSync
  onUpdateAdType: (veiculoId: string, platform: string, adType: string) => void
}

export function PortalTierSelector({ plataforma, veiculo, onUpdateAdType }: Props) {
  const tiers = getTiersForPlatform(plataforma.slug)
  if (!hasTiers(plataforma.slug)) {
    return <span className="text-xs text-gray-400">Sem modalidade disponível</span>
  }

  const currentValue =
    plataforma.slug === 'mercadolivre'
      ? veiculo.ml_listing_type || 'gold_special'
      : (veiculo.ad_types?.[plataforma.slug] as string) || tiers[0]?.value || ''

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 whitespace-nowrap">Modalidade:</span>
      <Select
        value={currentValue}
        onValueChange={(v) => onUpdateAdType(veiculo.id, plataforma.slug, v)}
      >
        <SelectTrigger className="h-7 w-[180px] text-xs">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {tiers.map((t) => (
            <SelectItem key={t.value} value={t.value} className="text-xs">
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
