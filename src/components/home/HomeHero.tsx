import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { MessageCircle, CarFront } from 'lucide-react'
import { trackCTAClick } from '@/lib/tracking'
import { LeadForm } from '@/components/LeadForm'

export function HomeHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16">
      <div className="absolute inset-0 z-0">
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-mobile.webp"
            type="image/webp"
          />
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
            alt="Carro e Cia Veículos - 20+ anos de referência em Uberaba"
            width="1920"
            height="1080"
            className="w-full h-[400px] md:h-full object-cover object-center"
            style={{ filter: 'brightness(0.8)' }}
          />
        </picture>
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="container relative z-10 mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
            alt="Luiz Fernando"
            className="w-[140px] h-[140px] rounded-full object-cover object-top border-2 border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.1)] mx-auto lg:mx-0 mb-6 relative z-20 aspect-square flex-shrink-0"
          />{' '}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white mb-6 leading-tight animate-fade-in-up drop-shadow-md">
            Venda Seu Veículo em Até 48 Horas
          </h1>
          <p
            className="text-lg md:text-xl text-gray-100 mb-8 max-w-3xl mx-auto lg:mx-0 animate-fade-in-up drop-shadow-sm"
            style={{ animationDelay: '100ms' }}
          >
            Consignação profissional, contrato protegido. Há 20 anos, Luiz Fernando oferece
            transparência e confiança.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <Button
              asChild
              size="lg"
              className="h-14 text-sm md:text-base px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto whitespace-nowrap"
            >
              <a href="/consignacao" onClick={() => trackCTAClick('CONSIGNAR AGORA', '/')}>
                CONSIGNAR AGORA
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 text-sm md:text-base px-6 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm w-full sm:w-auto whitespace-nowrap"
            >
              <a
                href={getWhatsAppLink(
                  'Olá Luiz, quero saber mais sobre a consignação segura da Carro e Cia.',
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCTAClick('FALAR COM LUIZ (WHATSAPP)', '/')}
              >
                <MessageCircle className="mr-2 h-5 w-5" /> FALAR COM LUIZ
              </a>
            </Button>
          </div>
        </div>
        <div
          className="w-full max-w-md mx-auto animate-fade-in-up relative z-20"
          style={{ animationDelay: '400ms' }}
        >
          <div className="bg-white/85 dark:bg-card/85 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden p-5 md:p-6 border-t-4 border-[#25D366]">
            <div className="mb-5 text-center">
              {' '}
              <h3 className="text-2xl font-bold text-slate-800">Avaliação Gratuita</h3>
              <p className="text-sm text-slate-500">
                Deixe seus dados e entramos em contato rápido.
              </p>
            </div>
            <LeadForm campanha="home" origem="Hero Site" buttonText="Falar com Consultor" />
          </div>
        </div>
      </div>
    </section>
  )
}
