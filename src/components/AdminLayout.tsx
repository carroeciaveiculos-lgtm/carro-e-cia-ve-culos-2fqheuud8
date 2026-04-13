import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Car, Users, ClipboardList, Settings, LogOut, Menu } from 'lucide-react'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Estoque', path: '/admin/estoque', icon: Car },
    { name: 'Leads / CRM', path: '/admin/leads', icon: Users },
    { name: 'Consignações', path: '/admin/consignacoes', icon: ClipboardList },
    { name: 'Configurações', path: '/admin/configuracoes', icon: Settings },
  ]

  const handleLogout = () => {
    navigate('/admin/login')
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/30 overflow-hidden">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="p-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded font-display font-bold text-sm">
                C&C
              </div>
              <span className="font-display font-bold">Admin Panel</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {adminLinks.map((link) => (
                <SidebarMenuItem key={link.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === link.path}
                    tooltip={link.name}
                  >
                    <Link to={link.path}>
                      <link.icon className="w-5 h-5" />
                      <span>{link.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-14 border-b border-border bg-background flex items-center px-6 justify-between shrink-0">
            <h1 className="font-display font-semibold text-lg">
              {adminLinks.find((l) => l.path === location.pathname)?.name || 'Painel'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                AD
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
