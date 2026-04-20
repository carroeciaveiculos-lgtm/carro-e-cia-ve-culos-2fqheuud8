import { Outlet, Link } from 'react-router-dom'
import { WhatsAppButton } from './WhatsAppButton'
import { ExitIntentPopup } from './ExitIntentPopup'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { trackConversion } from '@/lib/tracking'
import { getWhatsAppLink } from '@/lib/whatsapp'

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  const links = [
    { label: 'Início', href: '/' },
    { label: 'Veículos', href: '/estoque' },
  ]

  const servicesDropdown = [
    { label: 'Consignação de Veículos', href: '/consignacao' },
    { label: 'Vender Meu Carro', href: '/vender-meu-carro' },
    { label: 'Financiamento Auto', href: '/financiamento-auto' },
    { label: 'Seguro Auto', href: '/seguro-auto' },
    { label: 'Consórcio Auto', href: '/consorcio-auto' },
  ]

  const rightLinks = [
    { label: 'Como Funciona', href: '/como-funciona-a-consignacao' },
    { label: 'Blog', href: '/blog' },
    { label: 'Sobre', href: '/sobre' },
  ]

  const wppText = 'Olá Luiz! Quero saber mais sobre a consignação.'

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" target="_self">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Carro e Cia Logo"
              className="h-10 w-auto"
              width="100"
              height="40"
            />
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {l.label}
              </Link>
            ))}

            <div className="relative group">
              <button className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground/60 py-2">
                Nossos Serviços <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white border shadow-lg rounded-md min-w-[240px] text-black overflow-hidden">
                {servicesDropdown.map((d) => (
                  <Link
                    key={d.href}
                    to={d.href}
                    className="px-4 py-3 hover:bg-gray-50 hover:text-red-600 border-l-4 border-transparent hover:border-red-600 transition-colors text-sm font-medium"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            {rightLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {l.label}
              </Link>
            ))}

            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
              className="bg-[#25D366] text-white px-4 py-2 rounded-full font-bold hover:bg-[#25D366]/90 transition-colors"
            >
              Falar pelo WhatsApp
            </a>
          </nav>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Offcanvas */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background transition-transform transform lg:hidden flex flex-col overflow-y-auto',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ top: '64px' }}
      >
        <nav className="flex flex-col p-6 space-y-4 text-lg font-medium flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setMenuOpen(false)}
              className="hover:text-primary py-2 border-b"
            >
              {l.label}
            </Link>
          ))}

          <div className="py-2 border-b">
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="flex items-center justify-between w-full hover:text-primary"
            >
              Nossos Serviços{' '}
              <ChevronDown
                className={cn('w-5 h-5 transition-transform', servicesOpen && 'rotate-180')}
              />
            </button>
            {servicesOpen && (
              <div className="flex flex-col pl-4 mt-2 space-y-3 pb-2">
                {servicesDropdown.map((d) => (
                  <Link
                    key={d.href}
                    to={d.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-muted-foreground hover:text-red-600 border-l-2 border-transparent hover:border-red-600 pl-3 py-1"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {rightLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setMenuOpen(false)}
              className="hover:text-primary py-2 border-b"
            >
              {l.label}
            </Link>
          ))}

          <div className="mt-8 pb-8">
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
              className="bg-[#25D366] text-white px-4 py-3 rounded-full font-bold text-center block"
            >
              Falar pelo WhatsApp
            </a>
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-8 border-t bg-muted/30 text-center text-sm text-muted-foreground mt-auto">
        <div className="container">
          <p>© {new Date().getFullYear()} Carro e Cia Veículos. Todos os direitos reservados.</p>
        </div>
      </footer>

      <WhatsAppButton />
      <ExitIntentPopup />
    </div>
  )
}
