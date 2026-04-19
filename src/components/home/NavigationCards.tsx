import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, DollarSign, FileText } from 'lucide-react'

export function NavigationCards() {
  const cards = [
    {
      title: 'Quero Comprar um Carro',
      desc: 'Estoque renovado com procedência e documentação 100% regularizada.',
      icon: Car,
      link: '/estoque',
      cta: 'Ver Estoque',
    },
    {
      title: 'Quero Vender Meu Carro',
      desc: 'Consigne com a gente e receba pelo melhor preço sem nenhum esforço.',
      icon: DollarSign,
      link: '/vender-meu-carro',
      cta: 'Avaliar Meu Carro',
    },
    {
      title: 'Quero Financiar',
      desc: 'Parcelas que cabem no seu salário com aprovação rápida e sem burocracia.',
      icon: FileText,
      link: '/financiamento-veiculo-consignado',
      cta: 'Simular Agora',
    },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((c, i) => (
            <Card
              key={i}
              className="flex flex-col items-center text-center hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <c.icon className="w-8 h-8" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl">{c.title}</CardTitle>
                <CardDescription className="text-base mt-2">{c.desc}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto w-full">
                <Button asChild className="w-full" size="lg" aria-label={c.cta}>
                  <Link to={c.link} target="_self">
                    {c.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
