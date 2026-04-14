import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Users, Calendar, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    estoque: 0,
    leadsConsignacao: 0,
    leadsCompra: 0,
    vendasMes: 0,
  })
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const p1 = supabase
        .from('veiculos')
        .select('id', { count: 'exact' })
        .in('status', ['disponivel', 'reservado'])
      const p2 = supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('tipo', 'consignacao')
        .gte('created_at', firstDay)
      const p3 = supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .in('tipo', ['compra', 'interesse_veiculo'])
        .gte('created_at', firstDay)
      const p4 = supabase
        .from('veiculos')
        .select('id', { count: 'exact' })
        .eq('status', 'vendido')
        .gte('updated_at', firstDay)
      const p5 = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      const [r1, r2, r3, r4, r5] = await Promise.all([p1, p2, p3, p4, p5])

      setMetrics({
        estoque: r1.count || 0,
        leadsConsignacao: r2.count || 0,
        leadsCompra: r3.count || 0,
        vendasMes: r4.count || 0,
      })

      if (r5.data) setActivities(r5.data)
    }
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Veículos no Pátio
            </CardTitle>
            <Car className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.estoque}</div>
            <p className="text-xs text-muted-foreground mt-1">Disponíveis ou reservados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Consignação
            </CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.leadsConsignacao}</div>
            <p className="text-xs text-muted-foreground mt-1">Neste mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Compra
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.leadsCompra}</div>
            <p className="text-xs text-muted-foreground mt-1">Neste mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Realizadas
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.vendasMes}</div>
            <p className="text-xs text-muted-foreground mt-1">Neste mês</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Atividades (Leads)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
            ) : (
              activities.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{lead.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Novo contato de {lead.tipo === 'consignacao' ? 'Consignação' : 'Compra'} via{' '}
                      {lead.origem}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium capitalize">
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
