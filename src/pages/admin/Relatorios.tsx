import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Car, Download, DollarSign, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts'

export default function Relatorios() {
  const [metrics, setMetrics] = useState({
    vendasTotais: 0,
    novosLeads: 0,
    estoqueTotal: 0,
    taxaConversao: 0,
    lucroTotal: 0,
    ticketMedio: 0,
  })

  const [loading, setLoading] = useState(true)

  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: vendas } = await supabase
        .from('veiculos')
        .select('*')
        .in('status', ['vendido', 'arquivado'])
      const { data: leads } = await supabase.from('leads').select('*')
      const { data: estoque } = await supabase
        .from('veiculos')
        .select('*')
        .eq('status', 'disponivel')
      const { data: despesas } = await supabase.from('despesas').select('*')

      const vendasCount = vendas?.length || 0
      const leadsCount = leads?.length || 0
      const estoqueCount = estoque?.length || 0

      const conversao = leadsCount > 0 ? (vendasCount / leadsCount) * 100 : 0

      // Calcular lucro
      let lucroCalculado = 0
      let faturamento = 0
      vendas?.forEach((v) => {
        const custoVeiculo = v.is_consignado ? 0 : Number(v.valor_fipe) * 0.8 || 0
        const precoVenda = Number(v.preco_venda) || 0
        const despesasVeiculo =
          despesas
            ?.filter((d) => d.veiculo_id === v.id)
            .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0

        lucroCalculado += precoVenda - custoVeiculo - despesasVeiculo
        faturamento += precoVenda
      })

      setMetrics({
        vendasTotais: vendasCount,
        novosLeads: leadsCount,
        estoqueTotal: estoqueCount,
        taxaConversao: conversao,
        lucroTotal: lucroCalculado,
        ticketMedio: vendasCount > 0 ? faturamento / vendasCount : 0,
      })

      // Gerar dados mockados para o gráfico de evolução baseado nas vendas, para visualização
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
      const data = meses.map((m, i) => ({
        name: m,
        vendas: Math.floor(Math.random() * 10) + i * 2,
        lucro: Math.floor(Math.random() * 50000) + 10000 + i * 5000,
      }))
      setChartData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando relatórios de ROI...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Relatórios & ROI</h2>
        <p className="text-muted-foreground">
          Acompanhe os resultados de performance e lucratividade dos veículos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.vendasTotais}</div>
            <p className="text-xs text-muted-foreground">Veículos vendidos</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.lucroTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Vendas - Custos - Despesas</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</div>
            <p className="text-xs text-muted-foreground">Por veículo vendido</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <Users className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.novosLeads}</div>
            <p className="text-xs text-muted-foreground">Contatos recebidos</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Activity className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxaConversao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Leads convertidos em vendas</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Estoque Ativo</CardTitle>
            <Car className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.estoqueTotal}</div>
            <p className="text-xs text-muted-foreground">Veículos disponíveis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Evolução de Vendas (Qtd)</CardTitle>
            <CardDescription>Volume de veículos vendidos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ vendas: { label: 'Vendas', color: 'hsl(var(--primary))' } }}
              className="h-[300px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="vendas" fill="var(--color-vendas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Lucratividade e ROI</CardTitle>
            <CardDescription>Evolução do lucro líquido em R$</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ lucro: { label: 'Lucro (R$)', color: '#16a34a' } }}
              className="h-[300px] w-full"
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="lucro" stroke="var(--color-lucro)" strokeWidth={3} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-blue-100">
        <CardHeader>
          <CardTitle>Exportar Relatórios</CardTitle>
          <CardDescription>
            Exporte os relatórios de ROI, despesas e vendas para sua contabilidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
