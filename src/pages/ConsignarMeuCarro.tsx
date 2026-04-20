import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion, trackGTMEvent } from '@/lib/tracking'
import { CheckCircle2, XCircle } from 'lucide-react'
import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'

export default function ConsignarMeuCarro() {
  const wppText = 'Olá Luiz! Quero saber mais sobre a consignação.'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Consignar Meu Carro | Carro e Cia Veículos"
        description="Quer vender seu carro em Uberaba sem dor de cabeça? A gente vende por você com segurança e zero burocracia."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Quer vender seu carro em Uberaba sem dor de cabeça? A gente vende por você.
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Consigne seu veículo com a Carro e Cia e receba o valor certo, no prazo certo, com
            segurança e zero burocracia.
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
              onClick={() => {
                trackConversion('whatsapp')
                trackGTMEvent('click_whatsapp_consignacao')
              }}
            >
              QUERO CONSIGNAR MEU CARRO AGORA
            </a>
          </Button>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center border-t border-white/10 pt-8">
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">+20 anos</div>
              <div className="text-sm text-gray-400">de mercado em Uberaba</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">+500</div>
              <div className="text-sm text-gray-400">veículos vendidos por ano</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">100%</div>
              <div className="text-sm text-gray-400">de segurança na negociação</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Você já passou por isso?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Anunciou o carro há semanas e nada',
              'Respondeu 100 mensagens e 0 vendas',
              'Teve medo de dar test drive p/ estranho',
              'Não sabe se o preço que pediu é justo',
              'Fica sem o carro e ainda paga parcela',
              'Medo de cair em golpe ou cheque sem fundo',
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
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona — 4 Passos Simples</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">CONTATO</h3>
              <p className="text-muted-foreground text-sm">
                Você fala com o Luiz pelo WhatsApp e descreve seu veículo
              </p>
            </div>
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">AVALIAÇÃO</h3>
              <p className="text-muted-foreground text-sm">
                Você traz o carro até nossa loja e fazemos uma avaliação gratuita
              </p>
            </div>
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">CONSIGNAÇÃO</h3>
              <p className="text-muted-foreground text-sm">
                Assinamos o contrato, anunciamos e cuidamos de tudo por você
              </p>
            </div>
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-bold text-lg mb-2">VENDA</h3>
              <p className="text-muted-foreground text-sm">
                Seu carro é vendido, você recebe o valor combinado
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Por que a Carro e Cia?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Mais de 20 anos em Uberaba',
              'Loja física em avenida estratégica',
              'Anúncio em iCarros, WebMotors e Mercado Livre',
              'Contrato de consignação protegendo você',
              'Luiz Fernando cuida pessoalmente de cada negociação',
              'Compradores ativos todo dia na loja',
            ].map((motivo, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <span className="font-medium">{motivo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-black text-white px-4">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">O que dizem nossos clientes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "Tentei vender sozinho por 3 meses. Em 2 semanas com o Luiz o carro saiu."
              </p>
              <div className="font-bold text-red-400">— João Paulo, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "Processo simples, transparente e recebi o valor que queria."
              </p>
              <div className="font-bold text-red-400">— Márcia Oliveira, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "Nunca mais vendo carro sozinho. O Luiz resolveu tudo por mim."
              </p>
              <div className="font-bold text-red-400">— Carlos Eduardo, Uberaba</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4">Seu carro vendido. Você tranquilo.</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Preencha o formulário ou fale conosco pelo WhatsApp para iniciar.
            </p>
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-[#25D366] hover:bg-[#20bd5a] text-white w-full rounded-full font-bold"
            >
              <a
                href={getWhatsAppLink(wppText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackConversion('whatsapp')
                  trackGTMEvent('click_whatsapp_consignacao')
                }}
              >
                AVALIAR MEU CARRO GRATUITAMENTE
              </a>
            </Button>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-2xl shadow-xl border">
            <ConsignacaoLPForm
              origem="LP - Consignar Meu Carro"
              title="Solicite uma avaliação"
              subtitle="Nossa equipe entrará em contato rapidamente."
              campanha="consignacao"
              whatsappText={wppText}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
