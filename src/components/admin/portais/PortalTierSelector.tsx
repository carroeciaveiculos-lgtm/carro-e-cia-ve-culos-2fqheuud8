import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { getTiersForPlatform, hasTiers, getDefaultTierValue } from '@/lib/platform-tiers'
import type { VeiculoSync } from '@/services/plataformas'

interface Props {
  plataforma: { slug: string; nome: string }
  veiculo: VeiculoSync
  onUpdateAdType: (veiculoId: string, platform: string, adType: string) => Promise<void>
}

export function PortalTierSelector({ plataforma, veiculo, onUpdateAdType }: Props) {
  const [saving, setSaving] = useState(false)
  const tiers = getTiersForPlatform(plataforma.slug)

  if (!hasTiers(plataforma.slug)) {
    return <span className="text-xs text-gray-400">Sem modalidade disponível</span>
  }

  const defaultTier = getDefaultTierValue(plataforma.slug)
  const currentValue =
    plataforma.slug === 'mercadolivre'
      ? veiculo.ml_listing_type || defaultTier
      : (veiculo.ad_types?.[plataforma.slug] as string) || defaultTier

  const handleChange = async (v: string) => {
    setSaving(true)
    try {
      await onUpdateAdType(veiculo.id, plataforma.slug, v)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 whitespace-nowrap">Modalidade:</span>
      <Select value={currentValue} onValueChange={handleChange} disabled={saving}>
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
      {saving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
    </div>
  )
}
