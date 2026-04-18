import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const links = [
    { name: 'Início', path: '/' },
    { name: 'Estoque', path: '/estoque' },
    { name: 'Vender/Consignar', path: '/consignacao' },
    { name: 'Blog', path: '/blog' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Contato', path: '/contato' },
  ]

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Página Inicial Carro e Cia">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Logo Carro e Cia Veículos"
              width="150"
              height="40"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === link.path ? 'text-primary font-bold' : 'text-slate-600',
                )}
              >
                {link.name}
              </Link>
            ))}
            <Button asChild variant="default" size="sm" className="ml-2 shadow-sm rounded-full">
              <a
                href="https://api.whatsapp.com/send?phone=5534999948428&text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20atendimento."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Phone className="w-4 h-4 mr-2" /> Atendimento Rápido
              </a>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Menu principal"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 bg-background absolute w-full shadow-lg">
            <nav className="flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'text-lg font-medium pb-2 border-b border-slate-100',
                    location.pathname === link.path ? 'text-primary font-bold' : 'text-slate-700',
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Button asChild variant="default" className="w-full mt-2 rounded-full">
                <a
                  href="https://api.whatsapp.com/send?phone=5534999948428"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="w-4 h-4 mr-2" /> Falar via WhatsApp
                </a>
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-200 py-12 md:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Logo Carro e Cia Veículos Rodapé"
              width="150"
              height="40"
              loading="lazy"
              className="h-10 w-auto brightness-0 invert opacity-90 mb-4 object-contain"
            />
            <p className="text-sm text-slate-300 leading-relaxed">
              Mais de 20 anos de tradição em Uberaba MG. Especialistas em seminovos com procedência
              e garantia e financiamento consignado.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">
              Navegação
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/estoque" className="text-slate-300 hover:text-white transition-colors">
                  Ver Nosso Estoque
                </Link>
              </li>
              <li>
                <Link
                  to="/consignacao"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Quero Vender Meu Carro
                </Link>
              </li>
              <li>
                <Link
                  to="/financiamento-veiculo-consignado"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Financiamento Consignado
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-slate-300 hover:text-white transition-colors font-semibold"
                >
                  Blog e Dicas Automotivas
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Contato</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> (34) 99994-8428
              </li>
              <li>lgacomerciodeveiculos@gmail.com</li>
              <li className="leading-relaxed">
                Av. Guilherme Ferreira, 1131
                <br />
                São Benedito, Uberaba - MG
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Horário</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>Segunda a Sexta: 08:00 às 18:00</li>
              <li>Sábado: 08:00 às 12:00</li>
            </ul>
            <div className="mt-6">
              <Button
                asChild
                variant="outline"
                className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                <Link to="/admin/login">Acesso Restrito</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Carro e Cia Veículos. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/politica-de-privacidade" className="hover:text-slate-300">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
