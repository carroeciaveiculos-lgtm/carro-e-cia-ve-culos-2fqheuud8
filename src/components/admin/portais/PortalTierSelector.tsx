import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { getTiersForPlatform, hasTiers, getDefaultTierValue } from '@/lib/platform-tiers'
import { getDiamondQuota } from '@/services/listing-preferences'
import type { VeiculoSync } from '@/services/plataformas'

interface Props {
  plataforma: { slug: string; nome: string }
  veiculo: VeiculoSync
  onUpdateAdType: (veiculoId: string, platform: string, adType: string) => void | Promise<void>
}

export function PortalTierSelector({ plataforma, veiculo, onUpdateAdType }: Props) {
  const [saving, setSaving] = useState(false)
  const [diamondQuota, setDiamondQuota] = useState<{ used: number; limit: number } | null>(null)
  const tiers = getTiersForPlatform(plataforma.slug)

  useEffect(() => {
    if (plataforma.slug === 'mercadolivre') {
      getDiamondQuota().then(setDiamondQuota)
    }
  }, [plataforma.slug])

  if (!hasTiers(plataforma.slug)) {
    return <span className="text-xs text-gray-400">Sem modalidade disponível</span>
  }

  const defaultTier = getDefaultTierValue(plataforma.slug)
  const currentValue =
    plataforma.slug === 'mercadolivre'
      ? veiculo.ml_listing_type || defaultTier
      : (veiculo.ad_types?.[plataforma.slug] as string) || defaultTier

  const isDiamondFull = diamondQuota ? diamondQuota.used >= diamondQuota.limit : false
  const isCurrentDiamond = currentValue === 'gold_pro'

  const handleChange = async (v: string) => {
    setSaving(true)
    try {
      await onUpdateAdType(veiculo.id, plataforma.slug, v)
      if (plataforma.slug === 'mercadolivre') {
        getDiamondQuota().then(setDiamondQuota)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 whitespace-nowrap">Modalidade:</span>
      <Select value={currentValue} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger className="h-7 w-[180px] text-xs">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {tiers.map((t) => {
            const isDisabled = t.value === 'gold_pro' && isDiamondFull && !isCurrentDiamond
            return (
              <SelectItem key={t.value} value={t.value} className="text-xs" disabled={isDisabled}>
                {t.label}
                {isDisabled && ' (limite atingido)'}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      {plataforma.slug === 'mercadolivre' && diamondQuota && (
        <span
          className={`text-[10px] ${isDiamondFull ? 'text-red-600 font-bold' : 'text-gray-500'}`}
        >
          {diamondQuota.used}/{diamondQuota.limit} anúncios Diamante utilizados
        </span>
      )}
    </div>
  )
}
