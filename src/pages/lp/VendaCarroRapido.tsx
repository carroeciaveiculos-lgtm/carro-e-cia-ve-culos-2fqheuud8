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
import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function VendaCarroRapido() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Consignação e Venda de Veículos',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Carro e Cia Veículos',
    },
    description:
      'Quer vender seu carro rápido, sem estresse e pelo melhor preço? Consigne na Carro e Cia e deixe que a gente vende para você.',
  }

  return (
    <main className="flex-1 bg-background">
      <SEO
        title="Como Vender Meu Carro Rápido em Uberaba | Carro e Cia Veículos"
        description="Quer vender seu carro rápido, sem estresse e pelo melhor preço? Consigne na Carro e Cia e deixe que a gente vende para você. Avaliação grátis!"
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
                <BreadcrumbPage>Venda Seu Carro / Consignação</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Como Vender Seu Carro Rápido, com Segurança e Pelo Melhor Preço em Uberaba
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Você já tentou vender um carro por conta própria? Então você sabe como é: anúncio
              postado, 40 mensagens, 10 visitas, 8 propostas ridículas, 2 pessoas que somem depois
              de ver o carro e nenhuma venda.
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Semanas ou meses perdidos. Paciência esgotada. Existe um jeito melhor. Na Carro e Cia
              Veículos, você consigna — e a gente vende por você.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 h-auto w-full sm:w-auto" asChild>
              <a
                href={getWhatsAppLink(
                  'Olá! Quero vender meu carro de forma rápida e segura com a Carro e Cia.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quero Vender Meu Carro — Solicitar Avaliação Grátis
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 container max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl">
          <h2>O que é Consignação de Veículo e Por que Vale a Pena?</h2>
          <p>
            Consignação é simples: você nos entrega o carro, a gente assume a responsabilidade de
            vender. Enquanto isso, você vive sua vida normalmente.
          </p>
          <p>Nossa equipe cuida de tudo:</p>
          <ul>
            <li>Fotos profissionais do veículo</li>
            <li>Anúncio em todos os canais digitais — OLX, Webmotors, Instagram, Google</li>
            <li>Atendimento completo aos compradores</li>
            <li>Negociação e verificação de documentos</li>
            <li>Transferência segura e sem burocracia</li>
          </ul>
          <p>
            <strong>Você só aparece para assinar e receber.</strong>
          </p>

          <h2>Consignação vs Venda Particular — A Comparação Honesta</h2>
          <div className="my-10 overflow-x-auto not-prose border rounded-xl shadow-sm">
            <Table className="bg-card">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px] font-bold">Característica</TableHead>
                  <TableHead className="font-bold">Venda Particular</TableHead>
                  <TableHead className="font-bold text-primary">Consignação Carro e Cia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Tempo médio</TableCell>
                  <TableCell>30 a 90 dias sem garantia de venda</TableCell>
                  <TableCell className="font-medium text-primary">
                    15 a 30 dias com equipe dedicada
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Atendimento</TableCell>
                  <TableCell>Você mesmo (WhatsApp, ligações, visitas)</TableCell>
                  <TableCell className="font-medium text-primary">
                    Nossa equipe especializada
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Risco</TableCell>
                  <TableCell>Alto — golpes com cheque, PIX falso, comprador que some</TableCell>
                  <TableCell className="font-medium text-primary">
                    Zero — toda negociação é intermediada e documentada
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Preço</TableCell>
                  <TableCell>Geralmente abaixo do mercado por falta de referência</TableCell>
                  <TableCell className="font-medium text-primary">
                    Avaliação com base em tabelas de mercado reais
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Documentação</TableCell>
                  <TableCell>Por sua conta</TableCell>
                  <TableCell className="font-medium text-primary">A gente resolve tudo</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h2>Como Avaliar Meu Veículo Para Venda — Evite Perder Dinheiro</h2>
          <p>
            A maioria das pessoas perde dinheiro na venda do carro por dois erros clássicos: pedir
            demais (o carro fica parado meses) ou pedir de menos (vende rápido, mas no prejuízo). A
            avaliação correta é o que separa um bom negócio de um arrependimento.
          </p>
          <p>Na Carro e Cia, usamos:</p>
          <ul>
            <li>Tabela FIPE atualizada</li>
            <li>Pesquisa de mercado regional (Uberaba e triângulo mineiro)</li>
            <li>Análise de demanda atual para o modelo e ano do seu veículo</li>
            <li>Estado de conservação real (mecânica, lataria, documentação)</li>
          </ul>
          <p>O resultado é um valor justo — bom para você vender e bom para o comprador fechar.</p>

          <h2>Como Anunciar Meu Carro com a Carro e Cia — Passo a Passo</h2>
          <ol>
            <li>Entre em contato pelo WhatsApp ou venha à loja</li>
            <li>Fazemos a avaliação gratuita do seu veículo</li>
            <li>Você assina o contrato de consignação com prazo e valor acordados</li>
            <li>A gente fotografa, anuncia e atende os interessados</li>
            <li>Vendido — você recebe o valor combinado</li>
          </ol>

          <div className="mt-16 p-10 bg-primary/5 border border-primary/20 rounded-2xl text-center shadow-sm">
            <h2 className="text-3xl font-bold mb-6 mt-0 text-foreground">
              Pare de perder tempo com propostas que não dão em nada!
            </h2>
            <p className="mb-8 text-muted-foreground text-lg">
              Quer vender rápido e seguro? Nossa equipe tem dezenas de compradores esperando. Clique
              abaixo e comece a resolver a venda do seu carro hoje mesmo.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
              <a
                href={getWhatsAppLink(
                  'Olá! Gostaria de agendar a avaliação do meu carro para colocar em consignação.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quero Vender Meu Carro — Solicitar Avaliação Grátis
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
