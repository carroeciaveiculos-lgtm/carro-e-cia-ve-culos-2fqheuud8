import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'
import { Clock, Zap, Star } from 'lucide-react'
import { SEO } from '@/components/SEO'

export default function Praticidade() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/30 flex items-center">
      <SEO
        title="Venda seu Carro Rápido | Avaliação Imediata | Carro e Cia"
        description="Venda seu carro rápido na Carro e Cia. Avaliação imediata. Pagamento no ato. Solução ágil para vender seu veículo."
      />
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Venda Rápida
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight">
              Venda seu carro sem dor de cabeça e com avaliação justa.
            </h1>
            <p className="text-xl text-muted-foreground">
              Não perca tempo respondendo curiosos ou atendendo propostas absurdas. Nós fazemos todo
              o trabalho de venda para você no nosso espaço físico premium.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="bg-background p-6 rounded-xl border">
                <Zap className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Venda Acelerada</h3>
                <p className="text-muted-foreground text-sm">
                  Nossa equipe de vendas é treinada para girar o estoque rápido.
                </p>
              </div>
              <div className="bg-background p-6 rounded-xl border">
                <Star className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Espaço Premium</h3>
                <p className="text-muted-foreground text-sm">
                  Seu carro exposto no melhor showroom de Uberaba.
                </p>
              </div>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <ConsignacaoLPForm
              origem="LP2 - Consignação Prática"
              title="Avaliação sem compromisso"
              subtitle="Nossa equipe avaliará seu veículo e apresentará o melhor plano de venda."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
