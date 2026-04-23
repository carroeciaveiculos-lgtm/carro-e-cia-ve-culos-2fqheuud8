import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, MessageCircle } from 'lucide-react'
import { getWhatsAppLink } from '@/lib/whatsapp'

const faqs = [
  {
    question: 'Quanto custa para deixar o carro em consignação?',
    answer:
      'A avaliação e o espaço na loja são totalmente gratuitos. Nós cobramos apenas uma comissão previamente acordada sobre o valor da venda, apenas quando o negócio for concretizado.',
  },
  {
    question: 'Meu carro fica seguro durante a consignação?',
    answer:
      'Sim, 100% seguro! Nossa loja possui seguro completo e monitoramento 24h. Nós firmamos um contrato de consignação garantindo toda a responsabilidade pelo seu veículo enquanto estiver sob nossos cuidados.',
  },
  {
    question: 'Quanto tempo demora para vender?',
    answer:
      'O prazo médio de venda é de 15 a 30 dias. Com nossa forte presença digital, parcerias de financiamento e ampla carteira de clientes, conseguimos fechar negócios de forma muito mais rápida que vendas particulares.',
  },
  {
    question: 'Vocês compram o carro à vista?',
    answer:
      'Sim, se você tem urgência em vender e não pode esperar pelo processo de consignação, também avaliamos o seu veículo para compra imediata, pagando um valor justo de repasse.',
  },
]

export function HomeFaqContact() {
  return (
    <section className="py-20 bg-secondary/30" id="contato">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ */}
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-display font-bold mb-6">
              Dúvidas <span className="text-primary">Frequentes</span>
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Info */}
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Card className="bg-card border-border shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-display font-bold mb-6">Fale Conosco</h3>
                <p className="text-muted-foreground mb-8">
                  Pronto para vender seu carro de forma segura? Entre em contato agora mesmo ou
                  faça-nos uma visita.
                </p>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Nosso Endereço</h4>
                      <p className="text-muted-foreground">
                        Av. Guilherme Ferreira, 1119
                        <br />
                        São Benedito, Uberaba - MG
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Telefones (WhatsApp)</h4>
                      <div className="flex flex-col gap-1">
                        <a
                          href="https://wa.me/5534999484285"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          Luiz (Vendas): (34) 99948-4285
                        </a>
                        <a
                          href="https://wa.me/5534992000300"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          Gabriel (Seguros): (34) 99200-0300
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-lg h-14"
                >
                  <a
                    href={getWhatsAppLink(
                      'Olá Luiz, vi o site de vocês e gostaria de avaliar meu carro para consignação.',
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" /> Falar no WhatsApp Agora
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
