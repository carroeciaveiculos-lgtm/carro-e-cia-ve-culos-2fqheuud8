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
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { usePermissoes } from '@/hooks/use-permissoes'
import { rotaLiberada } from '@/lib/setor-acesso'

// Reorganizado em 17/08/2026 (pedido da Adriana) em 3 áreas fixas — antes
// eram 6 grupos por assunto, misturando operacional com administração.
const SIDEBAR_MENUS = [
  {
    title: 'Menu Principal',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Estoque', path: '/admin/estoque', icon: Car },
      { label: 'Leads (CRM)', path: '/admin/crm', icon: Users },
      { label: 'Conversador', path: '/admin/conversas', icon: MessageSquare },
      { label: 'Agendamentos', path: '/admin/agendamentos', icon: CalendarClock },
      { label: 'Visão Geral (ROI)', path: '/admin/relatorios', icon: BarChart },
      { label: 'Financiamentos', path: '/admin/financiamento', icon: DollarSign },
      { label: 'Administrativo', path: '/admin/administrativo', icon: FileText },
      { label: 'Modelos de Documentos', path: '/admin/modelos-documentos', icon: FileCode },
      { label: 'Portais', path: '/admin/portais', icon: Globe },
      { label: 'Vagas', path: '/admin/vagas', icon: Briefcase },
      { label: 'Marketing', path: '/admin/marketing', icon: Activity },
      { label: 'Gestão de Anúncios', path: '/admin/anuncios', icon: Megaphone },
      { label: 'Central de Redes Sociais', path: '/admin/central-social', icon: Share2 },
      { label: 'Conteúdo', path: '/admin/conteudo', icon: FileText },
      { label: 'Design & Mídias', path: '/admin/design', icon: ImageIcon },
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

export default function AdminLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [newLeadsCount, setNewLeadsCount] = useState(0)
  const { nivel, setorNomes, loading: carregandoPermissoes } = usePermissoes()

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

            if (itemsLiberados.length === 0) return null

            return (
            <div key={i} className="mb-6 px-3">
              {!collapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {itemsLiberados.map((item) => {
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
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                          : 'hover:bg-slate-800 hover:text-white',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={cn(
                          'w-5 h-5 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400',
                        )}
                      />
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
                })}
              </div>
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
              {SIDEBAR_MENUS.flatMap((g) => g.items).find(
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
