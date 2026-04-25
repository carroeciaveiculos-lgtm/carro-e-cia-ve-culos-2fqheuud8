import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { trackCTAClick } from '@/lib/tracking'

export default function Sobre() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'Organization',
      name: 'Carro e Cia Veículos',
      description: 'Mais de 20 anos de experiência em consignação e venda de veículos em Uberaba.',
    },
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title="Sobre Carro e Cia | A História de Luiz Fernando - 20+ Anos"
        description="Conheça Luiz Fernando e a história da Carro e Cia. 20+ anos dedicados a consignação segura, transparência e confiança em Uberaba."
        schema={schema}
        canonical="https://carroeciamotors.com.br/sobre"
      />

      <section className="container max-w-6xl mx-auto px-4 mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-left mb-8">
              <picture className="inline-block">
                <source
                  media="(max-width: 480px)"
                  srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  type="image/webp"
                />
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  alt="Carro e Cia - 20+ anos"
                  loading="eager"
                  className="max-w-full h-auto object-contain w-48"
                />
              </picture>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/50 text-center md:text-left">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
                  alt="Luiz Fernando, CEO Carro e Cia"
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover shadow-lg border-4 border-white"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-800">
                    Luiz Fernando
                  </h1>
                  <p className="text-primary font-bold text-sm uppercase tracking-wider mb-4">
                    CEO & Fundador
                  </p>

                  <div className="text-sm md:text-base text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Há mais de 20 anos apaixonado por carros. Começou como vendedor, tornou-se
                      sócio, e hoje lidera a Carro e Cia com dedicação e humanidade em cada
                      transação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 bg-muted/30 p-4 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-black text-primary mb-1">20+</div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">
                    Anos de Mercado
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-primary mb-1">5.000+</div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">
                    Clientes Satisfeitos
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-primary mb-1">100%</div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">
                    Transparência
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
              alt="Showroom Carro e Cia Veículos"
              className="rounded-2xl shadow-2xl object-cover w-full h-[250px] md:h-[500px]"
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20 border-y border-border/50">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-muted-foreground">
              Depoimentos reais de quem confiou na Carro e Cia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-background shadow-sm border-l-4 border-l-[#25D366]">
              <p className="italic text-slate-700 text-sm mb-4 leading-relaxed">
                "Vendi meu carro em menos de uma semana. O Luiz cuidou de tudo com extrema
                transparência. Não precisei me preocupar com nada."
              </p>
              <p className="font-bold text-sm">- João Silva</p>
            </Card>
            <Card className="p-6 bg-background shadow-sm border-l-4 border-l-[#25D366]">
              <p className="italic text-slate-700 text-sm mb-4 leading-relaxed">
                "Comprei um seminovo com eles e a qualidade e procedência são garantidas. O
                atendimento do Gabriel no financiamento foi excepcional."
              </p>
              <p className="font-bold text-sm">- Maria Santos</p>
            </Card>
            <Card className="p-6 bg-background shadow-sm border-l-4 border-l-[#25D366]">
              <p className="italic text-slate-700 text-sm mb-4 leading-relaxed">
                "Confiança é tudo na hora de trocar de carro. A equipe da Carro e Cia me deu toda a
                segurança que eu precisava."
              </p>
              <p className="font-bold text-sm">- Carlos Eduardo</p>
            </Card>
          </div>

          <div className="mt-12 max-w-2xl mx-auto text-center bg-gradient-to-br from-[#25D366] to-[#128C7E] p-8 rounded-2xl text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-3">Pronto para Vender ou Comprar?</h3>
            <p className="mb-6 opacity-90">
              Fale com o Luiz e descubra como podemos ajudar você a fazer o melhor negócio.
            </p>
            <Button
              className="w-full sm:w-auto bg-white text-[#25D366] hover:bg-slate-50 font-bold px-8 h-14"
              asChild
            >
              <a
                href="https://wa.me/5534999484285?text=Olá Luiz! Quero saber mais sobre como fazer um bom negócio."
                target="_blank"
                rel="noopener noreferrer"
              >
                CHAMAR LUIZ NO WHATSAPP
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              O Time da Carro e Cia
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossa equipe é formada por especialistas dedicados a oferecer a melhor solução.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="overflow-hidden border-border/50 flex flex-col">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
                alt="Luiz Fernando"
                className="w-full h-[250px] object-cover object-top"
                loading="lazy"
              />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold font-display">Luiz Fernando</h3>
                <p className="text-xs text-muted-foreground italic mb-2">CEO & Fundador</p>
                <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  Apaixonado | Vendedor
                </div>
                <p className="text-slate-600 text-sm mb-6 flex-1">
                  Luiz é o coração da Carro e Cia com mais de 20 anos dedicados ao mercado. Sua
                  missão é ser referência em consignação segura.
                </p>
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" asChild>
                  <a
                    href="https://wa.me/5534999484285?text=Olá Luiz, gostaria de falar sobre consignação!"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Falar com Luiz
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Adriana-foto-profissional.webp"
                alt="Adriana Araújo"
                className="w-full h-[250px] object-cover object-top"
                loading="lazy"
              />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold font-display">Adriana Araújo</h3>
                <p className="text-xs text-muted-foreground italic mb-2">Esposa de Luiz Fernando</p>
                <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  Administradora
                </div>
                <p className="text-slate-600 text-sm mb-6 flex-1">
                  Cuida de toda a parte administrativa e processos internos, garantindo segurança e
                  transparência em todas as operações.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                  asChild
                >
                  <a href="https://wa.me/5534999484285" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" /> Contato Administrativo
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Roberto-Junior-foto-profissional.webp"
                alt="Roberto de Araújo Jr."
                className="w-full h-[250px] object-cover object-top"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp'
                }}
              />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold font-display">Roberto de Araújo Jr.</h3>
                <p className="text-xs text-muted-foreground italic mb-2">Irmão de Luiz Fernando</p>
                <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  Vendas | Relacionamento
                </div>
                <p className="text-slate-600 text-sm mb-6 flex-1">
                  Responsável pelo setor de vendas e suporte comercial. Dedicado a encontrar o
                  veículo ideal para cada perfil de cliente.
                </p>
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" asChild>
                  <a
                    href="https://wa.me/5534999484285?text=Olá Roberto, gostaria de falar sobre um veículo!"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Falar com Roberto
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Gabriel-foto-profissional.webp"
                alt="Gabriel Araújo"
                className="w-full h-[250px] object-cover object-top"
                loading="lazy"
              />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold font-display">Gabriel Araújo</h3>
                <p className="text-xs text-muted-foreground italic mb-2">Filho de Luiz Fernando</p>
                <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  Proteção | Financiamentos
                </div>
                <p className="text-slate-600 text-sm mb-6 flex-1">
                  Especialista no departamento de seguros e financiamentos, garantindo que você saia
                  com total proteção e as melhores taxas.
                </p>
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" asChild>
                  <a
                    href="https://wa.me/5534992000300?text=Olá Gabriel, gostaria de falar sobre financiamento e seguros!"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Falar com Gabriel
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Jessica-foto-profissional.webp"
                alt="Jessica Germano"
                className="w-full h-[250px] object-cover object-top"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp'
                }}
              />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold font-display">Jessica Germano</h3>
                <p className="text-xs text-muted-foreground italic mb-2">Assistente Financeira</p>
                <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  Organização | Precisão
                </div>
                <p className="text-slate-600 text-sm mb-6 flex-1">
                  Jessica é responsável pela gestão financeira da Carro e Cia. Com atenção aos
                  detalhes, garante transparência e segurança em cada transação.
                </p>
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" asChild>
                  <a
                    href="https://wa.me/5534999484285?text=Olá Jessica, gostaria de falar sobre assuntos financeiros!"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Falar com Jessica
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 text-center bg-slate-50">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Venha Nos Visitar</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Conheça nossa equipe pessoalmente. Tomar um café e conversar sobre o seu próximo
            veículo.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" /> Endereço
              </h4>
              <p className="text-sm text-muted-foreground">
                Av. Guilherme Ferreira, 1119
                <br />
                Uberaba - MG
              </p>
            </div>
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" /> Contato
              </h4>
              <p className="text-sm text-muted-foreground">
                contato@carroeciamotors.com.br
                <br />
                (34) 99948-4285
              </p>
            </div>
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" /> Horário
              </h4>
              <p className="text-sm text-muted-foreground">
                Seg-Sex: 9h - 18h
                <br />
                Sáb: 9h - 14h
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
