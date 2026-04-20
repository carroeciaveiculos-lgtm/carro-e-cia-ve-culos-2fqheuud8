import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'
import { CheckCircle2, XCircle } from 'lucide-react'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion, trackGTMEvent } from '@/lib/tracking'

export default function Seguranca() {
  const wppText = 'Olá Luiz! Quero vender meu carro com segurança. Pode me ajudar?'

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Venda Segura de Veículos | Carro e Cia"
        description="Vender seu carro sozinho em Uberaba pode ser o maior erro da sua vida. Na Carro e Cia você vende com total segurança."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Vender seu carro sozinho em Uberaba pode ser o maior erro da sua vida.
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Golpe do cheque sem fundo, test drive que não volta, comprador laranja... Isso acontece
            todo dia aqui na cidade. Na Carro e Cia você vende com total segurança — sem risco
            nenhum.
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
                trackGTMEvent('click_whatsapp_venda_segura')
              }}
            >
              QUERO VENDER MEU CARRO COM SEGURANÇA
            </a>
          </Button>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center border-t border-white/10 pt-8">
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">+20 anos</div>
              <div className="text-sm text-gray-400">protegendo vendedores</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">100%</div>
              <div className="text-sm text-gray-400">das vendas com contrato</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-1">Zero</div>
              <div className="text-sm text-gray-400">golpes na nossa história</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Você sabia que vender carro sozinho é um dos negócios mais arriscados?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {[
              'Comprador some no test drive',
              'Cheque sem fundo aceito por engano',
              'CPF do comprador com restrições',
              'Carro usado em crime após a venda',
              'Financiamento no seu nome sem saber',
              'Contrato mal feito que não vale nada',
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
          <h2 className="text-3xl font-bold text-center mb-12">Como a Carro e Cia Protege Você</h2>
          <div className="grid md:grid-cols-5 gap-6 text-center">
            {[
              'AVALIAÇÃO GRATUITA',
              'CONTRATO DE CONSIGNAÇÃO',
              'VERIFICAÇÃO DO COMPRADOR',
              'TRANSFERÊNCIA CORRETA',
              'VOCÊ RECEBE O VALOR COMBINADO',
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
                "Tentei vender sozinho e quase cai num golpe. O comprador sumiu 40 minutos no test
                drive. Nunca mais."
              </p>
              <div className="font-bold text-red-400">— Marcos Vinícius, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "O Luiz me explicou os riscos. Em 3 semanas recebi o valor que queria com contrato
                certinho."
              </p>
              <div className="font-bold text-red-400">— Patrícia Mendonça, Uberaba</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl">
              <p className="italic mb-4">
                "Minha filha caiu no golpe do cheque. Com o Luiz isso nunca teria acontecido."
              </p>
              <div className="font-bold text-red-400">— Dona Aparecida, Uberaba</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Seu carro tem valor.
              <br />
              Sua segurança não tem preço.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 mt-4">
              Preencha o formulário e um especialista da nossa equipe fará uma avaliação gratuita do
              seu veículo.
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
                    trackGTMEvent('click_whatsapp_venda_segura')
                  }}
                >
                  FALAR DIRETO NO WHATSAPP
                </a>
              </Button>
            </div>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-2xl shadow-xl border">
            <ConsignacaoLPForm
              origem="LP - Venda Segura"
              title="Venda com Segurança"
              subtitle="Receba uma avaliação do seu veículo"
              campanha="venda_segura"
              whatsappText={wppText}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
