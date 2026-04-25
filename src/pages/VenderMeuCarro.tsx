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
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Jessica-foto-profissional.webp',
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
          <p className="text-slate-600 leading-relaxed">
            <strong>Pior cenário:</strong> 30 dias (para carros com problemas mecânicos).
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
            especialistas analisam:
          </p>
          <ul className="list-disc pl-5 mb-3 text-slate-600 space-y-1">
            <li>Marca, modelo e ano</li>
            <li>Quilometragem</li>
            <li>Condição mecânica e estética</li>
            <li>Histórico de manutenção</li>
          </ul>
          <p className="text-slate-600 leading-relaxed">
            Oferecemos o <strong>melhor preço do mercado</strong> porque temos muitos compradores
            esperando. Sem intermediários, sem surpresas.
          </p>
        </>
      ),
    },
    {
      q: '🔒 O pagamento é seguro?',
      a: (
        <>
          <p className="mb-3 text-slate-600 leading-relaxed">
            <strong>100% seguro.</strong> Você recebe o dinheiro ANTES de entregar as chaves do
            carro. Temos um contrato de consignação que protege ambas as partes.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Trabalhamos com bancos parceiros (Bradesco, Santander, BV) para garantir a segurança da
            transação.
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
          <p className="text-slate-600 leading-relaxed">
            Isso significa que nosso sucesso é seu sucesso. Temos incentivo para vender seu carro
            rápido e pelo melhor preço.
          </p>
        </>
      ),
    },
    {
      q: '📍 Vocês cuidam da documentação?',
      a: (
        <>
          <p className="mb-3 text-slate-600 leading-relaxed">
            <strong>Sim, cuidamos de tudo.</strong> Você não precisa fazer nada além de trazer o
            carro e os documentos originais.
          </p>
          <p className="mb-3 text-slate-600 leading-relaxed">A gente cuida de:</p>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>Anúncios em 5 plataformas</li>
            <li>Fotos profissionais</li>
            <li>Limpeza e manutenção</li>
            <li>Negociação com compradores</li>
            <li>Documentação de transferência</li>
          </ul>
        </>
      ),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Vender Meu Carro Rápido em Uberaba | Carro e Cia"
        description="Quer vender seu carro rápido e pelo melhor preço em Uberaba? Consigne com a Carro e Cia. Avaliação grátis e venda em até 7 dias!"
        schema={schema}
      />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <picture className="w-full h-full block">
            <source
              media="(max-width: 768px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/fachada-mobile.webp"
              type="image/webp"
            />
            <source
              media="(min-width: 769px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/fachada-da-loja.webp"
              type="image/webp"
            />
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
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
              Venda Seu Carro Rápido e Seguro
            </h1>

            <p className="text-xl text-gray-200 mb-8 max-w-xl mx-auto lg:mx-0">
              Sem riscos, sem golpes, sem perder tempo. Consigne seu carro com a Carro & Cia e deixe
              a gente vender para você.
            </p>

            <div className="flex flex-col gap-4 text-left max-w-sm mx-auto lg:mx-0 mb-8">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  ✓
                </span>
                <p className="text-lg font-medium">Venda em até 7 dias</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  ✓
                </span>
                <p className="text-lg font-medium">Melhor preço garantido</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  ✓
                </span>
                <p className="text-lg font-medium">100% seguro e transparente</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <LeadForm
              tipo="venda"
              campanha="consignacao"
              origem="Página - Vender Meu Carro"
              buttonText="AVALIAR MEU CARRO AGORA"
              whatsappText="Olá Luiz, quero avaliar meu carro para venda!"
            />
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Como Funciona (4 Passos Simples)
          </h2>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-border z-0"></div>

            {[
              {
                step: '1',
                title: 'Avaliação Gratuita',
                time: '⏱️ 30 minutos',
                desc: 'Você traz seu carro, nossos especialistas fazem uma avaliação completa e oferecem o melhor preço do mercado.',
              },
              {
                step: '2',
                title: 'Contrato Seguro',
                time: '⏱️ 15 minutos',
                desc: 'Assinamos um contrato de consignação que protege você e a gente. Transparência total.',
              },
              {
                step: '3',
                title: 'Anúncio em 5 Plataformas',
                time: '⏱️ 1 dia',
                desc: 'Seu carro é anunciado em iCarros, WebMotors, OLX, Mercado Livre e nosso site. Máxima visibilidade.',
              },
              {
                step: '4',
                title: 'Venda Realizada',
                time: '⏱️ Até 7 dias',
                desc: 'Seu carro é vendido. Você recebe o dinheiro. Fim da história. Simples assim.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-card border-2 border-slate-100 rounded-xl p-8 text-center relative z-10 hover:border-primary transition-colors hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-md">
                  {item.step}
                </div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-[#FF6B6B] font-bold text-sm mb-4">{item.time}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Por Que Consignar com a Gente?
          </h2>

          <div className="overflow-x-auto rounded-xl shadow-lg border border-border">
            <table className="w-full text-left border-collapse bg-card min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-5 font-bold bg-muted/50 border-b-2 text-lg">Critério</th>
                  <th className="p-5 font-bold bg-red-50/50 border-b-2 text-red-500 text-lg">
                    Venda Particular
                  </th>
                  <th className="p-5 font-bold bg-green-50/50 border-b-2 text-[#25D366] text-lg">
                    Consignação Carro & Cia
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-5 font-medium text-slate-700">Tempo Médio de Venda</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">30-60 dias</td>
                  <td className="p-5 font-medium bg-green-50/30">
                    <span className="bg-[#25D366] text-white px-3 py-1 rounded-md font-bold text-sm">
                      7 dias
                    </span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-5 font-medium text-slate-700">Risco de Golpe</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">❌ Alto risco</td>
                  <td className="p-5 font-medium text-[#25D366] bg-green-50/30">✅ Zero risco</td>
                </tr>
                <tr className="border-b">
                  <td className="p-5 font-medium text-slate-700">Alcance de Clientes</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">Amigos + OLX</td>
                  <td className="p-5 font-medium text-slate-800 bg-green-50/30">
                    5 plataformas + 20 anos de clientes
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-5 font-medium text-slate-700">Segurança Legal</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">❌ Sem contrato</td>
                  <td className="p-5 font-medium text-[#25D366] bg-green-50/30">
                    ✅ Contrato protegido
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-5 font-medium text-slate-700">Preço Oferecido</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">Varia muito</td>
                  <td className="p-5 font-medium text-slate-800 bg-green-50/30">
                    Melhor preço garantido
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-5 font-medium text-slate-700">Cuidado com o Carro</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">Você cuida</td>
                  <td className="p-5 font-medium text-slate-800 bg-green-50/30">
                    Limpamos e cuidamos
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-slate-700">Documentação</td>
                  <td className="p-5 text-slate-500 bg-red-50/30">Você faz tudo</td>
                  <td className="p-5 font-medium text-slate-800 bg-green-50/30">
                    Carro & Cia cuida de tudo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
