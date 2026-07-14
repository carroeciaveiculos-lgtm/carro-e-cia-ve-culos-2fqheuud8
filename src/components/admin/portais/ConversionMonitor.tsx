import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Loader2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTierLabel } from '@/lib/platform-tiers'

interface ConversionData {
  platform: string
  ad_tier: string
  total_leads: number
  lead_conversions: number
}

export function ConversionMonitor() {
  const [data, setData] = useState<ConversionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: pubs } = await supabase
        .from('estoque_publicacoes')
        .select('platform, veiculo_id, veiculos(ad_types, ml_listing_type)')
      const { data: leads } = await supabase
        .from('leads')
        .select('id, veiculo_id')
        .not('veiculo_id', 'is', null)

      if (!pubs || !leads) {
        setLoading(false)
        return
      }

      const leadCountByVehicle: Record<string, number> = {}
      for (const l of leads) {
        const vid = l.veiculo_id as string
        leadCountByVehicle[vid] = (leadCountByVehicle[vid] || 0) + 1
      }

      const map: Record<string, ConversionData> = {}
      for (const p of pubs as any[]) {
        const tier =
          p.veiculos?.ml_listing_type && p.platform === 'mercadolivre'
            ? p.veiculos.ml_listing_type
            : (p.veiculos?.ad_types?.[p.platform] ?? 'padrao')
        const key = `${p.platform}-${tier}`
        if (!map[key]) {
          map[key] = { platform: p.platform, ad_tier: tier, total_leads: 0, lead_conversions: 0 }
        }
        const leadsForVehicle = leadCountByVehicle[p.veiculo_id] || 0
        map[key].total_leads += leadsForVehicle
        if (leadsForVehicle > 0) map[key].lead_conversions += 1
      }

      setData(Object.values(map).sort((a, b) => b.total_leads - a.total_leads))
      setLoading(false)
    }
    load()
  }, [])

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  if (data.length === 0)
    return (
      <div className="text-center py-8 text-gray-500 text-sm">Sem dados de conversao ainda.</div>
    )

  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-[9px]">
              {d.platform}
            </Badge>
            <span className="text-sm font-medium text-gray-700">
              {getTierLabel(d.platform, d.ad_tier) || d.ad_tier || 'Padrão'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{d.total_leads} leads</span>
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <TrendingUp className="w-3 h-3" /> {d.lead_conversions} conv.
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
