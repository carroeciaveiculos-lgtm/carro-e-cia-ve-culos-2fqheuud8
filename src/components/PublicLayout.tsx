import { Outlet, Link, useLocation } from 'react-router-dom'
import { WhatsAppButton } from './WhatsAppButton'
import {
  Menu,
  X,
  ChevronDown,
  Car,
  Home,
  MessageCircle,
  Handshake,
  ArrowUp,
  Shield,
  CreditCard,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { trackConversion } from '@/lib/tracking'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { Button } from './ui/button'

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const location = useLocation()

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
    { label: 'Blog', href: '/blog' },
    { label: 'Sobre', href: '/sobre' },
    { label: 'Contato', href: '/contato' },
  ]

  const mobileMenuLinks = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Nosso Estoque', href: '/estoque', icon: Car },
    { label: 'Consignação', href: '/consignacao', icon: Handshake },
    { label: 'Financiamento', href: '/financiamento-auto', icon: CreditCard },
    { label: 'Seguro Auto', href: '/seguro-auto', icon: Shield },
    { label: 'Consórcio Auto', href: '/consorcio-auto', icon: Car },
    { label: 'Contato', href: '/contato', icon: MessageCircle },
    { label: 'Blog', href: '/blog', icon: Home },
  ]

  const wppText = 'Olá Luiz! Vim pelo site e gostaria de mais informações.'

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="flex flex-col min-h-screen md:pb-0 pb-[80px]">
      {/* Navbar Desktop & Mobile */}
      <header className="fixed top-0 left-0 right-0 z-[1000] h-[60px] bg-background shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center">
        <div className="container flex items-center justify-between w-full">
          <Link to="/" className="flex items-center" target="_self" aria-label="Página Inicial">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Carro e Cia Logo"
              className="h-10 w-auto max-w-[140px] object-contain"
              width="140"
              height="40"
              loading="eager"
              fetchPriority="high"
            />
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={cn(
                  'transition-colors hover:text-primary',
                  location.pathname === l.href ? 'text-primary' : 'text-foreground/80',
                )}
              >
                {l.label}
              </Link>
            ))}

            <div className="relative group">
              <button className="flex items-center gap-1 transition-colors hover:text-primary text-foreground/80 py-2">
                Nossos Serviços <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:flex flex-col bg-card border shadow-lg rounded-md min-w-[240px] overflow-hidden">
                {servicesDropdown.map((d) => (
                  <Link
                    key={d.href}
                    to={d.href}
                    className="px-4 py-3 hover:bg-muted hover:text-primary border-l-4 border-transparent hover:border-primary transition-colors text-sm font-medium"
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
                className={cn(
                  'transition-colors hover:text-primary',
                  location.pathname === l.href ? 'text-primary' : 'text-foreground/80',
                )}
              >
                {l.label}
              </Link>
            ))}

            <Button
              asChild
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full font-bold"
            >
              <a
                href={getWhatsAppLink(wppText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion('whatsapp')}
              >
                Falar pelo WhatsApp
              </a>
            </Button>
          </nav>

          {/* Mobile Toggle */}
          <button
            className="md:hidden flex items-center justify-center w-11 h-11 text-foreground"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Padding */}
      <div className="pt-[60px] flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        <footer className="py-8 border-t bg-muted/30 text-center text-sm text-muted-foreground mt-auto pb-safe">
          <div className="container">
            <p>© {new Date().getFullYear()} Carro e Cia Veículos. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1001] md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-background z-[1002] transition-transform duration-200 ease-in-out md:hidden flex flex-col shadow-2xl',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-end p-4 border-b h-[60px]">
          <button
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center w-11 h-11 text-foreground"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col">
            {mobileMenuLinks.map((l) => {
              const isActive = location.pathname === l.href
              return (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center px-6 py-4 text-[18px] font-medium border-b border-border/50',
                      isActive
                        ? 'text-primary border-l-4 border-l-primary bg-primary/5'
                        : 'text-foreground',
                    )}
                  >
                    <l.icon
                      className={cn(
                        'w-5 h-5 mr-4',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-6 border-t mt-auto mb-safe">
          <Button
            asChild
            className="w-full h-[52px] text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white"
          >
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
            >
              Falar com o Luiz
            </a>
          </Button>
        </div>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-[999] pb-safe">
        <div className="flex items-center justify-around h-[64px] px-2">
          <Link
            to="/"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              location.pathname === '/' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Home className="w-6 h-6" />
            <span className="text-[11px] font-medium">Início</span>
          </Link>
          <Link
            to="/estoque"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              location.pathname === '/estoque' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Car className="w-6 h-6" />
            <span className="text-[11px] font-medium">Estoque</span>
          </Link>

          <div className="flex flex-col items-center justify-center w-full h-full relative -top-3">
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-[56px] h-[56px] rounded-full bg-[#25D366] text-white shadow-lg border-4 border-background"
              aria-label="Falar pelo WhatsApp"
            >
              <MessageCircle className="w-7 h-7" />
            </a>
            <span className="text-[11px] font-medium text-muted-foreground mt-1">WhatsApp</span>
          </div>

          <Link
            to="/consignacao"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              location.pathname === '/consignacao' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Handshake className="w-6 h-6" />
            <span className="text-[11px] font-medium">Consignar</span>
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[11px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed z-[998] right-4 bottom-[96px] md:bottom-8 w-10 h-10 bg-primary/80 hover:bg-primary text-white rounded-xl shadow-md flex items-center justify-center transition-all animate-fade-in"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Desktop WhatsApp Button */}
      <div className="hidden md:block">
        <WhatsAppButton />
      </div>
    </div>
  )
}
