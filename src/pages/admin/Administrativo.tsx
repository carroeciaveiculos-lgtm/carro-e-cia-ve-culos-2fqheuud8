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
import { FileText, FileDown, Receipt, PieChart, Plus } from 'lucide-react'

export default function Administrativo() {
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Administrativo e Notas Fiscais
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão financeira, emissão de NFs e controle de despesas.
          </p>
        </div>
      </div>

      <Tabs defaultValue="notas" className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto p-1">
          <TabsTrigger value="notas" className="flex-1">
            <FileDown className="w-4 h-4 mr-2" /> Notas Fiscais
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex-1">
            <Receipt className="w-4 h-4 mr-2" /> Despesas
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex-1">
            <FileText className="w-4 h-4 mr-2" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex-1">
            <PieChart className="w-4 h-4 mr-2" /> Relatórios DRE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Notas Fiscais Emitidas</h3>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Emitir NF-e
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono">NF-00123</TableCell>
                  <TableCell>14/04/2026</TableCell>
                  <TableCell>Maria Silva</TableCell>
                  <TableCell>R$ 45.000,00</TableCell>
                  <TableCell>
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                      Autorizada
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="despesas" className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Contas a Pagar / Despesas</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nova Despesa
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>20/04/2026</TableCell>
                  <TableCell>Marketing</TableCell>
                  <TableCell>Anúncios Webmotors</TableCell>
                  <TableCell>R$ 850,00</TableCell>
                  <TableCell>
                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold">
                      A Pagar
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-6">Resumo Financeiro (Mês Atual)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">R$ 150.000,00</div>
                <div className="text-sm text-slate-500">Receita Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">R$ 45.000,00</div>
                <div className="text-sm text-slate-500">Despesas Totais</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">R$ 105.000,00</div>
                <div className="text-sm text-slate-500">Lucro Líquido</div>
              </CardContent>
            </Card>
          </div>
          <Button className="w-full sm:w-auto" variant="outline">
            Exportar DRE Completo (PDF)
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
