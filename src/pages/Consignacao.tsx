import { Handshake, PiggyBank, SearchCheck, Timer } from 'lucide-react'
import { LeadForm } from '@/components/LeadForm'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const Consignacao = () => {
  return (
    <div className="pt-24 pb-20">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mb-6">
            Venda seu carro conosco
          </h1>
          <p className="text-xl text-muted-foreground">
            A forma mais inteligente, segura e rentável de vender o seu veículo em Uberaba. Você
            define o preço, nós fazemos a venda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          <div className="bg-card p-6 rounded-xl border text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Melhor Valor</h3>
            <p className="text-muted-foreground text-sm">
              Venda pelo preço de mercado, sem desvalorização de repasse.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl border text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Timer className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Venda Rápida</h3>
            <p className="text-muted-foreground text-sm">
              Nosso giro é alto. Seu carro estará nos principais portais do país.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl border text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Zero Burocracia</h3>
            <p className="text-muted-foreground text-sm">
              Cuidamos de toda a documentação, financiamento e transferência.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl border text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Garantia e Segurança</h3>
            <p className="text-muted-foreground text-sm">
              Contrato formal e pagamento garantido direto na sua conta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display font-bold text-3xl mb-8">Dúvidas Frequentes</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-semibold">
                  Quanto tempo demora para vender?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  A média de venda do nosso estoque é de 15 a 30 dias, graças ao nosso forte
                  investimento em marketing digital e base de clientes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-semibold">
                  Qual o valor da comissão?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Trabalhamos com uma taxa fixa ou percentual que é acordada de forma transparente
                  no momento da avaliação, garantindo que você receba o valor líquido desejado.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-semibold">
                  O carro fica na loja ou comigo?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Temos as duas opções! O veículo pode ficar no nosso pátio seguro (Consignação
                  Física) ou com você (Consignação Virtual), agendando as visitas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-semibold">
                  E se precisar de reparos?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Nós avaliamos o veículo e sugerimos reparos estéticos apenas se forem agregar
                  valor à venda. Temos parceiros com preços especiais caso precise.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="bg-muted/30 p-1 rounded-2xl">
            <LeadForm
              title="Agendar Avaliação"
              subtitle="Envie os dados e entraremos em contato rapidamente."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Consignacao
