import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, CarFront, BarChart, Settings, FileText, Users, LogOut, Globe } from 'lucide-react'
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
    { label: 'Home', icon: Home, path: '/admin' },
    { label: 'Estoque', icon: CarFront, path: '/admin/veiculos' },
    { label: 'CRM', icon: Users, path: '/admin/crm' },
    { label: 'Portais', icon: Globe, path: '/admin/portais' },
    { label: 'Relatórios', icon: BarChart, path: '/admin/relatorios' },
    { label: 'Configuração', icon: Settings, path: '/admin/configuracoes' },
    { label: 'Faturas', icon: FileText, path: '/admin/faturas' },
  ]

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <aside className="w-64 bg-[#0D47A1] text-white flex flex-col shadow-lg z-10 shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center justify-center bg-[#09357A]">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
            alt="Carro e Cia"
            className="h-8 brightness-0 invert"
          />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((m, i) => (
            <Link
              key={i}
              to={m.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                location.pathname === m.path ||
                (m.path !== '/admin' && location.pathname.startsWith(m.path))
                  ? 'bg-[#1565C0] font-medium'
                  : 'hover:bg-[#1565C0]/50 text-white/80 hover:text-white'
              }`}
            >
              <m.icon className="w-5 h-5" /> {m.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#09357A]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#1976D2] flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{user?.email || 'Admin'}</p>
              <p className="text-xs text-white/60">Carro e Cia Veículos</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-[#C62828] hover:text-white transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#F5F5F5]">
        <div className="p-8 max-w-[1600px] mx-auto min-w-[800px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
