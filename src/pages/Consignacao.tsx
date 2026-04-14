import { Consignment } from '@/components/home/Consignment'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function Consignacao() {
  const faqs = [
    {
      q: 'Quanto tempo leva para vender?',
      a: 'O tempo médio de venda varia, mas nossa ampla divulgação e base de clientes aceleram o processo. Muitos veículos são vendidos em menos de 45 dias.',
    },
    {
      q: 'Qual é a comissão da loja?',
      a: 'Nossa comissão é transparente e acordada em contrato, geralmente uma porcentagem sobre o valor da venda. Entre em contato para detalhes.',
    },
    {
      q: 'Meu carro fica na loja?',
      a: 'Sim, seu veículo fica em nosso pátio seguro e bem localizado, exposto a centenas de potenciais compradores diariamente.',
    },
    {
      q: 'E se eu precisar do carro durante o período de consignação?',
      a: 'Nosso contrato é flexível. Caso precise do veículo, basta nos avisar e combinamos a retirada.',
    },
    {
      q: 'O processo é seguro?',
      a: 'Absolutamente. Todo o processo é amparado por contrato, com total transparência e segurança jurídica para ambas as partes.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <section className="relative bg-secondary text-secondary-foreground pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://img.usecurling.com/p/1200/800?q=car%20showroom')] bg-cover bg-center" />
        <div className="container relative z-10 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-6 leading-tight text-white">
            Venda Seu Carro Sem Preocupações.{' '}
            <span className="text-primary">Deixe a Carro e Cia Cuidar de Tudo.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Mais de 20 anos de experiência em Uberaba, garantindo a venda do seu veículo com
            segurança, transparência e agilidade.
          </p>
        </div>
      </section>

      <div className="-mt-16 relative z-20">
        <Consignment />
      </div>

      <section className="py-20 bg-muted/30 border-t">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-10 text-center">
            Perguntas Frequentes sobre Consignação
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
        </div>
      </section>
    </div>
  )
}
