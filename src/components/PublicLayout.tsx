import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { WhatsAppButton } from './WhatsAppButton'
import { Analytics } from './Analytics'
import { Menu, X, Facebook, Instagram, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMobileMenuOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Estoque', path: '/estoque' },
    { label: 'Consignação', path: '/consignacao' },
    { label: 'Sobre', path: '/sobre' },
    { label: 'Contato', path: '/contato' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Carro e Cia Veículos"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2">
              <a
                href="https://wa.me/5534999484285?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Phone className="w-4 h-4" /> Falar no WhatsApp
              </a>
            </Button>
          </nav>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-background px-4 py-4 space-y-4 shadow-lg absolute w-full">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-3 text-base font-medium text-foreground hover:text-primary border-b border-border/50 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Button
              asChild
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 mt-4 h-12"
            >
              <a
                href="https://wa.me/5534999484285?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Phone className="w-5 h-5" /> Falar no WhatsApp
              </a>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-secondary text-secondary-foreground py-12 lg:py-16 border-t border-secondary-foreground/10">
        <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Carro e Cia"
              className="h-14 w-auto object-contain brightness-0 invert mb-6"
            />
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Compre ou consigne seu veículo com segurança em Uberaba. Mais de 20 anos de
              experiência. Consignação, transparência e procedência garantida.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/carroecia02"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/carroeciaosmelhoresveiculos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-white">Links Rápidos</h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-white">Contato</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="leading-relaxed">
                Av. Guilherme Ferreira, 1119
                <br />
                São Benedito, Uberaba - MG
                <br />
                38022-200
              </li>
              <li>
                <a
                  href="https://wa.me/5534999484285"
                  className="hover:text-primary transition-colors"
                >
                  (34) 99948-4285
                </a>
              </li>
              <li>
                <a
                  href="mailto:lgacomerciodeveiculos@gmail.com"
                  className="hover:text-primary transition-colors break-all"
                >
                  lgacomerciodeveiculos@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-secondary-foreground/10 text-center text-gray-500 text-sm">
          <p>
            Carro e Cia Veículos © {new Date().getFullYear()} — Todos os direitos reservados. CNPJ:
            17.125.199/0001-87
          </p>
        </div>
      </footer>

      <WhatsAppButton />
      <Analytics />
    </div>
  )
}
