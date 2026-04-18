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

const team = [
  {
    name: 'Luiz Fernando',
    role: 'CEO',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Luiz%20Fernando%20foto%20profissional.jpeg',
  },
  {
    name: 'Roberto Junior',
    role: 'Vendedor',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Roberto%20Junior%20foto%20profissional.jpeg',
  },
  {
    name: 'Jessica Germano',
    role: 'Financeiro',
    img: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Ljessica%20foto%20profissional.jpeg',
  },
]

export default function VenderMeuCarro() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Carro e Cia Veículos',
    url: 'https://carroeciaveiculos.goskip.app',
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
      q: 'Como a avaliação é feita?',
      a: 'Usamos tabelas de mercado atualizadas (FIPE, Webmotors) e analisamos o estado real do seu veículo para garantir a melhor proposta.',
    },
    {
      q: 'Eu preciso pagar alguma taxa antecipada?',
      a: 'Não. A avaliação é 100% gratuita e sem compromisso.',
    },
    {
      q: 'O pagamento é seguro?',
      a: 'Sim. Todo o trâmite financeiro e documental é feito com segurança, transparência e respaldo jurídico.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Quero Vender Meu Carro em Uberaba | Carro e Cia Veículos"
        description="Quer vender seu carro rápido e pelo melhor preço em Uberaba? Consigne com a Carro e Cia. Cuidamos de tudo: fotos, anúncios e negociação. Avaliação grátis!"
        schema={schema}
      />

      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
            alt="Fachada Carro e Cia Veículos Uberaba MG"
            width="1920"
            height="1080"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Quer Vender Seu Carro Rápido e Pelo Melhor Preço?
            </h1>
            <p className="text-xl text-gray-200">
              A Carro e Cia cuida de tudo pra você. Avaliação gratuita, sem compromisso.
            </p>
          </div>
          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <LeadForm
              tipo="venda"
              buttonText="Quero Vender Meu Carro Agora"
              whatsappText="Olá Luiz, quero vender meu carro!"
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Por Que Vender Seu Carro Sozinho Pode Sair Caro?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Milhares de pessoas em Uberaba tentam vender seu carro colocando no vidro um papel
            escrito "VENDE-SE". Ficam semanas esperando. Recebem ligações de curiosos. Arriscam
            encontros com desconhecidos. E ainda correm o risco de cair em golpes — cheques sem
            fundo, financiamentos fraudulentos, documentos falsificados. Você merece mais do que
            isso. Na Carro e Cia, você entrega seu carro e vai embora tranquilo. A gente cuida do
            resto.
          </p>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como Funciona a Consignação de Veículos?
          </h2>
          <div className="grid md:grid-cols-5 gap-6 text-center">
            {[
              {
                step: '1',
                t: 'Contato e Avaliação',
                d: 'Você nos contata e trazemos o veículo para avaliação gratuita.',
              },
              { step: '2', t: 'Preço Justo', d: 'Definimos juntos o melhor preço de venda.' },
              {
                step: '3',
                t: 'Contrato Seguro',
                d: 'Assinamos um contrato seguro que protege você e seu veículo.',
              },
              {
                step: '4',
                t: 'Divulgação Max',
                d: 'Anunciamos nas maiores plataformas: iCarros, WebMotors, Mercado Livre.',
              },
              { step: '5', t: 'Venda Concluída', d: 'Vendemos, você recebe. Simples assim!' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.t}</h3>
                <p className="text-sm text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Particular x Consignação: A Comparação que Ninguém Mostra
          </h2>
          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse bg-card">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-4 font-bold">Item</th>
                  <th className="p-4 font-bold">Venda Particular</th>
                  <th className="p-4 font-bold text-primary">Consignação Carro e Cia</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Segurança na negociação</td>
                  <td className="p-4 text-muted-foreground">❌ Você por conta</td>
                  <td className="p-4 font-medium text-primary">✅ Garantida por contrato</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Anúncios profissionais</td>
                  <td className="p-4 text-muted-foreground">❌ Fotos do celular</td>
                  <td className="p-4 font-medium text-primary">✅ Fotos profissionais</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Alcance de compradores</td>
                  <td className="p-4 text-muted-foreground">❌ Limitado</td>
                  <td className="p-4 font-medium text-primary">✅ iCarros, WebMotors, ML</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Risco de golpes</td>
                  <td className="p-4 text-muted-foreground">❌ Alto</td>
                  <td className="p-4 font-medium text-primary">✅ Zero</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Tempo dedicado</td>
                  <td className="p-4 text-muted-foreground">❌ Horas do seu dia</td>
                  <td className="p-4 font-medium text-primary">✅ Nenhum</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Negociação</td>
                  <td className="p-4 text-muted-foreground">❌ Você sozinho</td>
                  <td className="p-4 font-medium text-primary">✅ Especialistas de 20 anos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nossa Equipe Cuida do Seu Carro Como Se Fosse Nosso
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <div key={i} className="text-center">
                <img
                  src={member.img}
                  alt={`${member.name} - Carro e Cia Veículos`}
                  width="400"
                  height="400"
                  loading="lazy"
                  decoding="async"
                  className="w-48 h-48 rounded-full object-cover mx-auto mb-4 border-4 border-background shadow-md"
                />
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
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Perguntas Frequentes</h2>
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
              aria-label="Quero Avaliar Meu Carro Grátis"
            >
              <a
                href={getWhatsAppLink('Olá Luiz, quero avaliar meu carro grátis!')}
                target="_blank"
                rel="noopener noreferrer"
                data-event="clique_whatsapp"
              >
                Quero Avaliar Meu Carro Grátis
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
