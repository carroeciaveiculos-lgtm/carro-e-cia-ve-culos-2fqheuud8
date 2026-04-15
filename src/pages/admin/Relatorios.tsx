import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp, Car, Clock, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function Relatorios() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    estoqueTotal: 0,
    vendidosMes: 0,
    tempoMedioVenda: 15,
    margemMedia: 8,
    ticketMedio: 48500,
    encalhados: 0,
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const { count: estoqueTotal } = await supabase
        .from('veiculos')
        .select('*', { count: 'exact' })
        .eq('status', 'disponivel')
      const { count: vendidosMes } = await supabase
        .from('veiculos')
        .select('*', { count: 'exact' })
        .eq('status', 'vendido')

      const { data: encalhadosData } = await supabase
        .from('veiculos')
        .select('created_at')
        .eq('status', 'disponivel')
      let encalhados = 0
      if (encalhadosData) {
        const trintaDiasAtras = new Date()
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 90)
        encalhados = encalhadosData.filter((v) => new Date(v.created_at) < trintaDiasAtras).length
      }

      setMetrics({
        estoqueTotal: estoqueTotal || 0,
        vendidosMes: vendidosMes || 0,
        tempoMedioVenda: 18, // Mocked complex calculation
        margemMedia: 12.5,
        ticketMedio: 62400,
        encalhados,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const dataEvolucao = [
    { name: 'Sem 1', estoque: 15 },
    { name: 'Sem 2', estoque: 18 },
    { name: 'Sem 3', estoque: 16 },
    { name: 'Sem 4', estoque: 20 },
  ]

  const dataMarcas = [
    { name: 'Fiat', value: 400 },
    { name: 'VW', value: 300 },
    { name: 'Chevrolet', value: 300 },
    { name: 'Outros', value: 200 },
  ]
  const COLORS = ['#0D47A1', '#1976D2', '#42A5F5', '#90CAF9']

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-6 h-6 text-blue-600" /> Dashboard de Inventário
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão analítica completa da sua operação de vendas.
          </p>
        </div>
        <Button className="bg-slate-800 hover:bg-slate-900 text-white font-medium">
          <Download className="w-4 h-4 mr-2" /> Exportar para Excel (.xlsx)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Car className="w-5 h-5" />{' '}
              <span className="text-sm font-bold uppercase">Em Estoque</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{metrics.estoqueTotal}</h2>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <TrendingUp className="w-5 h-5" />{' '}
              <span className="text-sm font-bold uppercase">Vendas Mês</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{metrics.vendidosMes}</h2>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Clock className="w-5 h-5" />{' '}
              <span className="text-sm font-bold uppercase">Tempo Médio</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">
              {metrics.tempoMedioVenda}{' '}
              <span className="text-sm font-medium text-slate-400">dias</span>
            </h2>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <DollarSign className="w-5 h-5" />{' '}
              <span className="text-sm font-bold uppercase">Ticket Médio</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              R$ {metrics.ticketMedio.toLocaleString('pt-BR')}
            </h2>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />{' '}
              <span className="text-sm font-bold uppercase">Encalhados</span>
            </div>
            <h2 className="text-3xl font-bold text-red-800">
              {metrics.encalhados}{' '}
              <span className="text-sm font-medium text-red-500">&gt; 90 dias</span>
            </h2>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 uppercase font-bold">
              Evolução do Estoque (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="estoque"
                    stroke="#0D47A1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0D47A1' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 uppercase font-bold">
              Distribuição por Marca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataMarcas}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataMarcas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
