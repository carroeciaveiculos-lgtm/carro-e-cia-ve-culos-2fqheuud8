import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, Calendar, ClipboardCheck, Settings, TrendingUp } from 'lucide-react'

export default function Avaliacao() {
  const [activeTab, setActiveTab] = useState('historico')

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-blue-600" /> Avaliação de Veículos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie agendamentos e histórico de precificação.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="historico">
            <Calendar className="w-4 h-4 mr-2" /> Agendamentos & Histórico
          </TabsTrigger>
          <TabsTrigger value="parametros">
            <Settings className="w-4 h-4 mr-2" /> Parâmetros de Avaliação
          </TabsTrigger>
          <TabsTrigger value="relatorios">
            <TrendingUp className="w-4 h-4 mr-2" /> Relatórios de Preço
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input placeholder="Buscar placa ou cliente..." className="pl-9" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">Novo Agendamento</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Valor FIPE</TableHead>
                <TableHead>Valor Avaliado</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>15/04/2026 10:00</TableCell>
                <TableCell>João Silva</TableCell>
                <TableCell>Fiat Uno (ABC-1234)</TableCell>
                <TableCell>R$ 45.000</TableCell>
                <TableCell>R$ 41.000</TableCell>
                <TableCell>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">
                    Agendada
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="parametros" className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-4">Regras de Precificação</h3>
          <p className="text-sm text-slate-500 mb-6">
            Defina as regras automáticas que o sistema usará para sugerir o valor de captação.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condição</TableHead>
                <TableHead>Ajuste (%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Quilometragem &gt; 100.000 km</TableCell>
                <TableCell className="text-red-600 font-bold">- 10%</TableCell>
                <TableCell>Ativo</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Passagem por Leilão</TableCell>
                <TableCell className="text-red-600 font-bold">- 20%</TableCell>
                <TableCell>Ativo</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="relatorios" className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-4">Análise de Lucratividade</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">R$ 48.500</div>
                <div className="text-sm text-slate-500">Ticket Médio de Captação</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">+ 12.5%</div>
                <div className="text-sm text-slate-500">Margem Média vs FIPE</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-slate-500">Avaliações no Mês</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
