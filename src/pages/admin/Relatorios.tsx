import { BarChart as BarChartIcon, Users, Car, Trophy } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RelatorioLeads } from '@/components/admin/relatorios/RelatorioLeads'
import { RelatorioEstoque } from '@/components/admin/relatorios/RelatorioEstoque'
import { RelatorioClientes } from '@/components/admin/relatorios/RelatorioClientes'

// Relatórios Gerenciais (15/09/2026, pedido da Adriana) — uma página com
// abas por assunto, em vez de um item de menu pra cada relatório.
export default function Relatorios() {
  return (
    <div className="flex-1 p-4 md:p-8 bg-[#F4F6F8] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <BarChartIcon className="w-6 h-6 text-blue-600" />
            Relatórios Gerenciais
          </h1>
        </div>

        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Leads
            </TabsTrigger>
            <TabsTrigger value="estoque" className="flex items-center gap-2">
              <Car className="w-4 h-4" /> Estoque
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Clientes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="leads">
            <RelatorioLeads />
          </TabsContent>
          <TabsContent value="estoque">
            <RelatorioEstoque />
          </TabsContent>
          <TabsContent value="clientes">
            <RelatorioClientes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
