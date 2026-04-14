import { ShieldCheck, Car, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SeguroAuto() {
  const wppText = encodeURIComponent(
    'Olá Adriana! Tenho interesse em cotar um Seguro Auto pela Km Zero Corretora.',
  )

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background">
      <div className="bg-[#0D47A1] text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" /> Parceria Exclusiva
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-extrabold mb-6 leading-tight">
            Saia de carro novo já protegido.
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Não corra riscos. Em parceria com a Km Zero Corretora, oferecemos as melhores taxas do
            mercado para você proteger seu patrimônio.
          </p>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto py-16 px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold">Por que fazer seu seguro conosco?</h2>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <HeartHandshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Atendimento Humanizado</h3>
                <p className="text-muted-foreground">
                  Com a Adriana da Km Zero, você não fala com robôs. Atendimento direto, empático e
                  focado na sua necessidade real.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Cobertura Completa</h3>
                <p className="text-muted-foreground">
                  Proteção contra roubo, furto, colisão e danos a terceiros com as maiores
                  seguradoras do país.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Cotação Rápida</h3>
                <p className="text-muted-foreground">
                  Comprando na Carro e Cia, sua cotação sai na hora com condições exclusivas de
                  parceria.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-xl border text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-background shadow-md">
              <img
                src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2"
                alt="Adriana - Km Zero Corretora"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-display font-bold text-2xl mb-2">Km Zero Corretora</h3>
            <p className="text-muted-foreground mb-6">
              Fale agora com a Adriana e garanta a proteção que seu veículo merece.
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
                Cotar Seguro Agora
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
