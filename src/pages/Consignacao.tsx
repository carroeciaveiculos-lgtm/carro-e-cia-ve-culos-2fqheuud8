import { SEO } from '@/components/SEO'
import { LeadForm } from '@/components/LeadForm'
import { Partners } from '@/components/home/Partners'
import { CheckCircle2 } from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion, trackGTMEvent } from '@/lib/tracking'

const team = [
  {
    name: 'Luiz Fernando',
    role: 'CEO',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Luiz-Fernando-foto-profissional.webp',
    position: 'center 20%',
  },
  {
    name: 'Gabriel',
    role: 'Vendedor',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Gabriel-foto-profissional.webp',
    position: 'center 15%',
  },
  {
    name: 'Jessica Germano',
    role: 'Financeiro',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Ljessica-foto-profissional.webp',
    position: 'center 10%',
  },
]

export default function Consignacao() {
  const faqs = [
    {
      q: 'Quanto tempo leva para vender?',
      a: 'O tempo médio varia, mas com nossa divulgação profissional, muitos veículos são vendidos em menos de 30 dias.',
    },
    {
      q: 'Qual é a comissão da loja?',
      a: 'A comissão é transparente e fixada em contrato. Entre em contato para uma avaliação e detalhes dos valores.',
    },
    {
      q: 'O veículo fica na loja?',
      a: 'Sim, em pátio seguro e segurado, garantindo exposição máxima aos compradores.',
    },
    {
      q: 'E se eu precisar do carro?',
      a: 'Temos contratos flexíveis. Basta nos avisar com antecedência.',
    },
    {
      q: 'A loja garante a venda?',
      a: 'Fazemos todo o esforço de marketing, financiamento e negociação para viabilizar a venda o mais rápido possível.',
    },
  ]

  const schema = [
    {
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: 'https://carroeciamotors.com.br',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Consignação',
          item: 'https://carroeciamotors.com.br/consignacao',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Consignação de Veículos em Uberaba MG | Carro e Cia Veículos"
        description="Consigne seu veículo na Carro e Cia em Uberaba MG. Mais de 20 anos de mercado, contrato seguro, anúncios profissionais e venda garantida. Simule grátis!"
        schema={schema}
      />

      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <picture>
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
            <source
              media="(max-width: 768px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada-mobile.jpg"
              type="image/jpeg"
            />
            <source
              media="(min-width: 769px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
              type="image/jpeg"
            />
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
              alt="Fachada da loja Carro e Cia em Uberaba - MG, localizada em avenida estratégica com múltiplos veículos de qualidade"
              width="1920"
              height="1080"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
          </picture>
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Consignação de Veículos em Uberaba: A Forma Mais Inteligente de Vender Seu Carro
            </h1>
            <p className="text-xl text-gray-200">
              20 anos de experiência. Contrato seguro. Você não faz nada — a gente vende pra você.
            </p>
          </div>
          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <LeadForm
              tipo="consignacao"
              campanha="consignacao"
              buttonText="Quero Consignar Meu Carro Agora"
              whatsappText="Olá Luiz, quero consignar meu carro!"
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Por Que a Consignação é a Melhor Opção para Vender Seu Carro?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Vender um carro pode ser um processo demorado e estressante. Desde a preparação do
            veículo, passando pela criação de anúncios, até a negociação com potenciais compradores
            e a burocracia da transferência, cada etapa exige tempo e conhecimento. A consignação
            surge como a alternativa inteligente, delegando todo esse trabalho a especialistas. Na
            Carro e Cia, você conta com a expertise de 20 anos de mercado para vender seu veículo de
            forma rápida, segura e pelo melhor preço, sem que você precise se preocupar com nada.
          </p>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nossos Diferenciais na Consignação
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                t: 'Segurança Jurídica',
                d: 'Contrato claro e transparente que protege seus interesses.',
              },
              {
                t: 'Avaliação Profissional',
                d: 'Definimos o preço justo de mercado para seu veículo.',
              },
              {
                t: 'Marketing Abrangente',
                d: 'Anunciamos seu carro nas maiores plataformas e redes sociais.',
              },
              {
                t: 'Financiamento Facilitado',
                d: 'Oferecemos opções de financiamento para o comprador, agilizando a venda.',
              },
              {
                t: 'Zero Preocupação',
                d: 'Cuidamos de toda a negociação, documentação e transferência.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-4 items-start p-6 bg-background rounded-xl shadow-sm"
              >
                <CheckCircle2 className="w-8 h-8 text-primary shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-xl mb-2">{item.t}</h3>
                  <p className="text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Consignação Carro e Cia: Transparência e Confiança
          </h2>
          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse bg-card">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-4 font-bold">Benefício</th>
                  <th className="p-4 font-bold">Venda Particular</th>
                  <th className="p-4 font-bold text-primary">Consignação Carro e Cia</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Preço de Venda</td>
                  <td className="p-4 text-muted-foreground">Pode ser subvalorizado</td>
                  <td className="p-4 font-medium text-primary">✅ Otimizado por especialistas</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Tempo de Venda</td>
                  <td className="p-4 text-muted-foreground">Longo e imprevisível</td>
                  <td className="p-4 font-medium text-primary">✅ Mais rápido e eficiente</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Exposição do Veículo</td>
                  <td className="p-4 text-muted-foreground">Limitada a poucos canais</td>
                  <td className="p-4 font-medium text-primary">✅ Ampla em plataformas premium</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Burocracia</td>
                  <td className="p-4 text-muted-foreground">Totalmente sua responsabilidade</td>
                  <td className="p-4 font-medium text-primary">✅ Cuidamos de tudo</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Suporte Financeiro</td>
                  <td className="p-4 text-muted-foreground">Inexistente</td>
                  <td className="p-4 font-medium text-primary">✅ Parcerias para o comprador</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Conheça Quem Vai Cuidar do Seu Veículo
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <picture>
                  <source srcSet={member.img} type="image/webp" />
                  <img
                    src={member.img}
                    alt={`Foto de ${member.name}, ${member.role} da equipe Carro e Cia Veículos`}
                    width="160"
                    height="160"
                    loading="lazy"
                    decoding="async"
                    className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full object-cover mx-auto mb-4 border-[3px] border-primary shadow-md"
                    style={{ objectPosition: member.position }}
                  />
                </picture>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Partners />

      <section className="py-20 bg-muted/30 border-t">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Dúvidas Frequentes sobre Consignação
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-card rounded-xl border p-4 shadow-sm"
          >
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-lg bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold"
              aria-label="Quero Consignar Meu Carro Agora"
            >
              <a
                href={getWhatsAppLink('Olá Luiz! Quero saber mais sobre a consignação.')}
                target="_blank"
                rel="noopener noreferrer"
                data-event="clique_whatsapp"
                onClick={() => {
                  trackConversion('whatsapp')
                  trackGTMEvent('click_whatsapp_consignacao')
                }}
              >
                Quero Consignar Meu Carro Agora
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
