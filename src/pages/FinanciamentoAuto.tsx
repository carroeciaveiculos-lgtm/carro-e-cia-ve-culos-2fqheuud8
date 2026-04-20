import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion } from '@/lib/tracking'

export default function FinanciamentoAuto() {
  const wppText = 'Olá! Quero simular um financiamento de veículo.'

  const passos = [
    {
      n: '1',
      title: 'SIMULAÇÃO GRATUITA',
      desc: 'Faça uma simulação sem compromisso pelo WhatsApp.',
    },
    {
      n: '2',
      title: 'ANÁLISE DE CRÉDITO',
      desc: 'Nossa equipe busca as melhores taxas para seu perfil.',
    },
    { n: '3', title: 'APROVAÇÃO RÁPIDA', desc: 'Processo ágil e sem burocracia desnecessária.' },
    { n: '4', title: 'CHAVE NA MÃO', desc: 'Assinatura do contrato e veículo liberado para você.' },
  ]

  const parceiros = [
    'Banco Safra',
    'Bradesco Financiamentos',
    'C6 Financeira',
    'Santander Financiamentos',
    'BV Financeira',
    'Porto Bank',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Financiamento Auto | Carro e Cia Veículos"
        description="Financie seu carro com as melhores condições de Uberaba. Parceiros financeiros selecionados para você conquistar seu veículo com as menores taxas."
      />

      <section className="bg-red-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Financie seu carro com as melhores condições de Uberaba
          </h1>
          <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto">
            Parceiros financeiros selecionados para você conquistar seu veículo com as menores
            taxas.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-black hover:bg-gray-900 text-white w-full sm:w-auto rounded-full font-bold"
          >
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
            >
              QUERO FINANCIAR MEU CARRO
            </a>
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {passos.map((p) => (
              <div
                key={p.n}
                className="bg-card border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {p.n}
                </div>
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-t">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Nossos Parceiros Financeiros</h2>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {parceiros.map((parceiro) => (
              <div
                key={parceiro}
                className="bg-white border rounded-xl px-6 py-4 shadow-sm font-bold text-gray-700 min-w-[200px]"
              >
                {parceiro}
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-full font-bold"
            >
              <a
                href={getWhatsAppLink(wppText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion('whatsapp')}
              >
                SIMULAR MEU FINANCIAMENTO
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
