import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion, trackCTAClick } from '@/lib/tracking'

export default function FinanciamentoAuto() {
  const wppText = 'Olá! Quero simular um financiamento de veículo.'

  const passos = [
    {
      n: '1',
      title: 'ANÁLISE DE CRÉDITO',
      desc: 'Avaliamos seu perfil em minutos de forma segura.',
    },
    {
      n: '2',
      title: 'APROVAÇÃO RÁPIDA',
      desc: 'Resposta rápida (até 24 horas) para sua análise.',
    },
    { n: '3', title: 'DOCUMENTAÇÃO', desc: 'Preparamos toda a documentação necessária.' },
    { n: '4', title: 'CHAVE NA MÃO', desc: 'Você recebe as chaves do seu carro novo.' },
  ]

  const parceiros = [
    'Banco Safra',
    'Bradesco',
    'C6 Financeira',
    'Santander',
    'BV Financeira',
    'Caixa Econômica',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Financiamento de Carros em Uberaba | Até 60x"
        description="Financiamento flexível de carros em Uberaba. Parcelamento até 60 meses com as melhores taxas. Consulte agora na Carro e Cia."
      />

      <section className="bg-red-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto mt-10">
          <div className="inline-block bg-black text-white px-4 py-2 rounded-full font-bold text-sm mb-6 uppercase">
            Parcelamento Flexível em até 60 meses
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Financiamento de Carros em Uberaba — Até 60x
          </h1>
          <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto">
            O financiamento de carros é a forma mais acessível de adquirir um veículo novo ou
            seminovo. Na Carro e Cia Veículos, oferecemos soluções financeiras personalizadas para
            cada cliente.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-black hover:bg-gray-900 text-white w-full sm:w-auto rounded-full font-bold btn-cta"
          >
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackConversion('whatsapp')
                trackCTAClick('Quero Financiar Meu Carro', window.location.pathname)
              }}
            >
              QUERO FINANCIAR MEU CARRO
            </a>
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto prose prose-lg dark:prose-invert">
          <h2 className="text-center mb-8">Por Que Financiar um Carro?</h2>
          <p className="text-center mb-12">
            Financiar um carro permite que você adquira um veículo sem desembolsar todo o valor à
            vista. É a forma mais inteligente de se mover sem comprometer seu orçamento.
          </p>

          <div className="bg-muted/30 border rounded-2xl p-8 my-8 shadow-sm not-prose">
            <h3 className="text-2xl font-bold mb-6">Benefícios do Financiamento:</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Parcelamento flexível em
                até 60 meses
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Taxas competitivas e
                parceiros de confiança
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Análise rápida e aprovação
                em até 24 horas
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Sem necessidade de entrada
                alta
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Flexibilidade para
                escolher o veículo dos sonhos
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-y">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Processo de Aprovação Rápido</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {passos.map((p) => (
              <div
                key={p.n}
                className="bg-background border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
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

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="prose prose-lg dark:prose-invert">
              <h2>Simulador de Financiamento</h2>
              <p>
                Quer saber quanto vai pagar por mês? Consulte nossos especialistas para uma
                simulação sem compromisso e encontre a parcela que cabe no seu bolso.
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-xl border border-red-100 dark:border-red-900 mt-6">
                <h3 className="text-red-800 dark:text-red-200 mt-0">Exemplo prático:</h3>
                <ul className="text-sm">
                  <li>
                    <strong>Carro:</strong> R$ 50.000
                  </li>
                  <li>
                    <strong>Entrada:</strong> R$ 10.000
                  </li>
                  <li>
                    <strong>Valor Financiado:</strong> R$ 40.000
                  </li>
                  <li>
                    <strong>Parcelamento Médio:</strong> 60x de R$ 800*
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  * Valores aproximados sujeitos a análise de crédito.
                </p>
              </div>
            </div>

            <div className="prose prose-lg dark:prose-invert">
              <h2>Documentação Necessária</h2>
              <p>Para solicitar o financiamento, separe os seguintes documentos básicos:</p>
              <ul>
                <li>RG e CPF (ou CNH)</li>
                <li>Comprovante de Renda atualizado</li>
                <li>Comprovante de Residência</li>
                <li>Referências bancárias (se necessário)</li>
              </ul>

              <h3 className="mt-8">Dúvidas Frequentes</h3>
              <p>
                <strong>Preciso de entrada?</strong> Não é obrigatório, mas uma entrada reduz muito
                o valor das suas parcelas e facilita a aprovação.
              </p>
            </div>
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
                className="bg-background border rounded-xl px-6 py-4 shadow-sm font-bold text-gray-700 dark:text-gray-300 min-w-[180px]"
              >
                {parceiro}
              </div>
            ))}
          </div>

          <div className="mt-16 bg-red-600 text-white rounded-3xl p-10 max-w-3xl mx-auto shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Pronto para Conquistar Seu Carro?</h2>
            <p className="mb-8 text-red-100 text-lg">
              Faça sua simulação gratuita agora mesmo e descubra as melhores condições.
            </p>
            <Button
              asChild
              size="lg"
              className="text-lg px-10 py-6 h-auto bg-white hover:bg-gray-100 text-red-600 w-full sm:w-auto rounded-full font-bold btn-cta"
            >
              <a
                href={getWhatsAppLink(wppText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion('whatsapp')}
              >
                SIMULAR MEU FINANCIAMENTO AGORA
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
