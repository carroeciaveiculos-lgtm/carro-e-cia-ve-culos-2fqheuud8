import { Link } from 'react-router-dom'
import { Car, Handshake, Calculator } from 'lucide-react'

export function QuickSearch() {
  return (
    <section className="py-6 bg-muted/20 md:hidden border-b">
      <div className="container">
        <h2 className="text-sm font-bold text-muted-foreground text-center mb-4 uppercase tracking-wider">
          O que você está procurando?
        </h2>
        <div className="flex flex-col gap-3">
          <Link
            to="/estoque"
            className="flex items-center gap-3 bg-background border border-border/50 rounded-full h-12 px-6 shadow-sm hover:border-primary transition-colors"
          >
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-medium text-[15px]">Comprar veículo</span>
          </Link>

          <Link
            to="/consignacao"
            className="flex items-center gap-3 bg-background border border-border/50 rounded-full h-12 px-6 shadow-sm hover:border-primary transition-colors"
          >
            <div className="bg-green-100 text-green-600 p-1.5 rounded-full">
              <Handshake className="w-4 h-4" />
            </div>
            <span className="font-medium text-[15px]">Consignar meu carro</span>
          </Link>

          <Link
            to="/financiamento-auto"
            className="flex items-center gap-3 bg-background border border-border/50 rounded-full h-12 px-6 shadow-sm hover:border-primary transition-colors"
          >
            <div className="bg-orange-100 text-orange-600 p-1.5 rounded-full">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="font-medium text-[15px]">Simular financiamento</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
