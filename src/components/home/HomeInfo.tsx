import { ShieldCheck, Clock, MapPin } from 'lucide-react'

export function HomeInfo() {
  return (
    <section className="py-12 bg-background relative z-20 -mt-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-2">Transparência Total</h3>
            <p className="text-sm text-muted-foreground">
              Laudo cautelar e garantia de procedência em todos os negócios realizados.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-2">+20 Anos de Mercado</h3>
            <p className="text-sm text-muted-foreground">
              Experiência, tradição e mais de 5.000 clientes satisfeitos em Uberaba.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-2">Fácil Acesso</h3>
            <p className="text-sm text-muted-foreground">
              Localização privilegiada no centro de Uberaba com amplo showroom.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
