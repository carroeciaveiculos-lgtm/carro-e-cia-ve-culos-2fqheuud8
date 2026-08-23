import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Car,
  Users,
  Settings,
  Globe,
  FileText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  DollarSign,
  Image as ImageIcon,
  Activity,
  BarChart,
  HelpCircle,
  MessageSquare,
  CalendarClock,
  Megaphone,
  Cpu,
  Bot,
  FileCode,
  ScrollText,
  Share2,
  Briefcase,
  ClipboardCheck,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { usePermissoes } from '@/hooks/use-permissoes'
import { rotaLiberada } from '@/lib/setor-acesso'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

// Reorganizado em 17/08/2026 (pedido da Adriana) em 3 áreas fixas — antes
// eram 6 grupos por assunto, misturando operacional com administração.
// Reorganizado de novo em 23/08/2026 (pedido da Adriana, "ficar mais
// organizado" + ela reparou que a tela de permissão só deixa autorizar por
// setor, não por item) — "Menu Principal" virou submenus recolhíveis por
// setor, espelhando 1:1 os mesmos nomes de setor que ROTA_SETORES usa (ver
// src/lib/setor-acesso.ts). Assim o menu mostra visualmente o que cada
// setor libera, em vez de ficar como lista solta de 17 itens.
// "Administração" não precisou de subgrupo — os 6 itens já são todos do
// mesmo setor (Desenvolvedor e TI).
const SIDEBAR_MENUS = [
  {
    title: 'Menu Principal',
    // Dashboard fica solto — página de uso geral, não é de um setor só.
    items: [{ label: 'Dashboard', path: '/admin', icon: LayoutDashboard }],
    subgrupos: [
      {
        title: 'Vendas',
        items: [
          { label: 'Leads (CRM)', path: '/admin/crm', icon: Users },
          { label: 'Conversador', path: '/admin/conversas', icon: MessageSquare },
          { label: 'Agendamentos', path: '/admin/agendamentos', icon: CalendarClock },
          { label: 'Avaliação de Veículo', path: '/admin/avaliacao', icon: ClipboardCheck },
        ],
      },
      {
        title: 'Estoque/Portais',
        items: [
          { label: 'Estoque', path: '/admin/estoque', icon: Car },
          { label: 'Portais', path: '/admin/portais', icon: Globe },
        ],
      },
      {
        title: 'Financiamentos',
        items: [{ label: 'Financiamentos', path: '/admin/financiamento', icon: DollarSign }],
      },
      {
        title: 'Financeiro/Administrativo',
        items: [
          { label: 'Administrativo', path: '/admin/administrativo', icon: FileText },
          { label: 'Modelos de Documentos', path: '/admin/modelos-documentos', icon: FileCode },
        ],
      },
      {
        title: 'Marketing',
        items: [
          { label: 'Marketing', path: '/admin/marketing', icon: Activity },
          { label: 'Gestão de Anúncios', path: '/admin/anuncios', icon: Megaphone },
          { label: 'Central de Redes Sociais', path: '/admin/central-social', icon: Share2 },
          { label: 'Conteúdo', path: '/admin/conteudo', icon: FileText },
          { label: 'Design & Mídias', path: '/admin/design', icon: ImageIcon },
        ],
      },
      {
        title: 'Institucional',
        items: [
          { label: 'Visão Geral (ROI)', path: '/admin/relatorios', icon: BarChart },
          { label: 'Vagas', path: '/admin/vagas', icon: Briefcase },
        ],
      },
    ],
  },
  {
    title: 'Administração',
    items: [
      { label: 'Configurações', path: '/admin/configuracoes', icon: Settings },
      { label: 'Autonomia', path: '/admin/autonomia', icon: Cpu },
      { label: 'Prompts IA', path: '/admin/prompts-ia', icon: Bot },
      { label: 'Usuários', path: '/admin/usuarios', icon: Users },
      { label: 'Auditoria', path: '/admin/auditoria', icon: ScrollText },
      { label: 'Logs do Sistema', path: '/admin/logs', icon: Activity },
    ],
  },
  {
    title: 'Área de Ajuda',
    items: [{ label: 'Central de Ajuda', path: '/admin/ajuda', icon: HelpCircle }],
  },
]

// Itens de um grupo, juntando os soltos (Dashboard) com os de dentro dos
// subgrupos por setor — usado tanto pro rótulo da barra de topo quanto pra
// achar em qual subgrupo a rota ativa está (pra abrir ele sozinho).
function todosOsItens(group: (typeof SIDEBAR_MENUS)[number]) {
  return [...group.items, ...(group.subgrupos?.flatMap((sg) => sg.items) || [])]
}

