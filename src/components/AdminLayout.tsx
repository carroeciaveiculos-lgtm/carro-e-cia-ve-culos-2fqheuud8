import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CarFront, Users, LogOut, Settings, BarChart } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const menu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Estoque de Veículos', icon: CarFront, path: '/admin/veiculos' },
    { label: 'Leads / CRM', icon: Users, path: '/admin/crm' },
    { label: 'Relatórios', icon: BarChart, path: '/admin/relatorios', disabled: true },
    { label: 'Configurações', icon: Settings, path: '/admin/configuracoes', disabled: true },
  ]

  return (
    <div className="flex h-screen bg-muted/20">
      <aside className="w-64 bg-secondary text-secondary-foreground flex flex-col">
        <div className="p-6 border-b border-secondary-foreground/10">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
            alt="Carro e Cia"
            className="h-8 brightness-0 invert"
          />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menu.map((m, i) =>
            m.disabled ? (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary-foreground/50 cursor-not-allowed"
              >
                <m.icon className="w-5 h-5" /> {m.label}{' '}
                <span className="text-[10px] uppercase bg-secondary-foreground/10 px-2 py-0.5 rounded ml-auto">
                  Em breve
                </span>
              </div>
            ) : (
              <Link
                key={i}
                to={m.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === m.path || (m.path !== '/admin' && location.pathname.startsWith(m.path)) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary-foreground/10'}`}
              >
                <m.icon className="w-5 h-5" /> {m.label}
              </Link>
            ),
          )}
        </nav>

        <div className="p-4 border-t border-secondary-foreground/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.email?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-secondary-foreground/70">Administrador</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair do Painel
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
