import { FileText } from 'lucide-react'
import { RelatorioEstoque } from '@/components/admin/relatorios/RelatorioEstoque'

// Atalho do menu Estoque/Portais (09/11/2026, pedido da Adriana): o relatório de estoque
// (com impressão em PDF) numa página própria, sem precisar ir ao menu Institucional.
// Usa o mesmo componente da aba "Estoque" de Relatórios Gerenciais.
export default function RelatorioEstoquePagina() {
  return (
    <div className="flex-1 p-4 md:p-8 bg-[#F4F6F8] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Relatório de Estoque
        </h1>
        <RelatorioEstoque />
      </div>
    </div>
  )
}
