import { Outlet, Link } from 'react-router-dom'
import { WhatsAppButton } from './WhatsAppButton'
import { ExitIntentPopup } from './ExitIntentPopup'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { label: 'Início', href: '/' },
    { label: 'Estoque', href: '/estoque' },
    { label: 'Vender Meu Carro', href: '/vender-meu-carro' },
    { label: 'Consignação', href: '/consignacao' },
    { label: 'Financiamento', href: '/financiamento-veiculo-consignado' },
    { label: 'Blog', href: '/blog' },
    { label: 'Sobre', href: '/sobre' },
  ]

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
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                target="_self"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://wa.me/5534999484285?text=Olá%20Luiz%2C%20vim%20pelo%20site!"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-4 py-2 rounded-full font-bold hover:bg-[#25D366]/90 transition-colors"
              aria-label="Falar com Luiz pelo WhatsApp"
              data-event="clique_whatsapp"
            >
              Falar pelo WhatsApp
            </a>
          </nav>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
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
          'fixed inset-0 z-40 bg-background transition-transform transform md:hidden flex flex-col',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ top: '64px' }}
      >
        <nav className="flex flex-col p-6 space-y-6 text-lg font-medium flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setMenuOpen(false)}
              target="_self"
              className="hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-auto pb-8">
            <a
              href="https://wa.me/5534999484285?text=Olá%20Luiz%2C%20vim%20pelo%20site!"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-4 py-3 rounded-full font-bold text-center block"
              onClick={() => setMenuOpen(false)}
              aria-label="Falar com Luiz pelo WhatsApp"
              data-event="clique_whatsapp"
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
