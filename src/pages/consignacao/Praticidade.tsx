import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'
import { CheckCircle2, XCircle } from 'lucide-react'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion } from '@/lib/tracking'

export default function Praticidade() {
  const wppText = 'Olá Luiz! Preciso vender meu carro rápido. Pode me ajudar?'

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Venda Rápida de Veículos | Carro e Cia"
        description="Seu carro está parado há semanas? A Carro e Cia vende seu veículo em até 30 dias ou menos."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Seu carro está parado há semanas? Cada dia que passa você está perdendo dinheiro.
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Depreciação, IPVA, seguro, parcela... O carro parado custa caro. A Carro e Cia vende seu
            veículo em até 30 dias ou menos.
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
              QUERO VENDER MEU CARRO RÁPIDO
            </a>
          </Button>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center border-t border-white/10 pt-8">
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">21 dias</div>
              <div className="text-sm text-gray-400">média para vender</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">+5</div>
              <div className="text-sm text-gray-400">plataformas anunciando</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">Todos os dias</div>
              <div className="text-sm text-gray-400">compradores ativos</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            O carro parado está te custando mais do que você imagina
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {[
              'Cada mês = mais depreciação',
              'IPVA e seguro continuam chegando',
              'Parcela do financiamento não para',
              'Anúncio no OLX sem resultado',
              'Curiosos que só perdem seu tempo',
              'Preço caindo a cada semana',
            ].map((dor, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/30 p-4 rounded-xl border">
                <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                <span className="font-medium">{dor}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-y">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Por que vendemos mais rápido</h2>
          <div className="grid md:grid-cols-5 gap-6 text-center">
            {[
              'ANÚNCIO PROFISSIONAL',
              'BASE DE COMPRADORES ATIVA',
              'SHOWROOM ESTRATÉGICO',
              'NEGOCIAÇÃO PROFISSIONAL',
              'PREÇO JUSTO NA FIPE',
            ].map((passo, i) => (
              <div
                key={i}
                className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-sm">{passo}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-black text-white">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">O que dizem nossos clientes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "4 meses tentando vender minha Hilux. Com o Luiz saiu em 18 dias."
              </p>
              <div className="font-bold text-red-400">— Anderson Rodrigues, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "Precisava do dinheiro rápido. O Luiz vendeu em 2 semanas."
              </p>
              <div className="font-bold text-red-400">— Fernanda Costa, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">"23 dias e o dinheiro na minha conta."</p>
              <div className="font-bold text-red-400">— Ricardo Almeida, Uberaba</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Cada dia que você espera é dinheiro que escapa.
          </h2>
          <div className="mt-10">
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
                QUERO VENDER RÁPIDO AGORA
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
