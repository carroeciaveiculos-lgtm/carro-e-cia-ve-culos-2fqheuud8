import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { BarChart as BarChartIcon, Calendar, Users, TrendingUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Relatorios() {
  const [leads, setLeads] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('30')
  const [vendedorFilter, setVendedorFilter] = useState('todos')

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - parseInt(periodo))

      let query = supabase
        .from('leads')
        .select('*, responsavel:usuarios(id, nome)')
        .gte('created_at', dateLimit.toISOString())

      if (vendedorFilter !== 'todos') {
        query = query.eq('responsavel_id', vendedorFilter)
      }

      const [leadsRes, vendRes] = await Promise.all([
        query,
        supabase.from('usuarios').select('id, nome').eq('role', 'vendedor'),
      ])

      if (leadsRes.data) setLeads(leadsRes.data)
      if (vendRes.data) setVendedores(vendRes.data)

      setLoading(false)
    }

    loadData()
  }, [periodo, vendedorFilter])

  const chartDataVolume = useMemo(() => {
    const dataByDate: Record<string, number> = {}

    leads.forEach((l) => {
      const date = new Date(l.created_at).toLocaleDateString('pt-BR')
      dataByDate[date] = (dataByDate[date] || 0) + 1
    })

    return Object.entries(dataByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split('/')
        const [db, mb, yb] = b.date.split('/')
        return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db}`).getTime()
      })
  }, [leads])

  const chartDataConversao = useMemo(() => {
    const perf: Record<string, { total: number; fechados: number; nome: string }> = {}

    leads.forEach((l) => {
      const respId = l.responsavel_id || 'sem_dono'
      const nome = l.responsavel?.nome || 'IA / Não Atribuído'

      if (!perf[respId]) perf[respId] = { total: 0, fechados: 0, nome }

      perf[respId].total += 1
      if (l.status === 'fechado') perf[respId].fechados += 1
    })

    return Object.values(perf).map((p) => ({
      nome: p.nome,
      total: p.total,
      fechados: p.fechados,
      taxa: p.total > 0 ? Math.round((p.fechados / p.total) * 100) : 0,
    }))
  }, [leads])

  const totalLeads = leads.length
  const fechados = leads.filter((l) => l.status === 'fechado').length
  const conversaoGeral = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : '0.0'

  return (
    <div className="flex-1 p-4 md:p-8 bg-[#F4F6F8] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <BarChartIcon className="w-6 h-6 text-blue-600" />
              Visão Geral & ROI
            </h1>
            <p className="text-slate-500 text-sm">
              Acompanhe a performance de vendas e fluxo de leads.
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[150px] bg-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Vendedores</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total de Leads</p>
                  <h3 className="text-2xl font-bold text-slate-800">{totalLeads}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Vendas Fechadas</p>
                  <h3 className="text-2xl font-bold text-slate-800">{fechados}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <BarChartIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Taxa de Conversão</p>
                  <h3 className="text-2xl font-bold text-slate-800">{conversaoGeral}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border-none">
            <p className="text-slate-500">Carregando dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Volume de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ count: { label: 'Leads', color: 'hsl(var(--primary))' } }}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    data={chartDataVolume}
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-count)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Conversão por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    fechados: { label: 'Vendas', color: '#16a34a' },
                    total: { label: 'Leads', color: '#94a3b8' },
                  }}
                  className="h-[300px] w-full"
                >
                  <BarChart
                    data={chartDataConversao}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="total"
                      fill="var(--color-total)"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="fechados"
                      fill="var(--color-fechados)"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