export default function AdminLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [newLeadsCount, setNewLeadsCount] = useState(0)
  const { nivel, setorNomes, loading: carregandoPermissoes } = usePermissoes()
  // Subgrupos por setor (dentro de "Menu Principal") começam recolhidos —
  // é o ponto de ter submenu, reduzir a lista de 17 itens soltos. O que
  // contém a rota atual abre sozinho, senão a pessoa "some" da navegação
  // ao entrar numa página cujo subgrupo estava fechado.
  const [subgruposAbertos, setSubgruposAbertos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    for (const group of SIDEBAR_MENUS) {
      for (const sg of group.subgrupos || []) {
        const temRotaAtiva = sg.items.some((item) => location.pathname.startsWith(item.path))
        if (temRotaAtiva) {
          setSubgruposAbertos((prev) => (prev[sg.title] ? prev : { ...prev, [sg.title]: true }))
        }
      }
    }
  }, [location.pathname])

  useEffect(() => {
    if (nivel === 'bloqueado') {
      signOut().then(() => navigate('/admin/login'))
    }
  }, [nivel, signOut, navigate])

  useEffect(() => {
    if (carregandoPermissoes || !nivel) return
    if (!rotaLiberada(location.pathname, nivel, setorNomes)) {
      toast({
        title: 'Sem acesso a essa área',
        description: 'Fale com um admin se achar que deveria ter acesso.',
        variant: 'destructive',
      })
      navigate('/admin', { replace: true })
    }
  }, [location.pathname, nivel, setorNomes, carregandoPermissoes, navigate, toast])

  useEffect(() => {
    if (!user) return

    const fetchLeadsCount = async () => {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'novo')
      setNewLeadsCount(count || 0)
    }

    fetchLeadsCount()

    const channel = supabase
      .channel('admin-layout-leads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload: any) => {
          setNewLeadsCount((prev) => prev + 1)
          toast({
            title: 'Novo Lead Recebido!',
            description: `Nome: ${payload.new.nome} - Interesse: ${payload.new.veiculo_interesse || 'Não informado'}`,
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload: any) => {
          if (payload.old.status === 'novo' && payload.new.status !== 'novo') {
            setNewLeadsCount((prev) => Math.max(0, prev - 1))
          } else if (payload.old.status !== 'novo' && payload.new.status === 'novo') {
            setNewLeadsCount((prev) => prev + 1)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, toast])

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  // Um item de menu (Link com ícone, ativo destacado, badge de leads novos)
  // — extraído pra reaproveitar tanto nos itens soltos quanto nos de dentro
  // de um subgrupo por setor, sem duplicar o JSX duas vezes.
  const renderMenuItem = (item: { label: string; path: string; icon: any }) => {
    const isActive =
      item.path === '/admin'
        ? location.pathname === '/admin'
        : location.pathname.startsWith(item.path)

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-sm',
          isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white',
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
        {!collapsed && <span className="truncate flex-1">{item.label}</span>}
        {item.path === '/admin/crm' && newLeadsCount > 0 && (
          <span
            className={cn(
              'bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px]',
              collapsed && 'absolute top-1 right-1 w-4 h-4 p-0 min-w-0',
            )}
          >
            {newLeadsCount > 99 ? '99+' : newLeadsCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-slate-800 bg-slate-900/50">
          {!collapsed && (
            <span className="font-bold text-white text-lg tracking-tight truncate">
              Carro e Cia Admin
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 mx-auto" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {SIDEBAR_MENUS.map((group, i) => {
            const itemsLiberados = carregandoPermissoes
              ? []
              : group.items.filter((item) => rotaLiberada(item.path, nivel, setorNomes))

            const subgruposLiberados = carregandoPermissoes
              ? []
              : (group.subgrupos || [])
                  .map((sg) => ({
                    ...sg,
                    items: sg.items.filter((item) => rotaLiberada(item.path, nivel, setorNomes)),
                  }))
                  .filter((sg) => sg.items.length > 0)

            if (itemsLiberados.length === 0 && subgruposLiberados.length === 0) return null

            return (
              <div key={i} className="mb-6 px-3">
                {!collapsed && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">{itemsLiberados.map(renderMenuItem)}</div>

                {subgruposLiberados.map((sg) =>
                  // Sidebar toda recolhida (modo ícone) — sem espaço pra um
                  // cabeçalho de subgrupo clicável, mostra os itens direto,
                  // igual já acontecia com os grupos antes desta mudança.
                  collapsed ? (
                    <div key={sg.title} className="space-y-1">
                      {sg.items.map(renderMenuItem)}
                    </div>
                  ) : (
                    <Collapsible
                      key={sg.title}
                      open={subgruposAbertos[sg.title] ?? false}
                      onOpenChange={(open) =>
                        setSubgruposAbertos((prev) => ({ ...prev, [sg.title]: open }))
                      }
                      className="mt-1"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 transition-colors">
                        {sg.title}
                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 transition-transform',
                            subgruposAbertos[sg.title] && 'rotate-180',
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 pt-1 pb-2">
                        {sg.items.map(renderMenuItem)}
                      </CollapsibleContent>
                    </Collapsible>
                  ),
                )}
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium',
              collapsed && 'justify-center',
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">
              {SIDEBAR_MENUS.flatMap(todosOsItens).find(
                (i) => location.pathname.startsWith(i.path) && i.path !== '/admin',
              )?.label || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
              {user?.email}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto relative bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
