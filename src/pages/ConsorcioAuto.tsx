import { TrendingUp, PiggyBank, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConsorcioAuto() {
  const wppText = encodeURIComponent(
    'Olá Adriana! Quero entender como funciona o Consórcio Auto pela Km Zero Corretora.',
  )

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background">
      <div className="bg-[#1B5E20] text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-bold uppercase tracking-wider mb-6">
            <PiggyBank className="w-4 h-4" /> Planejamento Inteligente
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-extrabold mb-6 leading-tight">
            Seu próximo carro sem pagar juros.
          </h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            O Consórcio é a forma mais inteligente e barata de planejar a troca do seu veículo.
            Parceria exclusiva Carro e Cia & Km Zero Corretora.
          </p>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto py-16 px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center flex-col-reverse">
          <div className="bg-card p-8 rounded-2xl shadow-xl border text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-background shadow-md">
              <img
                src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2"
                alt="Adriana - Km Zero Corretora"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-display font-bold text-2xl mb-2">Adriana - Km Zero</h3>
            <p className="text-muted-foreground mb-6">
              Tire todas as suas dúvidas sobre lances, contemplação e taxas com nossa especialista.
            </p>

            <Button
              asChild
              className="w-full h-14 text-lg font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white"
            >
              <a
                href={`https://wa.me/5534999484285?text=${wppText}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Simular Consórcio
              </a>
            </Button>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold">
              Por que o consórcio é a escolha certa?
            </h2>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Zero Juros</h3>
                <p className="text-muted-foreground">
                  Diferente do financiamento, no consórcio você paga apenas uma pequena taxa de
                  administração. Economia real para o seu bolso.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Poder de Compra à Vista</h3>
                <p className="text-muted-foreground">
                  Ao ser contemplado, você tem a carta de crédito na mão, garantindo alto poder de
                  negociação na Carro e Cia.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <PiggyBank className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Flexibilidade e Planejamento</h3>
                <p className="text-muted-foreground">
                  Parcelas que cabem no seu orçamento. Ideal para quem não tem pressa e quer trocar
                  de carro no médio prazo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
