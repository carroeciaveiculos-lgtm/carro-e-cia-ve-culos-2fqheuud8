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

      <section className="py-20 px-4 overflow-hidden bg-muted/10">
        <div className="container max-w-6xl mx-auto relative">
          <div className="absolute left-[37px] lg:left-0 lg:right-0 top-8 bottom-8 lg:top-[17px] lg:bottom-auto w-[2px] lg:w-full lg:h-[2px] border-l-2 lg:border-l-0 lg:border-t-2 border-dashed border-[#E53935] z-0 opacity-50" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-16 gap-x-8 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="relative pt-2 lg:pt-12 flex flex-col h-full">
                <div className="absolute left-[20px] top-0 lg:left-1/2 lg:-translate-x-1/2 lg:-top-4 w-[36px] h-[36px] bg-[#E53935] text-white rounded-full flex items-center justify-center font-bold text-[18px] z-10 shadow-md ring-4 ring-background">
                  {step.n}
                </div>

                <div className="bg-[#FFFFFF] border-2 border-[#E53935] rounded-[16px] p-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col flex-grow ml-16 lg:ml-0">
                  <div className="text-3xl mb-4">{step.emoji}</div>
                  <h3 className="font-bold text-[16px] uppercase text-[#333333] mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#333333] mb-6 leading-[1.6] flex-grow">
                    {step.desc}
                  </p>
                  <Button
                    asChild
                    className="w-full bg-[#E53935] hover:bg-red-700 text-white font-bold text-[14px] rounded-[8px] py-[10px] px-[20px] h-auto mt-auto"
                  >
                    <a
                      href={getWhatsAppLink(wppText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackConversion('whatsapp')}
                    >
                      {step.cta}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
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
