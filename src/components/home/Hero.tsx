import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Key, Car, ShieldCheck, Megaphone, Clock } from 'lucide-react'

export function Hero() {
  return (
    <>
      <section className="relative bg-secondary text-secondary-foreground pt-16 pb-32 lg:pt-24 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://img.usecurling.com/p/1200/800?q=car%20dealership')] bg-cover bg-center" />
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-6 leading-tight">
              Venda ou Compre seu Veículo com <span className="text-primary">Segurança</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              Há mais de 20 anos conectando quem quer vender a quem quer comprar em Uberaba e
              Região.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Button
                asChild
                size="lg"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 text-lg h-14"
              >
                <a href="#consignacao">
                  <Key className="w-5 h-5" /> Quero Vender meu Carro
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white gap-2 text-lg h-14"
              >
                <Link to="/estoque">
                  <Car className="w-5 h-5" /> Ver Estoque de Veículos
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl" />
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Luiz%20Fernando%20foto%20profissional.jpeg"
              alt="Luiz Fernando CEO"
              className="relative z-10 w-full max-w-sm mx-auto rounded-2xl shadow-2xl border-4 border-secondary-foreground/10 object-cover aspect-[3/4]"
            />
            <div className="absolute -bottom-6 -left-6 bg-background p-4 rounded-xl shadow-xl z-20 flex items-center gap-4 animate-fade-in-up">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                +20
              </div>
              <div>
                <p className="font-bold text-foreground">Anos de</p>
                <p className="text-sm text-muted-foreground">Experiência</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background relative z-20 -mt-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Segurança Garantida',
                desc: 'Vendas com contrato e total transparência',
              },
              {
                icon: Megaphone,
                title: 'Divulgação Completa',
                desc: 'Anunciamos em OLX, WebMotors, iCarros e Mercado Livre',
              },
              {
                icon: Clock,
                title: '+20 Anos de Experiência',
                desc: 'Referência em qualidade e procedência em Uberaba',
              },
            ].map((b, i) => (
              <div
                key={i}
                className="bg-card p-8 rounded-xl shadow-lg border border-border/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <b.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{b.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
