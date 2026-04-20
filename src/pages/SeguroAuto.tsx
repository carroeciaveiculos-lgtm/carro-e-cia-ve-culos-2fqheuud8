import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion } from '@/lib/tracking'

export default function SeguroAuto() {
  const wppText = 'Olá Gabriel! Quero cotar seguro para meu veículo.'
  const phoneSeguro = '5534992000300'

  const parceiros = [
    'Porto Seguro',
    'Bradesco Seguros',
    'Allianz',
    'Tokio Marine',
    'Mapfre',
    'Azul Seguros',
    'Yelum Seguros',
    'HDI Seguros',
    'Suhai Seguros',
    'BP Seguros',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Seguro Auto em Uberaba | Carro e Cia Veículos"
        description="Seguro Auto em Uberaba. Encontre o melhor seguro para seu carro com atendimento humanizado da corretora Adriana Araújo."
      />

      <section className="bg-black text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Seguro Auto em Uberaba — Proteção completa para seu veículo
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Encontre o melhor seguro para seu carro com atendimento humanizado da corretora Adriana
            Araújo.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto rounded-full font-bold shadow-lg shadow-red-600/20"
          >
            <a
              href={getWhatsAppLink(wppText, phoneSeguro)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
            >
              QUERO COTAR MEU SEGURO
            </a>
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto space-y-20">
          {/* Gabriel Araújo */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:justify-end md:order-1">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Gabriel%20foto%20profissional.jpeg"
                alt="Gabriel Araújo"
                className="w-[200px] h-[240px] md:w-[280px] md:h-[320px] object-cover rounded-xl shadow-xl"
              />
            </div>
            <div className="text-center md:text-left md:order-2">
              <h2 className="text-3xl font-bold mb-4">Gabriel Araújo</h2>
              <p className="text-lg text-red-600 font-bold mb-4">Especialista em Seguro Auto</p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Focado em encontrar as melhores condições de proteção para o seu veículo, com
                agilidade e transparência.
              </p>
              <p className="font-bold text-lg">Km Zero Corretora de Seguros</p>
            </div>
          </div>

          {/* Adriana Araújo */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:justify-start md:order-2">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Adriana%20foto%20profissional.jpeg"
                alt="Adriana Araújo"
                className="w-[200px] h-[240px] md:w-[280px] md:h-[320px] object-cover rounded-xl shadow-xl"
              />
            </div>
            <div className="text-center md:text-right md:order-1">
              <h2 className="text-3xl font-bold mb-4">Adriana Araújo</h2>
              <p className="text-lg text-red-600 font-bold mb-4">
                Corretora de Seguros habilitada pela SUSEP desde 2003
              </p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Mais de 20 anos protegendo famílias e patrimônios em Uberaba. Especialista em
                seguros auto, atendimento humanizado e personalizado.
              </p>
              <p className="font-bold text-lg">Km Zero Corretora de Seguros e Consórcios</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-y">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold">COTAÇÃO GRATUITA</h3>
            </div>
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold">COMPARATIVO COMPLETO</h3>
            </div>
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold">ESCOLHA SEM PRESSÃO</h3>
            </div>
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-bold">PROTEÇÃO ATIVADA</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Seguradoras Parceiras</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {parceiros.map((p) => (
              <div key={p} className="bg-muted/30 border px-6 py-3 rounded-full font-medium">
                {p}
              </div>
            ))}
          </div>

          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-full font-bold shadow-lg"
          >
            <a
              href={getWhatsAppLink(wppText, phoneSeguro)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('whatsapp')}
            >
              COTAR MEU SEGURO AGORA
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
