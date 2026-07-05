import { useEffect, useState } from 'react'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Mail, Clock, MessageCircle, Star, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getWhatsAppLink } from '@/lib/whatsapp'

export default function Sobre() {
  const [equipe, setEquipe] = useState<any[]>([])
  const [depoimentos, setDepoimentos] = useState<any[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)

  useEffect(() => {
    supabase
      .from('usuarios')
      .select('id, nome, role')
      .eq('ativo', true)
      .then(({ data }) => {
        setEquipe(data || [])
        setLoadingTeam(false)
      })

    supabase
      .from('site_depoimentos')
      .select('*')
      .eq('publicado', true)
      .limit(3)
      .then(({ data }) => {
        setDepoimentos(data || [])
      })
  }, [])

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

      <section className="container max-w-6xl mx-auto px-4 mb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-left mb-8">
              <picture className="inline-block">
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

                  <div className="flex flex-col gap-2 mt-6">
                    <div className="text-[13px] text-[#25D366] font-bold">
                      ✓ 20+ Anos de Mercado
                    </div>
                    <div className="text-[13px] text-[#25D366] font-bold">
                      ✓ 5.000+ Clientes Satisfeitos
                    </div>
                    <div className="text-[13px] text-[#25D366] font-bold">
                      ✓ Referência em Uberaba
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 bg-muted/40 p-6 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-black text-[#25D366] mb-1">20+</div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Anos de Mercado
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-[#25D366] mb-1">5.000+</div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Clientes Satisfeitos
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-[#25D366] mb-1">100%</div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Transparência</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
              alt="Showroom Carro e Cia Veículos"
              className="rounded-2xl shadow-2xl object-cover w-full h-[200px] md:h-[400px]"
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 border-y border-border/50">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-muted-foreground">
              Depoimentos reais de quem confiou na Carro e Cia.
            </p>
          </div>

          {depoimentos.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {depoimentos.map((dep, i) => (
                <Card
                  key={i}
                  className="p-6 bg-background shadow-sm border-l-4 border-l-[#25D366] flex flex-col"
                >
                  <div className="flex gap-1 text-accent mb-4">
                    {Array.from({ length: dep.estrelas || 5 }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <p className="italic text-slate-700 text-sm mb-4 leading-relaxed flex-1">
                    "{dep.texto}"
                  </p>
                  <p className="font-bold text-sm text-[#666] mt-auto">- {dep.nome_cliente}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum depoimento encontrado.</p>
            </div>
          )}

          <div className="mt-12 max-w-2xl mx-auto text-center bg-gradient-to-br from-[#25D366] to-[#128C7E] p-8 rounded-2xl text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-3">Pronto para Vender ou Comprar?</h3>
            <p className="mb-6 opacity-90">
              Fale com nossa equipe e descubra como podemos ajudar você a fazer o melhor negócio.
            </p>
            <Button
              className="w-full bg-white text-[#25D366] hover:bg-slate-50 font-bold px-8 h-14"
              asChild
            >
              <a
                href={getWhatsAppLink('Olá! Quero saber mais sobre como fazer um bom negócio.')}
                target="_blank"
                rel="noopener noreferrer"
              >
                CHAMAR NO WHATSAPP
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Nossos Especialistas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Profissionais dedicados a oferecer a melhor solução para você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="overflow-hidden border-border/50 flex flex-col p-6 items-center text-center shadow-sm">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
                alt="Luiz Fernando, CEO Carro e Cia"
                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-background mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-bold font-display mb-1">Luiz Fernando</h3>
              <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-4">
                CEO & Fundador · 20+ anos
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Liderando a Carro e Cia com dedicação e humanidade em cada transação.
              </p>
              <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white mt-auto" asChild>
                <a
                  href={getWhatsAppLink('Olá Luiz! Vim pelo site e gostaria de mais informações.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar com Luiz
                </a>
              </Button>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col p-6 items-center text-center shadow-sm">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/gabriel%20na%20mesa.jpeg"
                alt="Gabriel Araújo, especialista em Seguro Auto"
                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-background mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-bold font-display mb-1">Gabriel Araújo</h3>
              <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-4">
                Seguro Auto · Km Zero Seguros
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Especialista em seguro auto, garantindo a melhor cobertura pelo melhor preço.
              </p>
              <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white mt-auto" asChild>
                <a
                  href={getWhatsAppLink(
                    'Olá Gabriel! Vim pelo site e gostaria de falar sobre Seguro Auto.',
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar com Gabriel
                </a>
              </Button>
            </Card>

            <Card className="overflow-hidden border-border/50 flex flex-col p-6 items-center text-center shadow-sm">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/adriana%20na%20mesa.jpeg"
                alt="Adriana Araújo, especialista em seguros, consórcios e financiamentos"
                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-background mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-bold font-display mb-1">Adriana Araújo</h3>
              <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-4">
                Seguros, Consórcios e Financiamentos
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Demais seguros, consórcios e financiamentos. A melhor solução para o seu bolso.
              </p>
              <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white mt-auto" asChild>
                <a
                  href={getWhatsAppLink(
                    'Olá Adriana! Vim pelo site e gostaria de falar sobre consórcios e financiamentos.',
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar com Adriana
                </a>
              </Button>
            </Card>
          </div>

          <div className="text-center mb-16 mt-20">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Equipe Completa</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Conheça todos os membros da nossa equipe.
            </p>
          </div>

          {loadingTeam ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted/50 border-0" />
              ))}
            </div>
          ) : equipe.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum membro da equipe encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {equipe.map((membro) => (
                <Card
                  key={membro.id}
                  className="overflow-hidden border-border/50 flex flex-col p-6 items-center text-center shadow-sm"
                >
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold mb-4">
                    {membro.nome.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold font-display mb-1">{membro.nome}</h3>
                  <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-6">
                    {membro.role || 'Consultor'}
                  </p>
                  <Button
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white mt-auto"
                    asChild
                  >
                    <a
                      href={getWhatsAppLink(
                        `Olá ${membro.nome}, gostaria de falar sobre veículos!`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> Falar com{' '}
                      {membro.nome.split(' ')[0]}
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 text-center bg-slate-50 dark:bg-muted/10">
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
