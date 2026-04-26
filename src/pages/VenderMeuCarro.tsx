import { SEO } from '@/components/SEO'
import { LeadForm } from '@/components/LeadForm'
import { Partners } from '@/components/home/Partners'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion, trackCTAClick } from '@/lib/tracking'
import { CheckCircle2 } from 'lucide-react'

const team = [
  {
    name: 'Luiz Fernando',
    role: 'CEO & Fundador',
    bio: '20+ anos de experiência. Apaixonado por carros e dedicado a oferecer a melhor solução para seus clientes.',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp',
  },
  {
    name: 'Roberto Junior',
    role: 'Vendedor & Suporte Comercial',
    bio: 'Especialista em vendas com foco em relacionamento e satisfação do cliente.',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Roberto-Junior-foto-profissional.webp',
  },
  {
    name: 'Jessica Germano',
    role: 'Assistente Financeira',
    bio: 'Responsável pela gestão financeira com transparência e segurança em cada transação.',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Ljessica-foto-profissional.webp',
  },
]

export default function VenderMeuCarro() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Carro e Cia Veículos',
    url: 'https://carroeciamotors.com.br',
    telephone: '+5534999484285',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Guilherme Ferreira, 1119',
      addressLocality: 'Uberaba',
      addressRegion: 'MG',
      postalCode: '38022-200',
      addressCountry: 'BR',
    },
  }

  const faqs = [
    {
      q: '⏱️ Quanto tempo leva para vender meu carro?',
      a: (
        <>
          <p className="mb-3 text-slate-600 leading-relaxed">
            Em média, <strong>7 dias</strong>. Nossos clientes estão sempre procurando carros de
            qualidade. Temos uma base de mais de 5.000 clientes que já conhecem a Carro & Cia. Se
            seu carro estiver em bom estado, a venda é rápida.
          </p>
        </>
      ),
    },
    {
      q: '💰 Qual é o preço que vocês oferecem?',
      a: (
        <>
          <p className="mb-3 text-slate-600 leading-relaxed">
            O preço é <strong>avaliado gratuitamente</strong> quando você traz o carro. Nossos
            especialistas analisam quilometragem, condição e histórico.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Oferecemos o <strong>melhor preço do mercado</strong> porque temos muitos compradores
            esperando.
          </p>
        </>
      ),
    },
    {
      q: '💳 Preciso pagar alguma taxa?',
      a: (
        <>
          <p className="mb-3 text-slate-600 leading-relaxed">
            <strong>Não há taxa antecipada.</strong> Você só paga uma comissão (10-15%) DEPOIS que o
            carro é vendido. Se não vender, você não paga nada.
          </p>
        </>
      ),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Venda Seu Carro Rápido em Uberaba | Consignação Segura"
        description="Venda seu carro rápido e seguro em Uberaba. Consignação com garantia. Avaliação grátis. Venda em 7 dias garantido."
        schema={schema}
      />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <picture className="w-full h-full block">
            <source
              media="(max-width: 768px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-mobile.webp"
              type="image/webp"
            />
            <source
              media="(min-width: 769px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
              type="image/webp"
            />
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
              alt="Fachada Carro e Cia Veículos Uberaba"
              width="1920"
              height="1080"
              className="w-full h-full object-cover object-center"
              style={{ aspectRatio: '16/9' }}
            />
          </picture>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white text-center lg:text-left">
            <div className="inline-block bg-[#FF6B6B] text-white px-4 py-2 rounded-full font-bold text-sm mb-6 animate-pulse">
              ⚡ VENDA SEU CARRO EM ATÉ 7 DIAS
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Venda Seu Carro Rápido — Consignação Segura
            </h1>

            <p className="text-xl text-gray-200 mb-8 max-w-xl mx-auto lg:mx-0">
              Quer vender seu carro rápido, seguro e sem complicações? A Carro e Cia Veículos
              oferece a solução completa de consignação em Uberaba.
            </p>

            <div className="flex flex-col gap-4 text-left max-w-sm mx-auto lg:mx-0 mb-8">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  ✓
                </span>
                <p className="text-lg font-medium">Venda em até 7 dias garantido</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  ✓
                </span>
                <p className="text-lg font-medium">Melhor preço do mercado</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  ✓
                </span>
                <p className="text-lg font-medium">Você recebe ANTES de entregar a chave</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <div className="bg-white/85 dark:bg-card/85 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden p-5 md:p-6 border-t-4 border-[#25D366]">
              <div className="mb-5 text-center">
                <h3 className="text-2xl font-bold text-slate-800">Avaliação Gratuita</h3>
                <p className="text-sm text-slate-600">Deixe seus dados e vendemos para você.</p>
              </div>
              <LeadForm
                tipo="venda"
                campanha="consignacao"
                origem="Página - Vender Meu Carro"
                buttonText="AVALIAR MEU CARRO AGORA"
                whatsappText="Olá Luiz, quero avaliar meu carro para venda!"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEO CONTENT SECTION */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl prose prose-lg dark:prose-invert">
          <h2>O Problema de Vender Seu Carro Sozinho</h2>
          <p>
            Vender um carro particular é arriscado e demorado. Você enfrenta o risco de golpes e
            fraudes, documentação complexa, dificuldade em encontrar um comprador real, além de
            colocar sua segurança pessoal em risco recebendo estranhos. É muito tempo e energia
            gastos.
          </p>

          <h2>A Solução: Consignação de Veículos</h2>
          <p>
            Na Carro e Cia, você consigna seu carro conosco e nós cuidamos de tudo. Oferecemos
            avaliação profissional e gratuita, anunciamos em 5 plataformas de ponta (iCarros,
            WebMotors, OLX, Mercado Livre e nosso próprio site), tiramos fotos profissionais com
            descrição atrativa, fazemos todo o atendimento aos interessados, negociamos os valores e
            garantimos uma documentação segura e transparente.
          </p>

          <h2>Como Funciona a Consignação?</h2>
          <div className="space-y-6 my-8 not-prose">
            {[
              {
                title: 'Passo 1: Avaliação Grátis',
                desc: 'Você traz seu carro para avaliação. Nossos especialistas analisam a marca, modelo, ano, quilometragem, condição mecânica e estética, histórico de manutenção e definem um preço justo de mercado.',
              },
              {
                title: 'Passo 2: Contrato de Consignação',
                desc: 'Assinamos um contrato que protege ambas as partes. Você mantém a propriedade do carro, nós anunciamos e vendemos com total transparência.',
              },
              {
                title: 'Passo 3: Anúncio Multi-plataforma',
                desc: 'Seu carro ganha o mundo! Anunciamos nas maiores plataformas do Brasil para atrair milhares de olhares.',
              },
              {
                title: 'Passo 4: Venda em 7 Dias Garantido',
                desc: 'Em média, vendemos carros em 7 dias. Se não vender, você recebe seu carro de volta sem nenhuma taxa.',
              },
              {
                title: 'Passo 5: Recebimento Seguro',
                desc: 'Você recebe o dinheiro integralmente ANTES de entregar as chaves. Segurança total para o seu patrimônio.',
              },
            ].map((s, i) => (
              <div key={i} className="bg-muted/30 p-6 rounded-xl border flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2>Quanto Custa Consignar?</h2>
          <p>
            A consignação é <strong>gratuita</strong>. Você só paga uma comissão (10-15%) DEPOIS que
            o carro é vendido. Isso significa que nosso sucesso é seu sucesso.
          </p>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Conheça Nossa Equipe</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border/50"
              >
                <div className="w-full h-[300px] overflow-hidden bg-slate-100">
                  <img
                    src={member.img}
                    alt={`${member.name} - ${member.role}`}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-[#25D366] font-bold text-xs uppercase tracking-wide mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 border-t bg-white">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Perguntas Frequentes</h2>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-card rounded-xl border border-slate-200 p-2 shadow-sm"
          >
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-slate-100 last:border-0 px-4"
              >
                <AccordionTrigger className="text-left font-bold text-base hover:text-[#25D366] transition-colors py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-base pb-6">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-16 text-center">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-10 text-base md:text-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-bold shadow-lg shadow-[#25D366]/20 transition-all hover:scale-105 btn-cta"
            >
              <a
                href={getWhatsAppLink('Olá Luiz! Quero avaliar meu carro para consignação.')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackConversion('whatsapp')
                  trackCTAClick('Avaliar Carro WhatsApp', window.location.href)
                }}
              >
                QUERO AVALIAR MEU CARRO AGORA
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Partners />
    </div>
  )
}
