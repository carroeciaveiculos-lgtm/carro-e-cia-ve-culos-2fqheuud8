import { Shield, Clock, BadgeDollarSign, HeartHandshake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    title: 'Segurança Total',
    description:
      'Seu carro fica protegido em nosso pátio com seguro e monitoramento 24h. Todo o processo é documentado.',
  },
  {
    icon: Clock,
    title: 'Venda Rápida',
    description:
      'Nossa rede de clientes e forte presença digital garantem que seu veículo seja vendido no menor tempo possível.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Melhor Avaliação',
    description:
      'Conseguimos um valor de venda final superior ao que você conseguiria vendendo sozinho ou para revendedores.',
  },
  {
    icon: HeartHandshake,
    title: 'Zero Burocracia',
    description:
      'Cuidamos de tudo: atendimento aos interessados, negociação, financiamento e transferência. Você só recebe o dinheiro.',
  },
]

export function HomeFeatures() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Como funciona a <span className="text-primary">Consignação</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O jeito mais inteligente, seguro e rentável de vender o seu carro em Uberaba.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
