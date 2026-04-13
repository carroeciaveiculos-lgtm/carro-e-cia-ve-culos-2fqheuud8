import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, Phone, MapPin, Instagram, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { WhatsAppButton } from './WhatsAppButton'

export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Estoque', path: '/estoque' },
    { name: 'Consignação', path: '/consignacao' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Contato', path: '/contato' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className={cn(
          'fixed top-0 w-full z-50 transition-all duration-300',
          scrolled ? 'glass shadow-sm py-3' : 'bg-transparent py-5',
        )}
      >
        <div className="container flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 z-50">
            <div className="bg-primary text-white p-2 rounded-lg font-display font-bold text-xl leading-none">
              C&C
            </div>
            <span
              className={cn(
                'font-display font-bold text-lg hidden sm:block',
                scrolled ? 'text-foreground' : 'text-white drop-shadow-md',
              )}
            >
              Carro e Cia
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === link.path
                    ? 'text-primary'
                    : scrolled
                      ? 'text-foreground'
                      : 'text-white drop-shadow-md',
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button
              className="hidden sm:flex bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => window.open('https://wa.me/5534999999999', '_blank')}
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('md:hidden', scrolled ? 'text-foreground' : 'text-white')}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] flex flex-col pt-12">
                <nav className="flex flex-col gap-6 text-lg font-medium">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.path}>
                      <Link
                        to={link.path}
                        className={cn(
                          'hover:text-primary transition-colors',
                          location.pathname === link.path ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {link.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto pb-8">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    onClick={() => window.open('https://wa.me/5534999999999', '_blank')}
                  >
                    <Phone className="w-4 h-4" /> Fale Conosco
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-secondary text-secondary-foreground pt-16 pb-8">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-primary text-white p-2 rounded-lg font-display font-bold text-2xl leading-none">
                C&C
              </div>
              <span className="font-display font-bold text-xl">Carro e Cia Veículos</span>
            </div>
            <p className="text-muted-foreground max-w-md mb-6">
              Há mais de 20 anos conectando quem quer vender a quem quer comprar em Uberaba e Região
              com total transparência e segurança.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="bg-white/10 p-3 rounded-full hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="bg-white/10 p-3 rounded-full hover:bg-primary transition-colors"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Links Rápidos</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link to="/estoque" className="hover:text-white transition-colors">
                  Ver Estoque
                </Link>
              </li>
              <li>
                <Link to="/consignacao" className="hover:text-white transition-colors">
                  Vender meu Carro
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="hover:text-white transition-colors">
                  Nossa História
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:text-white transition-colors">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors">
                  Acesso Restrito
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Contato</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  Av. Guilherme Ferreira, 1119
                  <br />
                  São Benedito, Uberaba - MG
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>(34) 99999-9999</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="container border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Carro e Cia Veículos. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Feito com dedicação para Uberaba e Região.</p>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
