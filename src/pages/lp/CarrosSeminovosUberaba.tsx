import { SEO } from '@/components/SEO'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CarrosSeminovosUberaba() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Carro e Cia Veículos',
    image: 'https://img.usecurling.com/p/800/600?q=car%20dealership',
    description:
      'Encontre os melhores carros seminovos em Uberaba MG com procedência, garantia e preço justo.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Uberaba',
      addressRegion: 'MG',
      addressCountry: 'BR',
    },
  }

  return (
    <main className="flex-1 bg-background">
      <SEO
        title="Carros Seminovos em Uberaba MG | Carro e Cia Veículos"
        description="Encontre os melhores carros seminovos em Uberaba MG com procedência, garantia e preço justo. Mais de 20 anos no mercado. Venha conhecer!"
        schema={schema}
      />

      <section className="relative py-20 bg-muted/40 border-b overflow-hidden">
        <div className="container relative z-10">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Início</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Carros Seminovos em Uberaba MG</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Carros Seminovos em Uberaba MG — Com Procedência, Garantia e Preço Justo
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Você está procurando carros seminovos em Uberaba MG com segurança, procedência e preço
              justo? Na Carro e Cia Veículos você encontra exatamente o que precisa — sem surpresas,
              sem estresse e sem enrolação.
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Com mais de 20 anos de experiência no mercado de veículos usados em Uberaba e região,
              somos referência em qualidade, transparência e atendimento humanizado. Cada carro do
              nosso estoque passa por avaliação rigorosa antes de ser anunciado. Aqui você não
              compra um carro — você compra tranquilidade.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 h-auto w-full sm:w-auto" asChild>
              <a
                href={getWhatsAppLink(
                  'Olá! Vi a página de carros seminovos e gostaria de ver o estoque.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fale com a Carro e Cia pelo WhatsApp — Clique Aqui
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 container max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl">
          <h2>Por que Comprar Seminovo na Carro e Cia Veículos?</h2>
          <p>
            Existem dezenas de opções para comprar carros usados em Uberaba MG. Mas existem poucos
            lugares onde você sai com a certeza de ter feito um bom negócio. A Carro e Cia é um
            desses lugares.
          </p>

          <div className="bg-muted/30 border border-border/50 rounded-2xl p-8 my-10 shadow-sm">
            <ul className="space-y-4 m-0 p-0 list-none">
              {[
                'Veículos com histórico verificado — sem passado escondido',
                'Documentação 100% regularizada — transferência sem burocracia',
                'Financiamento facilitado — inclusive na modalidade consignada',
                'Atendimento personalizado, sem pressão de venda',
                'Mais de 20 anos de confiança consolidada em Uberaba MG',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 m-0">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p>
            Quando você compra na Carro e Cia, você está comprando de quem conhece o mercado local
            de dentro para fora.
          </p>

          <h2>Carros Usados à Venda em Uberaba MG — Estoque Sempre Renovado</h2>
          <p>
            Nosso estoque é renovado constantemente com as melhores oportunidades da região. De
            hatches econômicos a SUVs e utilitários, você encontra o carro certo para o seu perfil e
            o seu bolso.
          </p>
          <p>Todos os nossos veículos passam por:</p>
          <ul>
            <li>Vistoria técnica completa</li>
            <li>Verificação de histórico de sinistros</li>
            <li>Conferência de documentação e multas</li>
            <li>Higienização e preparação para entrega</li>
          </ul>
          <p>
            Procurando um modelo específico? Entre em contato agora e nossa equipe te avisa assim
            que chegar no estoque.
          </p>

          <h2>Carros Semi Novos em Uberaba — Como Funciona a Compra?</h2>
          <p>Comprar um carro seminovo na Carro e Cia é simples, rápido e sem complicação:</p>
          <ol>
            <li>Você escolhe o veículo — presencialmente na loja ou pelo nosso site</li>
            <li>Nossa equipe apresenta toda a documentação e histórico do veículo</li>
            <li>
              Simulamos o financiamento nas melhores condições disponíveis — inclusive consignado
            </li>
            <li>Transferência rápida, segura e sem burocracia</li>
            <li>Você sai com o carro e a tranquilidade de ter feito um bom negócio</li>
          </ol>

          <div className="mt-16 p-10 bg-primary/5 border border-primary/20 rounded-2xl text-center shadow-sm">
            <h2 className="text-3xl font-bold mb-4 mt-0 text-foreground">
              Tem um Carro Para Dar Como Entrada?
            </h2>
            <h3 className="text-xl mb-6 text-foreground font-medium">
              Faça sua Avaliação Gratuita!
            </h3>
            <p className="mb-8 text-muted-foreground">
              Quer reduzir o valor das parcelas? Fazemos a avaliação gratuita do seu veículo atual e
              você pode usar como parte do pagamento. Avaliação rápida, justa e sem compromisso.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
              <a
                href={getWhatsAppLink('Olá! Gostaria de avaliar meu carro para dar como entrada.')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Solicitar Avaliação Grátis pelo WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
