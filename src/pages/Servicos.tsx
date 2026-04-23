import { SEO } from '@/components/SEO'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Wrench, Shield, Car, DollarSign } from 'lucide-react'

export default function Servicos() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <SEO
        title="Nossos Serviços | Carro e Cia Veículos"
        description="Conheça os serviços oferecidos pela Carro e Cia Veículos: consignação, financiamento, compra e venda com total segurança."
      />
      <div className="container max-w-6xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-6 text-center animate-fade-in-up">
          Nossos <span className="text-primary">Serviços</span>
        </h1>
        <p
          className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-16 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          Oferecemos soluções completas para você vender, comprar ou trocar seu veículo com total
          segurança e comodidade.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card
            className="animate-fade-in-up bg-card/50 border-border/50"
            style={{ animationDelay: '200ms' }}
          >
            <CardHeader>
              <Shield className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Consignação Segura</CardTitle>
              <CardDescription>Venda seu carro sem preocupações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Nossa especialidade há mais de 20 anos. Deixe seu carro conosco e nossa equipe
                cuidará de todo o processo de venda, desde o anúncio em múltiplos canais até a
                negociação e transferência, garantindo total segurança e o melhor valor para o seu
                veículo.
              </p>
            </CardContent>
          </Card>

          <Card
            className="animate-fade-in-up bg-card/50 border-border/50"
            style={{ animationDelay: '300ms' }}
          >
            <CardHeader>
              <DollarSign className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Financiamento</CardTitle>
              <CardDescription>As melhores taxas do mercado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Trabalhamos em parceria com as principais instituições financeiras para oferecer as
                melhores condições de financiamento. Aprovação rápida de crédito e parcelas que
                cabem no seu bolso, facilitando a conquista do seu novo carro.
              </p>
            </CardContent>
          </Card>

          <Card
            className="animate-fade-in-up bg-card/50 border-border/50"
            style={{ animationDelay: '400ms' }}
          >
            <CardHeader>
              <Car className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Compra e Venda</CardTitle>
              <CardDescription>Estoque revisado com garantia</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Oferecemos um estoque diversificado de veículos seminovos de altíssima qualidade,
                todos rigorosamente revisados e com garantia de procedência. Também aceitamos o seu
                carro usado na troca com uma avaliação justa.
              </p>
            </CardContent>
          </Card>

          <Card
            className="animate-fade-in-up bg-card/50 border-border/50"
            style={{ animationDelay: '500ms' }}
          >
            <CardHeader>
              <Wrench className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Avaliação Profissional</CardTitle>
              <CardDescription>Transparência em todas as negociações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Nossa equipe conta com profissionais experientes para realizar uma avaliação
                detalhada e criteriosa do seu veículo. Garantimos transparência total sobre o estado
                do carro e uma proposta de valor de mercado extremamente competitiva.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
