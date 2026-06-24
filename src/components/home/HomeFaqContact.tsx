import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TestimonialsAndLocation } from './TestimonialsAndLocation'

export function HomeFaqContact() {
  return (
    <>
      <TestimonialsAndLocation />
      <section className="py-20 bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-10">
            Dúvidas Frequentes
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-background rounded-xl p-2 md:p-6 shadow-sm border"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold text-base md:text-lg">
                Como funciona a consignação?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Seu carro fica em nossa loja sob contrato, fazemos anúncios profissionais em
                diversas plataformas e recebemos as propostas. Repassamos o valor combinado a você
                no ato da venda.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold text-base md:text-lg">
                A avaliação é gratuita?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Sim, avaliamos seu veículo presencialmente ou por fotos sem nenhum custo ou
                compromisso para você.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold text-base md:text-lg">
                Trabalham com financiamento?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Sim, temos parceria com os principais bancos (Bradesco, BV, Santander, Safra, Porto
                Bank) para garantir a melhor taxa para o comprador do seu veículo, facilitando a
                venda.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold text-base md:text-lg">
                Vocês pegam carro na troca?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Sim, aceitamos veículos na troca perante avaliação cautelar, o que aumenta as
                chances e a velocidade da venda do seu carro.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </>
  )
}
