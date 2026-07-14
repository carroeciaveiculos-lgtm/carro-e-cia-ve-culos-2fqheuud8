import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Loader2, TrendingUp, DollarSign, Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getTierLabel } from '@/lib/platform-tiers'

interface ConversionData {
  platform: string
  ad_tier: string
  total_leads: number
  lead_conversions: number
  vehicles_sold: number
  estimated_revenue: number
}

export function ConversionMonitor() {
  const [data, setData] = useState<ConversionData[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ leads: 0, conversions: 0, sold: 0, revenue: 0 })

  useEffect(() => {
    const load = async () => {
      const { data: pubs } = await supabase
        .from('estoque_publicacoes')
        .select('platform, veiculo_id, veiculos(ad_types, ml_listing_type, status, preco_venda)')

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
        const v = p.veiculos
        const tier =
          v?.ml_listing_type && p.platform === 'mercadolivre'
            ? v.ml_listing_type
            : (v?.ad_types?.[p.platform] ?? 'padrao')
        const key = `${p.platform}-${tier}`

        if (!map[key]) {
          map[key] = {
            platform: p.platform,
            ad_tier: tier,
            total_leads: 0,
            lead_conversions: 0,
            vehicles_sold: 0,
            estimated_revenue: 0,
          }
        }

        const leadsForVehicle = leadCountByVehicle[p.veiculo_id] || 0
        map[key].total_leads += leadsForVehicle
        if (leadsForVehicle > 0) map[key].lead_conversions += 1
        if (v?.status === 'Vendido') {
          map[key].vehicles_sold += 1
          map[key].estimated_revenue += v?.preco_venda || 0
        }
      }

      const sorted = Object.values(map).sort((a, b) => b.total_leads - a.total_leads)
      setData(sorted)

      setTotals({
        leads: sorted.reduce((s, d) => s + d.total_leads, 0),
        conversions: sorted.reduce((s, d) => s + d.lead_conversions, 0),
        sold: sorted.reduce((s, d) => s + d.vehicles_sold, 0),
        revenue: sorted.reduce((s, d) => s + d.estimated_revenue, 0),
      })
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
      <div className="text-center py-8 text-gray-500 text-sm">Sem dados de conversão ainda.</div>
    )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Leads</p>
              <p className="text-2xl font-bold text-blue-900">{totals.leads}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-300" />
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Conversões</p>
              <p className="text-2xl font-bold text-green-900">{totals.conversions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-300" />
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Vendidos</p>
              <p className="text-2xl font-bold text-purple-900">{totals.sold}</p>
            </div>
            <Car className="w-8 h-8 text-purple-300" />
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">Receita Est.</p>
              <p className="text-2xl font-bold text-amber-900">
                R$ {(totals.revenue / 1000).toFixed(0)}k
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-300" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {data.map((d, i) => {
          const conversionRate =
            d.total_leads > 0 ? ((d.lead_conversions / d.total_leads) * 100).toFixed(1) : '0'
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
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
                <span className="text-green-600 font-medium">{d.lead_conversions} conv.</span>
                <span className="text-purple-600 font-medium">{d.vehicles_sold} vend.</span>
                <span className="text-blue-600 font-bold">{conversionRate}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
