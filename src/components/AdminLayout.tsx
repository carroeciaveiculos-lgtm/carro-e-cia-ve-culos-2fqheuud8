import { Outlet, useLocation, Link } from 'react-router-dom'
import { AdminHeader } from './admin/AdminHeader'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

const HIERARCHY = {
  estoque: [
    { label: 'Consulta de Estoque', path: '/admin/estoque' },
    { label: 'Cadastro de Produtos', path: '/admin/estoque/cadastro' },
    { label: 'Integração com Plataformas', path: '/admin/estoque/integracao' },
    { label: 'Relatórios de Inventário', path: '/admin/estoque/relatorios' },
  ],
  crm: [
    { label: 'Acompanhamento de Contatos', path: '/admin/crm' },
    { label: 'Cadastro de Leads', path: '/admin/crm/cadastro' },
    { label: 'Qualificação de Leads', path: '/admin/crm/qualificacao' },
    { label: 'Exportação de Dados', path: '/admin/crm/exportacao' },
  ],
  avaliacao: [
    { label: 'Histórico de Avaliações', path: '/admin/avaliacao' },
    { label: 'Agendar Avaliação', path: '/admin/avaliacao/agendar' },
    { label: 'Parâmetros de Avaliação', path: '/admin/avaliacao/parametros' },
    { label: 'Relatórios de Preço', path: '/admin/avaliacao/relatorios' },
  ],
  site: [
    { label: 'Visão Geral', path: '/admin/site' },
    { label: 'Configurações Gerais', path: '/admin/site/configuracoes' },
    { label: 'Gerenciamento de Imagens', path: '/admin/site/imagens' },
    { label: 'Gestão de Conteúdo', path: '/admin/site/conteudo' },
    { label: 'Controle de Usuários', path: '/admin/site/usuarios' },
    { label: 'Banners do Site', path: '/admin/site/banners' },
    { label: 'Veículos em Destaque', path: '/admin/site/destaques' },
    { label: 'Scripts do Site', path: '/admin/site/scripts' },
    { label: 'Dados da Loja', path: '/admin/site/dados' },
    { label: 'Mídias Sociais', path: '/admin/site/midias' },
    { label: 'Popups', path: '/admin/site/popups' },
    { label: 'Página Empresa', path: '/admin/site/empresa' },
    { label: 'Blog', path: '/admin/site/blog' },
    { label: 'LandPages', path: '/admin/site/landpages' },
    { label: 'Depoimentos', path: '/admin/site/depoimentos' },
  ],
  financiamento: [
    { label: 'Histórico de Simulações', path: '/admin/financiamento' },
    { label: 'Simulação Rápida', path: '/admin/financiamento/simulacao' },
    { label: 'Análise de Crédito', path: '/admin/financiamento/analise' },
  ],
  administrativo: [
    { label: 'Painel Geral', path: '/admin/administrativo' },
    { label: 'Emissão de Notas', path: '/admin/administrativo/notas' },
    { label: 'Gestão de Documentos', path: '/admin/administrativo/documentos' },
    { label: 'Controle de Despesas', path: '/admin/administrativo/despesas' },
    { label: 'Relatórios Financeiros', path: '/admin/administrativo/relatorios' },
  ],
}

export default function AdminLayout() {
  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)
  const currentModule = pathParts[1] || ''

  const submenus = HIERARCHY[currentModule as keyof typeof HIERARCHY]

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <AdminHeader />

      {submenus && (
        <div className="bg-white border-b shadow-sm z-10 sticky top-0">
          <div className="px-4 md:px-6 flex flex-col">
            <div className="py-2 text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold tracking-wide">
              <Link to="/admin" className="hover:text-blue-600 transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-800">{currentModule}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1">
              {submenus.map((sub) => {
                // Exact match for the module root, otherwise startsWith
                const isRootRoute = sub.path === `/admin/${currentModule}`
                const isActive = isRootRoute
                  ? location.pathname === sub.path
                  : location.pathname.startsWith(sub.path)

                return (
                  <Link
                    key={sub.path}
                    to={sub.path}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent',
                    )}
                  >
                    {sub.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative z-0">
        <Outlet />
      </main>
    </div>
  )
}
