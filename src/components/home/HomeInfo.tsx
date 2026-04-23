import { CheckCircle2 } from 'lucide-react'

export function HomeInfo() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Por que escolher a <span className="text-primary">Carro e Cia?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Com mais de 20 anos de tradição em Uberaba, somos especialistas em tornar a venda do
              seu veículo uma experiência segura, rápida e rentável.
            </p>
            <ul className="space-y-4">
              {[
                'Mais de 2 décadas de credibilidade e confiança',
                'Contrato de consignação com validade jurídica',
                'Avaliação justa baseada no valor real de mercado',
                'Ampla divulgação em múltiplos canais de venda',
                'Você não se preocupa com burocracia ou curiosos',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
                alt="Nossa Loja Carro e Cia"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-xl border border-border/50">
              <p className="text-4xl font-black text-primary mb-1">20+</p>
              <p className="text-sm text-muted-foreground font-medium">
                Anos de
                <br />
                Experiência
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
