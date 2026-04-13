import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Users, TrendingUp, DollarSign } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const data = [
  { name: 'Seg', leads: 4 },
  { name: 'Ter', leads: 7 },
  { name: 'Qua', leads: 5 },
  { name: 'Qui', leads: 9 },
  { name: 'Sex', leads: 12 },
  { name: 'Sáb', leads: 15 },
  { name: 'Dom', leads: 8 },
]

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Ativo</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">+2 adicionados esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads (Mês)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+14% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Meta: 25</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consignações Ativas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">3 pendentes de vistoria</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entrada de Leads (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                leads: {
                  label: 'Leads',
                  color: 'hsl(var(--primary))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <h4 className="font-semibold text-sm mb-1">Adicionar Veículo</h4>
              <p className="text-xs text-muted-foreground">
                Cadastrar novo carro no estoque com API FIPE.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <h4 className="font-semibold text-sm mb-1">Analisar Lead Pendente</h4>
              <p className="text-xs text-muted-foreground">
                Você tem 4 leads aguardando primeiro contato.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
