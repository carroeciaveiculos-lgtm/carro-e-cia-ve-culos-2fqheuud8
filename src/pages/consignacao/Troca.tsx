import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'
import { RefreshCcw, CarFront, TrendingUp } from 'lucide-react'
import { SEO } from '@/components/SEO'

export default function Troca() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-background flex items-center">
      <SEO
        title="Troca com Troco de Carros | Desconto Garantido | Carro e Cia"
        description="Troca com Troco na Carro e Cia. Troque seu carro antigo por um novo com desconto. Solução rápida e segura em Uberaba."
      />
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center flex-col-reverse">
          <div className="animate-fade-in-up lg:order-1 order-2">
            <ConsignacaoLPForm
              origem="LP3 - Troca com Troco"
              title="Simule sua troca"
              subtitle="Informe os dados do seu veículo atual para começarmos."
            />
          </div>
          <div
            className="space-y-8 animate-fade-in-up lg:order-2 order-1"
            style={{ animationDelay: '150ms' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider">
              <RefreshCcw className="w-4 h-4" /> Troca Inteligente
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight">
              Deixe seu carro consignado e já saia de carro novo.
            </h1>
            <p className="text-xl text-muted-foreground">
              O ciclo completo perfeito: nós vendemos o seu carro pelo melhor preço enquanto você já
              aproveita seu novo veículo do nosso estoque.
            </p>
            <div className="space-y-6 pt-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CarFront className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Escolha seu novo carro</h3>
                  <p className="text-muted-foreground">Amplo estoque revisado e com garantia.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Melhor avaliação do mercado</h3>
                  <p className="text-muted-foreground">
                    Seu usado entra como parte do pagamento com valorização real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
