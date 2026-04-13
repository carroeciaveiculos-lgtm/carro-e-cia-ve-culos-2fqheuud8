import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Megaphone, Clock, CheckCircle2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockVehicles, mockTestimonials } from '@/lib/mock-data'
import { VehicleCard } from '@/components/VehicleCard'
import { LeadForm } from '@/components/LeadForm'

const Index = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=premium%20cars%20showroom&color=black"
            alt="Showroom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        </div>

        <div className="container relative z-10 text-white animate-fade-in-up">
          <div className="max-w-3xl">
            <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6">
              Venda ou Compre seu Veículo com <span className="text-primary">Segurança</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl leading-relaxed">
              Há mais de 20 anos conectando quem quer vender a quem quer comprar em Uberaba e
              Região. O melhor negócio está aqui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg h-14 px-8 bg-primary hover:bg-primary/90"
                asChild
              >
                <Link to="/consignacao">Quero Vender meu Carro</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg h-14 px-8 bg-white/10 hover:bg-white border-white text-white hover:text-black backdrop-blur-sm"
                asChild
              >
                <Link to="/estoque">Ver Estoque de Veículos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-muted/50 p-8 rounded-2xl flex flex-col items-center text-center group hover:bg-muted transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">Segurança Garantida</h3>
              <p className="text-muted-foreground">
                Todos os veículos passam por rigorosa vistoria cautelar. Transparência total na
                documentação.
              </p>
            </div>
            <div className="bg-muted/50 p-8 rounded-2xl flex flex-col items-center text-center group hover:bg-muted transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Megaphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">Divulgação Completa</h3>
              <p className="text-muted-foreground">
                Fotos profissionais e anúncios nos principais portais do Brasil para vender seu
                carro rápido.
              </p>
            </div>
            <div className="bg-muted/50 p-8 rounded-2xl flex flex-col items-center text-center group hover:bg-muted transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">20+ Anos de Experiência</h3>
              <p className="text-muted-foreground">
                Tradição e confiança construídas ao longo de duas décadas no mercado automotivo de
                Uberaba.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Inventory */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                Destaques do Estoque
              </h2>
              <p className="text-muted-foreground text-lg">
                Os melhores veículos selecionados para você.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary hover:bg-primary/10 gap-2"
              asChild
            >
              <Link to="/estoque">
                Ver todo estoque <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockVehicles.slice(0, 6).map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </section>

      {/* Consignment Lead Capture */}
      <section id="consignacao-home" className="py-24 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://img.usecurling.com/p/1920/600?q=car%20keys&color=gray"
            className="w-full h-full object-cover"
            alt="Keys"
          />
        </div>
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <h2 className="font-display font-bold text-4xl lg:text-5xl mb-6">
                Deixe o trabalho duro com quem entende.
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Vender um carro exige tempo, dinheiro com anúncios e paciência para lidar com
                curiosos. Na Carro e Cia, cuidamos de tudo para você receber o melhor valor de forma
                segura.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Avaliação justa e de mercado',
                  'Preparação estética do veículo',
                  'Garantia de recebimento',
                  'Resolvemos a burocracia do Detran',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:ml-auto w-full max-w-md">
              <LeadForm
                title="Quer vender seu carro?"
                subtitle="Preencha e receba uma pré-avaliação gratuita hoje mesmo."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3753.8613134375845!2d-47.93510302488151!3d-19.760670981589335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bad0133c942df3%3A0xcda1909a34e0057b!2sAv.%20Guilherme%20Ferreira%2C%201119%20-%20S%C3%A3o%20Benedito%2C%20Uberaba%20-%20MG%2C%2038020-233!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div>
              <h2 className="font-display font-bold text-3xl mb-6">Faça-nos uma visita</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Endereço</h4>
                    <p className="text-muted-foreground">
                      Av. Guilherme Ferreira, 1119
                      <br />
                      São Benedito, Uberaba - MG
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Horário de Funcionamento</h4>
                    <p className="text-muted-foreground">
                      Segunda a Sexta: 08:00 às 18:00
                      <br />
                      Sábado: 08:00 às 12:00
                    </p>
                  </div>
                </div>
              </div>
              <Button size="lg" className="mt-8 w-full sm:w-auto" asChild>
                <a
                  href="https://maps.google.com/?q=Av.+Guilherme+Ferreira,+1119+-+Uberaba"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Como Chegar
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Index
