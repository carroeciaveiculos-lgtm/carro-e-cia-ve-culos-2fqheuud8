import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Palette,
  Code,
  Image as ImageIcon,
  LogOut,
  Car,
  LayoutTemplate,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const location = useLocation()

  const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('hub.')
  const basePath = isSubdomain ? '' : '/hub'

  const links = [
    { label: 'Visão Geral', href: `${basePath}/`, icon: LayoutDashboard },
    { label: 'Estoque', href: `${basePath}/estoque`, icon: Car },
    { label: 'CMS & Site', href: `${basePath}/site`, icon: LayoutTemplate },
    { label: 'Blog & Conteúdo', href: `${basePath}/conteudo`, icon: FileText },
    { label: 'Media Center', href: `${basePath}/media`, icon: ImageIcon },
    { label: 'Branding e Identidade', href: `${basePath}/branding`, icon: Palette },
    { label: 'Gestor de Scripts', href: `${basePath}/scripts`, icon: Code },
  ]

  return (
    <aside className="w-64 bg-[#1A1A1A] text-white flex flex-col min-h-screen shadow-lg flex-shrink-0 z-10 relative">
      <div className="p-6 border-b border-white/10 flex items-center justify-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          HUB <span className="text-[#CC0000]">C&C</span>
        </h2>
      </div>

      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <ul className="space-y-2">
          {links.map((link) => {
            const isActive =
              location.pathname === link.href ||
              (link.href !== `${basePath}/` && location.pathname.startsWith(link.href))
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                    isActive
                      ? 'bg-[#CC0000] text-white shadow-md'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <link.icon
                    className={cn('w-5 h-5 mr-3', isActive ? 'text-white' : 'text-gray-400')}
                  />
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          to={`${basePath}/logout`}
          className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair do Painel
        </Link>
      </div>
    </aside>
  )
}
