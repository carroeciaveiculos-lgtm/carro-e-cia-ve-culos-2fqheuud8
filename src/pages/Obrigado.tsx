import { useLocation } from 'react-router-dom'
import { MessageCircle, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEO } from '@/components/SEO'

export default function Obrigado() {
  const location = useLocation()
  const nome = location.state?.nome || ''

  const wppText = encodeURIComponent(
    'Olá Luiz! Acabei de preencher o formulário e quero saber mais.',
  )

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/30 flex items-center justify-center py-20 px-4">
      <SEO
        title="Obrigado pelo Contato | Carro e Cia Veículos"
        description="Recebemos suas informações. Nossa equipe especializada entrará em contato em breve para apresentar a melhor proposta para o seu veículo."
        noindex={true}
      />
      <div className="max-w-2xl w-full bg-card rounded-2xl shadow-xl p-8 md:p-12 text-center border border-border">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 text-foreground">
          Recebemos seu contato{nome ? `, ${nome.split(' ')[0]}` : ''}!
        </h1>

        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
          O Luiz já está sabendo que você quer vender seu carro. Em breve ele vai entrar em contato
          com você.
        </p>

        <div className="bg-muted p-6 rounded-xl mb-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-background shadow-md">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Luiz%20Fernando%20foto%20profissional.jpeg"
              alt="Luiz Fernando"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-bold text-lg">Luiz Fernando</h3>
          <p className="text-sm text-muted-foreground">Especialista em Negócios Automotivos</p>
        </div>

        <Button
          asChild
          className="w-full h-16 text-sm md:text-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg animate-pulse whitespace-normal py-4 mb-8"
        >
          <a
            href={`https://wa.me/5534999484285?text=${wppText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-6 h-6 shrink-0" />
            FALAR COM O LUIZ AGORA
          </a>
        </Button>

        <div className="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>(34) 99948-4285</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-center">
              Av. Guilherme Ferreira, 1119
              <br />
              Uberaba - MG
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
