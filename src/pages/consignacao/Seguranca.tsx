import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'
import { SEO } from '@/components/SEO'

export default function Seguranca() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-background flex items-center">
      <SEO
        title="Venda Segura de Veículos | Documentação Completa | Carro e Cia"
        description="Venda Segura de Veículos - Carro e Cia. Venda seu carro sem risco. Documentação completa e transparência garantida."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Consignação Segura
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight">
              Não corra riscos vendendo seu carro sozinho.
            </h1>
            <p className="text-xl text-muted-foreground">
              Golpes na internet estão cada vez mais comuns. Deixe seu veículo com a Carro e Cia e
              tenha a garantia de um negócio seguro, transparente e sem dor de cabeça.
            </p>
            <div className="space-y-4 pt-4">
              {[
                'Sem visitas de estranhos na sua casa',
                'Contrato de consignação com validade jurídica',
                'Vistoria cautelar e laudo garantido',
                'Pagamento à vista na sua conta na conclusão da venda',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <ConsignacaoLPForm
              origem="LP1 - Consignação Segura"
              title="Proteja seu patrimônio"
              subtitle="Preencha os dados e receba nossa proposta de consignação segura."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
