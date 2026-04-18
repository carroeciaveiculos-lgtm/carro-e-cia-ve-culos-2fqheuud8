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

export default function FinanciamentoConsignado() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Financiamento de Veículo Consignado',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Carro e Cia Veículos',
    },
    description:
      'Financiamento de veículo consignado com as menores taxas do mercado. Desconto direto na folha, parcelas menores, aprovação fácil.',
  }

  return (
    <main className="flex-1 bg-background">
      <SEO
        title="Financiamento de Veículo Consignado em Uberaba | Carro e Cia"
        description="Financiamento de veículo consignado com as menores taxas do mercado. Desconto direto na folha, parcelas menores, aprovação fácil. Simule agora!"
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
                <BreadcrumbPage>Financiamento Consignado</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Financiamento de Veículo Consignado — Parcelas Menores, Aprovação Fácil, Sem Dor de
              Cabeça
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Você sabia que existe uma forma de comprar seu próximo carro pagando muito menos juros
              do que no financiamento tradicional?
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              O financiamento de veículo consignado é a alternativa mais inteligente para servidores
              públicos, aposentados e pensionistas — e a Carro e Cia Veículos oferece essa
              modalidade com toda a consultoria que você precisa. Aqui em Uberaba MG, milhares de
              pessoas ainda pagam caro demais em financiamentos convencionais sem saber que poderiam
              estar pagando muito menos. Esse texto foi feito para você.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 h-auto w-full sm:w-auto" asChild>
              <a
                href={getWhatsAppLink(
                  'Olá! Tenho interesse em simular um financiamento de veículo consignado.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Simule Grátis pelo WhatsApp — Clique Agora
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 container max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl">
          <h2>O que é Financiamento de Veículo Consignado?</h2>
          <p>
            O financiamento consignado é uma modalidade de crédito em que as parcelas são
            descontadas diretamente da sua folha de pagamento ou benefício do INSS. Parece simples —
            e é. Mas as vantagens são enormes:
          </p>

          <div className="bg-muted/30 border border-border/50 rounded-2xl p-8 my-8 shadow-sm">
            <ul className="space-y-4 m-0 p-0 list-none">
              <li className="flex items-start gap-4 m-0">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>
                  Taxas de juros significativamente menores que o financiamento convencional
                </span>
              </li>
              <li className="flex items-start gap-4 m-0">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Aprovação mais fácil — mesmo com restrição no nome</span>
              </li>
              <li className="flex items-start gap-4 m-0">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Prazos mais longos — parcela menor, mais conforto no orçamento</span>
              </li>
              <li className="flex items-start gap-4 m-0">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Desconto automático — sem risco de esquecer o boleto e perder o carro</span>
              </li>
            </ul>
          </div>

          <p>
            Em termos práticos: você paga o mesmo carro, mas gasta muito menos com juros ao longo
            dos meses.
          </p>

          <h2>Empréstimo Consignado com Garantia de Veículo — O que É e Como Funciona</h2>
          <p>
            Além do financiamento consignado tradicional, existe também o empréstimo consignado com
            garantia de veículo. Nessa modalidade, você usa seu carro atual como garantia para obter
            crédito com taxas ainda menores e valores maiores.
          </p>
          <p>Funciona assim:</p>
          <ul>
            <li>Você oferece seu veículo quitado como garantia</li>
            <li>O banco libera crédito com taxas reduzidas</li>
            <li>As parcelas são descontadas em folha</li>
            <li>Você continua usando o carro normalmente durante todo o período</li>
          </ul>
          <p>
            É a solução ideal para quem precisa de capital com custo baixo, sem precisar vender o
            patrimônio.
          </p>

          <h2>Quem Pode Fazer Financiamento Consignado?</h2>
          <ul className="list-none pl-0 space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-primary text-xl">✔</span> Servidores públicos municipais,
              estaduais e federais
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary text-xl">✔</span> Aposentados e pensionistas do INSS
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary text-xl">✔</span> Militares e forças de segurança
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary text-xl">✔</span> Funcionários de empresas privadas
              conveniadas
            </li>
          </ul>

          <div className="mt-16 p-10 bg-primary/5 border border-primary/20 rounded-2xl text-center shadow-sm">
            <h2 className="text-3xl font-bold mb-6 mt-0 text-foreground">
              Empréstimo Consignado para Carros em Uberaba — Como Simular?
            </h2>
            <p className="mb-8 text-muted-foreground text-lg">
              Na Carro e Cia Veículos, nossa equipe faz a simulação gratuitamente. Você escolhe o
              veículo, a gente apresenta todas as opções de financiamento disponíveis para o seu
              perfil — consignado, CDC ou financiamento tradicional — e você decide com calma, sem
              pressão.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
              <a
                href={getWhatsAppLink(
                  'Olá! Gostaria de fazer uma simulação de financiamento consignado sem compromisso.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Simule Grátis pelo WhatsApp — Clique Agora
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
