import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'
import { CheckCircle2, XCircle } from 'lucide-react'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion, trackGTMEvent } from '@/lib/tracking'

export default function Troca() {
  const wppText = 'Olá Luiz! Quero trocar meu carro e saber sobre a Troca com Troco.'

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Troca com Troco | Carro e Cia"
        description="Quer trocar de carro em Uberaba sem perder dinheiro na troca? Na Carro e Cia você troca seu carro pelo que quer e ainda recebe o troco."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Quer trocar de carro em Uberaba sem perder dinheiro na troca?
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A maioria das pessoas sai no prejuízo na troca por não saber negociar. Na Carro e Cia
            você troca seu carro pelo que quer e ainda recebe o troco.
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
                trackGTMEvent('click_whatsapp_troca_troco')
              }}
            >
              QUERO TROCAR MEU CARRO AGORA
            </a>
          </Button>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center border-t border-white/10 pt-8">
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">+100</div>
              <div className="text-sm text-gray-400">veículos para troca</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">Maior valor</div>
              <div className="text-sm text-gray-400">na avaliação real</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">+20 anos</div>
              <div className="text-sm text-gray-400">fazendo trocas justas</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Por que a maioria perde dinheiro na hora de trocar de carro?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {[
              'Concessionária dá menos no seu carro e cobra mais no novo — duplo prejuízo',
              'Você não sabe o valor real e aceita o primeiro preço que oferecem',
              'Tenta vender sozinho e perde semanas',
              'Não encontra o carro que procura',
              'Faz a troca com pressa e se arrepende',
              'Paga mais no financiamento por falta de conhecimento',
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
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-5 gap-6 text-center">
            {[
              'AVALIAÇÃO DO SEU CARRO',
              'ESCOLHA SEU PRÓXIMO CARRO',
              'CALCULAMOS A DIFERENÇA',
              'FINANCIAMENTO SE PRECISAR',
              'TRANSFERÊNCIA E DOCUMENTAÇÃO',
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
                "Em 3 concessionárias me deram menos. O Luiz avaliou certo e saí com R$ 4.000 de
                troco."
              </p>
              <div className="font-bold text-red-400">— Fábio Martins, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">"Fiz a troca, recebi o troco e saí feliz no mesmo dia."</p>
              <div className="font-bold text-red-400">— Juliana Ferreira, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "Não sabia que existia troca com troco. O Luiz me pagou a diferença."
              </p>
              <div className="font-bold text-red-400">— Paulo Henrique, Uberaba</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Troque de carro hoje.
              <br />
              Saia com o troco no bolso.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 mt-4">
              Preencha o formulário para iniciar a avaliação da sua troca. Nossa equipe retornará
              rapidamente.
            </p>
            <div className="mt-6">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-red-600 hover:bg-red-700 text-white w-full rounded-full font-bold shadow-lg"
              >
                <a
                  href={getWhatsAppLink(wppText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackConversion('whatsapp')
                    trackGTMEvent('click_whatsapp_troca_troco')
                  }}
                >
                  FALAR DIRETO NO WHATSAPP
                </a>
              </Button>
            </div>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-2xl shadow-xl border">
            <ConsignacaoLPForm
              origem="LP - Troca com Troco"
              title="Troca com Troco"
              subtitle="Faça uma avaliação do seu veículo atual"
              campanha="troca_troco"
              whatsappText={wppText}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
