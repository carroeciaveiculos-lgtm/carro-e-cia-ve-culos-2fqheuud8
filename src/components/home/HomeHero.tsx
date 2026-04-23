import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { MessageCircle, CarFront } from 'lucide-react'
import { trackCTAClick } from '@/lib/tracking'

export function HomeHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16">
      <div className="absolute inset-0 z-0">
        <picture>
          <source
            srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-mobile.webp 480w, https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp 1200w"
            sizes="(max-width: 768px) 100vw, 100vw"
            type="image/webp"
          />
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
            alt="Carro e Cia Veículos - 20+ anos de referência em Uberaba"
            width="1920"
            height="1080"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 animate-fade-in-up">
          <picture className="inline-block bg-white/90 p-4 rounded-xl shadow-2xl">
            <source
              media="(max-width: 480px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
              type="image/webp"
            />
            <source
              media="(min-width: 481px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
              type="image/webp"
            />
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
              alt="Carro e Cia"
              loading="eager"
              width="200"
              height="80"
              className="max-w-full h-auto object-contain"
            />
          </picture>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white mb-6 leading-tight animate-fade-in-up">
          Quer Vender Seu Carro? <span className="text-primary">A Solução Segura Está Aqui</span>
        </h1>
        <p
          className="text-xl md:text-2xl text-gray-200 mb-8 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          Consignação profissional, contrato protetor, você não se preocupa com nada. Há 20 anos,
          Luiz Fernando oferece transparência e confiança.
        </p>
        <p
          className="text-lg text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Você tem um carro para vender e está cansado de se preocupar? Consigne com a Carro e Cia.
          Nosso time cuida de TUDO: avaliação profissional, múltiplos anúncios, negociação segura.
          Venda em dias, não em meses. Transparência garantida.
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <Button
            asChild
            size="lg"
            className="h-16 text-lg px-8 bg-[#25D366] hover:bg-[#20bd5a] text-white"
          >
            <a
              href="/consignacao"
              onClick={() => trackCTAClick('Quero Consignar Meu Carro AGORA', '/')}
            >
              <CarFront className="mr-2 h-6 w-6" /> Quero Consignar Meu Carro AGORA
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-16 text-lg px-8 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
          >
            <a
              href={getWhatsAppLink(
                'Olá Luiz, quero saber mais sobre a consignação segura da Carro e Cia.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('Falar com Luiz (WhatsApp)', '/')}
            >
              <MessageCircle className="mr-2 h-6 w-6" /> Falar com Luiz (WhatsApp)
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
