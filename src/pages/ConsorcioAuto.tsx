import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion } from '@/lib/tracking'

export default function ConsorcioAuto() {
  const wppText = 'Olá Adriana! Quero simular um consórcio de veículo.'

  const parceiros = ['Porto Consórcios', 'Ademicon']

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Consórcio Auto em Uberaba | Carro e Cia Veículos"
        description="A forma mais inteligente de conquistar seu próximo veículo. Sem juros, sem entrada, com assessoria da consultora Adriana Araújo."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Consórcio Auto em Uberaba — Compre seu carro sem juros
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A forma mais inteligente de conquistar seu próximo veículo. Sem juros, sem entrada, com
            assessoria especializada da consultora Adriana Araújo.
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
              QUERO SIMULAR UM CONSÓRCIO
            </a>
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-6">Adriana Araújo</h2>
            <p className="text-lg text-red-600 font-bold mb-4">
              Consultora de Consórcios
              <br />
              Especialista em Planejamento Financeiro Automotivo
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Mais de 20 anos ajudando pessoas a conquistarem seus objetivos com inteligência
              financeira.
            </p>
            <p className="font-bold text-lg">Km Zero Corretora de Seguros e Consórcios</p>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <img
              src="https://img.usecurling.com/ppl/large?gender=female&seed=12"
              alt="Adriana Araújo"
              className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-full border-8 border-red-100 shadow-xl"
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-y">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Consórcio vs Financiamento</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-green-600 flex items-center gap-2">
                <span className="text-3xl">✅</span> CONSÓRCIO
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span> Sem juros
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span> Sem entrada obrigatória
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span> Parcelas menores
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span> Carta de crédito com poder de
                  compra
                </li>
              </ul>
            </div>

            <div className="bg-card border rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
                <span className="text-3xl">❌</span> FINANCIAMENTO
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="text-red-500 font-bold">✕</span> Juros altos (até 2,5% ao mês)
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-500 font-bold">✕</span> Entrada obrigatória
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-500 font-bold">✕</span> Parcelas maiores
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-500 font-bold">✕</span> Paga muito mais que o valor do
                  carro
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="bg-muted/30 border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold">SIMULAÇÃO GRATUITA</h3>
            </div>
            <div className="bg-muted/30 border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold">ESCOLHA DO PLANO</h3>
            </div>
            <div className="bg-muted/30 border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold">ADESÃO AO GRUPO</h3>
            </div>
            <div className="bg-muted/30 border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-bold">CONTEMPLAÇÃO</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center bg-black text-white">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Parceiros</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {parceiros.map((p) => (
              <div
                key={p}
                className="bg-white/10 border border-white/20 px-6 py-3 rounded-full font-medium"
              >
                {p}
              </div>
            ))}
          </div>

          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-full font-bold shadow-lg"
          >
            <a
              href={getWhatsAppLink(wppText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
            >
              SIMULAR MEU CONSÓRCIO AGORA
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
