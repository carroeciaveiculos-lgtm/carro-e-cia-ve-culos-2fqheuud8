import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function Relatorios() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">RELATÓRIOS E ESTATÍSTICAS</h1>
        <Button className="bg-[#1976D2] hover:bg-[#1565C0]">
          <Download className="w-4 h-4 mr-2" /> Exportar Geral PDF
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50 border-b pb-4">
            <CardTitle className="text-lg text-[#0D47A1]">Relatório de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Veículos Disponíveis</span>
              <span className="font-bold text-gray-900">42</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Vendidos no Mês</span>
              <span className="font-bold text-gray-900">8</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-600 font-medium">Valor Total em Estoque</span>
              <span className="font-bold text-[#2E7D32] text-lg">R$ 2.450.000</span>
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs font-bold text-gray-600">
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50 border-b pb-4">
            <CardTitle className="text-lg text-[#0D47A1]">Relatório de Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Novos Leads no Mês</span>
              <span className="font-bold text-gray-900">156</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Taxa de Conversão</span>
              <span className="font-bold text-gray-900">5.1%</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-600 font-medium">Origem Principal</span>
              <span className="font-bold text-[#E65100]">WhatsApp</span>
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs font-bold text-gray-600">
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50 border-b pb-4">
            <CardTitle className="text-lg text-[#0D47A1]">Relatório de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Ticket Médio</span>
              <span className="font-bold text-gray-900">R$ 58.000</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Top Vendedor</span>
              <span className="font-bold text-gray-900">Luiz Fernando</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-600 font-medium">Modelo Mais Vendido</span>
              <span className="font-bold text-gray-900">Fiat Strada</span>
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs font-bold text-gray-600">
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
