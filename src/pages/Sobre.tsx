import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { ShieldCheck, Eye, Heart, MapPin, Phone, Mail, Clock } from 'lucide-react'
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
                <source
                  media="(min-width: 481px)"
                  srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  type="image/webp"
                />
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  alt="Carro e Cia - 20+ anos"
                  loading="eager"
                  width="200"
                  height="80"
                  className="max-w-full h-auto object-contain"
                />
              </picture>
            </div>
            <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-2">
              A HISTÓRIA DE LUIZ FERNANDO
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold leading-tight">
              A Paixão Que Virou Profissão
            </h1>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Tudo começou em 2003. Luiz Fernando tinha uma paixão simples e pura: carros. Começou
                como vendedor em uma loja por 4 anos. Aprendia cada dia, cada cliente, cada detalhe
                de cada veículo.
              </p>
              <p>
                A oportunidade bateu à porta quando foi convidado a ser sócio de uma nova loja. Luiz
                não hesitou. Agarrou a chance. Desde então, dedicou 20+ anos construindo a Carro e
                Cia com profissionalismo, humanidade e amor genuíno pelo que faz.
              </p>
              <p>
                Hoje, Luiz não quer apenas vender carros. Ele quer ser referência no Brasil em
                consignação segura, em soluções certas, em confiança. Seu objetivo: acolher cada
                cliente, entender a dor de cada um, trazer a solução perfeita.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
              alt="Luiz Fernando, CEO Carro e Cia - 20+ anos dedicado ao mercado automotivo"
              width="600"
              height="800"
              className="rounded-2xl shadow-2xl object-cover w-full aspect-[3/4]"
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Valores da Carro e Cia
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossos pilares fundamentais que guiam cada transação há mais de duas décadas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-border/50">
              <ShieldCheck className="w-12 h-12 mx-auto mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4">Confiança é Tudo</h3>
              <p className="text-muted-foreground">
                20+ anos no mercado. Contrato protetor. Procedência verificada. Você está seguro
                conosco.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-border/50">
              <Eye className="w-12 h-12 mx-auto mb-6 text-blue-500" />
              <h3 className="text-2xl font-bold mb-4">Sem Surpresas</h3>
              <p className="text-muted-foreground">
                Tudo claro, tudo honesto, tudo explicado. Nenhuma burocracia, nenhum jogo. Você sabe
                exatamente o que esperar.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-border/50">
              <Heart className="w-12 h-12 mx-auto mb-6 text-red-500" />
              <h3 className="text-2xl font-bold mb-4">Você é Ouvido</h3>
              <p className="text-muted-foreground">
                Luiz acredita que cada cliente tem uma história, uma dor, uma solução. A gente
                acolhe e oferece a melhor saída.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            A Jornada de Luiz
          </h2>
          <div className="space-y-12">
            {[
              {
                year: '2003',
                title: 'Começou como Vendedor Apaixonado',
                desc: 'Iniciou com um sonho de trabalhar com carros, aprendendo a base do atendimento e das vendas.',
              },
              {
                year: '2007',
                title: 'Tornando-se Sócio',
                desc: 'A oportunidade de ser sócio de uma nova loja surgiu. Um risco calculado que mudou sua trajetória.',
              },
              {
                year: 'Hoje',
                title: 'CEO da Carro e Cia',
                desc: '20+ anos de mercado, referência absoluta em Uberaba com o objetivo de ser referência no Brasil.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 md:gap-12 items-start">
                <div className="w-24 md:w-32 shrink-0 text-right">
                  <span className="text-2xl md:text-3xl font-extrabold text-primary">
                    {item.year}
                  </span>
                </div>
                <div className="w-4 h-4 mt-2.5 rounded-full bg-primary shrink-0 relative z-10 shadow-[0_0_0_4px_hsl(var(--background)),0_0_0_8px_hsl(var(--primary)/0.2)]"></div>
                <div className="flex-1 pb-12 border-l border-border/50 -ml-[27px] pl-10 md:pl-16 relative top-2.5">
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1A1A1A] text-white py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            Métricas Que Falam
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-primary mb-2">20+</div>
              <p className="text-gray-400 font-medium">Anos de mercado</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-primary mb-2">1.000+</div>
              <p className="text-gray-400 font-medium">Carros consignados</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-primary mb-2">95%+</div>
              <p className="text-gray-400 font-medium">Clientes satisfeitos</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-primary mb-2">15</div>
              <p className="text-gray-400 font-medium">Dias para vender (média)</p>
            </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="overflow-hidden border-border/50">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
                alt="Luiz Fernando"
                className="w-full h-64 object-cover object-top"
                loading="lazy"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold font-display">Luiz Fernando</h3>
                <p className="text-primary font-medium mb-3 text-sm">CEO & Fundador</p>
                <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Apaixonado | Vendedor
                </div>
                <p className="text-muted-foreground text-sm">
                  Luiz é o coração da Carro e Cia com mais de 20 anos dedicados ao mercado. Sua
                  missão é ser referência em consignação segura, acolhendo cada cliente e buscando a
                  melhor solução.
                </p>
              </div>
            </Card>
            <Card className="overflow-hidden border-border/50">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Adriana-foto-profissional.webp"
                alt="Adriana Araújo"
                className="w-full h-64 object-cover object-top"
                loading="lazy"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold font-display">Adriana Araújo</h3>
                <p className="text-primary font-medium mb-3 text-sm">Administradora</p>
                <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Organização | Transparência
                </div>
                <p className="text-muted-foreground text-sm">
                  Esposa de Luiz e administradora da empresa, Adriana cuida de toda a parte
                  administrativa e processos internos, garantindo segurança e transparência em todas
                  as operações.
                </p>
              </div>
            </Card>
            <Card className="overflow-hidden border-border/50">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Roberto-foto-profissional.webp"
                alt="Roberto de Araújo Jr."
                className="w-full h-64 object-cover object-top"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp'
                }}
              />
              <div className="p-6">
                <h3 className="text-xl font-bold font-display">Roberto de Araújo Jr.</h3>
                <p className="text-primary font-medium mb-3 text-sm">Vendas & Suporte Comercial</p>
                <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Vendas | Relacionamento
                </div>
                <p className="text-muted-foreground text-sm">
                  Irmão de Luiz e responsável pelo setor de vendas e suporte comercial. Dedicado a
                  oferecer atendimento personalizado e encontrar o veículo ideal para cada perfil de
                  cliente.
                </p>
              </div>
            </Card>
            <Card className="overflow-hidden border-border/50">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Gabriel-foto-profissional.webp"
                alt="Gabriel Araújo"
                className="w-full h-64 object-cover object-top"
                loading="lazy"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold font-display">Gabriel Araújo</h3>
                <p className="text-primary font-medium mb-3 text-sm">Especialista em Seguros</p>
                <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Proteção | Financiamentos
                </div>
                <p className="text-muted-foreground text-sm">
                  Filho de Luiz e responsável pelo departamento de seguros e financiamentos através
                  da parceria com a Km Zero, garantindo que você saia com total proteção e as
                  melhores taxas.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20 border-y border-border/50">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-8">Depoimentos do Time</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 text-left bg-background shadow-sm">
              <p className="italic text-muted-foreground mb-4">
                "Luiz é mais que meu irmão e chefe. É meu mentor. Aprendo com ele que vender é
                acolher. Clientes não vêm aqui só comprar carro, vêm buscar solução. Isso Luiz
                oferece melhor que ninguém."
              </p>
              <p className="font-bold">- Roberto de Araújo Jr.</p>
            </Card>
            <Card className="p-6 text-left bg-background shadow-sm">
              <p className="italic text-muted-foreground mb-4">
                "Fazer parte da administração desta empresa em família me enche de orgulho. O nível
                de compromisso e transparência que mantemos com cada cliente é o nosso verdadeiro
                diferencial no mercado."
              </p>
              <p className="font-bold">- Adriana Araújo</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Pronto Para Confiar?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Conheça Luiz e a Carro e Cia pessoalmente. Venha tomar um café com a gente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <a href="/contato" onClick={() => trackCTAClick('Visitar Loja', '/sobre')}>
                <MapPin className="mr-2 w-5 h-5" /> Visitar Loja
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2" asChild>
              <a
                href={getWhatsAppLink(
                  'Olá Luiz! Li sua história no site e quero conversar sobre negócios.',
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCTAClick('Falar com Luiz via WhatsApp', '/sobre')}
              >
                <Phone className="mr-2 w-5 h-5 text-[#25D366]" /> Falar com Luiz via WhatsApp
              </a>
            </Button>
          </div>

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
