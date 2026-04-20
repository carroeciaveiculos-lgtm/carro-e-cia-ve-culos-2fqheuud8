import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion } from '@/lib/tracking'
import { Link } from 'react-router-dom'

export default function ComoFuncionaConsignacao() {
  const wppText = 'Olá Luiz! Quero saber mais sobre a consignação.'

  const steps = [
    {
      n: '1',
      emoji: '📱',
      title: 'PRIMEIRO CONTATO',
      desc: 'Entre em contato pelo WhatsApp e descreva seu veículo. Sem compromisso, sem burocracia. O Luiz te responde rapidamente e já te orienta sobre os próximos passos.',
      cta: 'FALAR COM O LUIZ AGORA',
    },
    {
      n: '2',
      emoji: '🔍',
      title: 'AVALIAÇÃO GRATUITA',
      desc: 'Você traz seu veículo até nossa loja e fazemos uma avaliação completa e gratuita. Usamos a tabela FIPE atualizada e as condições reais do mercado de Uberaba para definir o melhor preço para você.',
      cta: 'AGENDAR MINHA AVALIAÇÃO',
    },
    {
      n: '3',
      emoji: '📋',
      title: 'CONTRATO DE PROTEÇÃO',
      desc: 'Antes de qualquer coisa você assina nosso contrato de consignação. Nele ficam registrados o valor mínimo que você aceita, o prazo da consignação, como funciona o pagamento e as responsabilidades de cada parte.',
      cta: 'QUERO SABER SOBRE O CONTRATO',
    },
    {
      n: '4',
      emoji: '📣',
      title: 'ANÚNCIO PROFISSIONAL',
      desc: 'Cuidamos das fotos, da descrição e do anúncio do seu veículo em: iCarros, WebMotors, Mercado Livre, OLX e no nosso Showroom físico.',
      cta: 'QUERO ANUNCIAR MEU CARRO',
    },
    {
      n: '5',
      emoji: '🤝',
      title: 'NEGOCIAÇÃO SEGURA',
      desc: 'Quando aparecer um comprador sério o Luiz te liga antes de qualquer negociação. Você aprova a proposta. Verificamos o comprador, a documentação e garantimos que a venda acontece com total segurança para você.',
      cta: 'VENDER COM SEGURANÇA',
    },
    {
      n: '6',
      emoji: '💰',
      title: 'VOCÊ RECEBE O VALOR',
      desc: 'Venda concluída — você recebe o valor combinado sem surpresas. Cuidamos de toda a transferência e burocracia do DETRAN para que seu nome fique 100% limpo após a venda.',
      cta: 'QUERO VENDER MEU CARRO',
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Como Funciona a Consignação | Carro e Cia Veículos"
        description="Como vendemos seu carro com segurança em 6 etapas. Transparência e proteção total do primeiro contato até o dinheiro na sua conta."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Como vendemos seu carro com segurança em 6 etapas
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Transparência e proteção total do primeiro contato até o dinheiro na sua conta.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto rounded-full font-bold shadow-lg shadow-red-600/20"
          >
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
            >
              QUERO CONSIGNAR MEU CARRO
            </a>
          </Button>
        </div>
      </section>

      <section className="py-20 px-4 overflow-hidden">
        <div className="container max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-red-200 lg:hidden"></div>
            <div className="hidden lg:block absolute top-[44px] left-0 right-0 h-1 bg-red-200"></div>

            <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-6 relative">
              {steps.map((step, i) => (
                <div key={i} className="relative pl-16 lg:pl-0 lg:pt-24 lg:w-1/6">
                  <div className="absolute left-0 top-0 lg:left-1/2 lg:-translate-x-1/2 lg:top-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl z-10 shadow-md">
                    {step.n}
                  </div>

                  <div className="bg-card border-2 border-red-100 hover:border-red-300 rounded-xl p-6 h-full shadow-sm transition-colors relative pb-16">
                    <div className="text-3xl mb-3">{step.emoji}</div>
                    <h3 className="font-bold text-lg mb-3 leading-tight">{step.title}</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      {step.desc}
                    </p>
                    <a
                      href={getWhatsAppLink(wppText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackConversion('whatsapp')}
                      className="text-red-600 font-bold text-sm hover:underline absolute bottom-6 left-6 right-6"
                    >
                      {step.cta} &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-t text-center">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Seu carro vendido.
            <br />
            Você protegido.
            <br />
            Luiz cuida de tudo.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto rounded-full font-bold shadow-lg"
            >
              <a
                href={getWhatsAppLink(wppText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion('whatsapp')}
              >
                QUERO CONSIGNAR MEU CARRO AGORA
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 h-auto w-full sm:w-auto rounded-full font-bold"
            >
              <Link to="/estoque">VER VEÍCULOS</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
