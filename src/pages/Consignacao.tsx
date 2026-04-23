import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ShieldCheck, Clock, Megaphone, Calculator, Star, MapPin } from 'lucide-react'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick } from '@/lib/tracking'
import { ConsignacaoLPForm } from '@/components/ConsignacaoLPForm'

export default function Consignacao() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Consignação de Veículos Segura em Uberaba',
    description:
      'Consignação segura em Uberaba. Venda seu carro em 15 dias. Contrato protetor, avaliação profissional, múltiplas plataformas. Carro e Cia.',
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title="Consignação de Carro em Uberaba | Venda Rápida e Segura"
        description="Consignação segura em Uberaba. Venda seu carro em 15 dias. Contrato protetor, avaliação profissional, múltiplas plataformas. Carro e Cia."
        schema={schema}
        canonical="https://carroeciamotors.com.br/consignacao"
      />

      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-4 mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight">
              Consignação: A Solução <span className="text-primary">Segura</span> Para Vender Seu
              Carro
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Venda em dias, não em meses. Contrato protetor. Você não se preocupa.
            </p>
            </div>
          </div>
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="bg-card border rounded-xl shadow-2xl p-8 text-left">
              <ConsignacaoLPForm 
                title="Venda seu carro mais rápido" 
                subtitle="Deixe os detalhes com a gente. Preencha abaixo para uma avaliação sem compromisso." 
              />
            </div>
          </div>
        </div>
      </section>

      {/* O que é */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">O Que é Consignação?</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Consignação é quando você deixa seu carro conosco para vender. Nós anunciamos,
            negociamos, cuidamos de tudo. Você recebe quando o carro é vendido. Simples assim.
          </p>
        </div>
      </section>

      {/* Processo Passo a Passo */}
      <section id="processo" className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            Processo Passo a Passo
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: '🚗',
                title: '1. Você Traz Seu Carro',
                desc: 'Agende visita. Leve seu veículo à loja.',
                time: '30 min',
              },
              {
                icon: '📊',
                title: '2. Avaliação Gratuita',
                desc: 'Inspeção completa. Referência FIPE. Proposta honesta.',
                time: '1 hr',
              },
              {
                icon: '📝',
                title: '3. Assinamos o Contrato',
                desc: 'Tudo transparente. Contato protetor assinado.',
                time: '30 min',
              },
              {
                icon: '💰',
                title: '4. Anunciamos e Você Recebe',
                desc: 'iCarro, Web Motors. Você recebe quando vender!',
                time: 'Média 15 dias',
              },
            ].map((step, i) => (
              <Card
                key={i}
                className="text-center p-6 hover:shadow-lg transition-shadow border-border/50 relative overflow-hidden"
              >
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{step.desc}</p>
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {step.time}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section className="bg-[#1A1A1A] text-white py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            Vantagens da Consignação
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <Clock className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Venda Rápida</h3>
                <p className="text-gray-400">Tempo médio: 15 dias (vs 3-6 meses particular)</p>
              </div>
            </div>
            <div className="flex gap-4">
              <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Segurança Jurídica</h3>
                <p className="text-gray-400">
                  Contrato protetor. Procedência verificada. Você protegido.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Zero Burocracia</h3>
                <p className="text-gray-400">A gente cuida. Você só recebe o dinheiro.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Megaphone className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Múltiplas Plataformas</h3>
                <p className="text-gray-400">iCarro, Web Motors, Mercado Livre + loja física.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Calculator className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Avaliação Profissional</h3>
                <p className="text-gray-400">Tabela FIPE. Preço justo. Sem surpresas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais Carro e Cia */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            Diferenciais Carro e Cia
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
                alt="Fachada"
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">20+ Anos de Mercado</h3>
                <p className="text-muted-foreground">Solidez. Confiança. Referência em Uberaba.</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
                alt="Luiz Fernando"
                className="w-full h-48 object-cover object-top"
                loading="lazy"
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Luiz Fernando Pessoalmente</h3>
                <p className="text-muted-foreground">
                  CEO dedicado. Apaixonado por carros. Humanidade em cada transação.
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden bg-muted/20 flex flex-col items-center justify-center p-6 text-center">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Logo-km-zero-fundo-transparente.webp"
                alt="Km Zero"
                className="w-32 h-32 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-bold mb-2">Parceiros Estratégicos</h3>
              <p className="text-muted-foreground">
                Financiamento Km Zero. Bancos de confiança. Seguro auto disponível.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section className="bg-muted/30 py-20 border-y border-border/50">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-10">
            Consignação vs Venda Particular
          </h2>
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase text-sm">
                  <th className="p-4 border-b font-semibold">Critério</th>
                  <th className="p-4 border-b font-semibold text-destructive">Venda Particular</th>
                  <th className="p-4 border-b font-semibold text-primary">
                    Consignação Carro e Cia
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base">
                <tr className="border-b">
                  <td className="p-4 font-medium">Tempo</td>
                  <td className="p-4 text-muted-foreground">3-6 meses</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">15 dias (média)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Preço</td>
                  <td className="p-4 text-muted-foreground">Risco de perder valor</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">Tabela FIPE protege</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Burocracia</td>
                  <td className="p-4 text-muted-foreground">VOCÊ cuida</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">A GENTE cuida</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Contato Estranhos</td>
                  <td className="p-4 text-muted-foreground">Risco de golpe</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">Segurança total</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Documentação</td>
                  <td className="p-4 text-muted-foreground">Responsabilidade sua</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">
                    Responsabilidade nossa
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Fotos/Anúncios</td>
                  <td className="p-4 text-muted-foreground">VOCÊ faz</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">A GENTE faz profissa</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Negociação</td>
                  <td className="p-4 text-muted-foreground">VOCÊ negocia</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">A GENTE negocia</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Garantia</td>
                  <td className="p-4 text-muted-foreground">Nenhuma</td>
                  <td className="p-4 font-bold text-primary bg-primary/5">
                    Procedência verificada
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 text-center container max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-display font-bold mb-16">Depoimentos de Clientes</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-left shadow-md">
            <div className="flex text-yellow-500 mb-4">
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
            </div>
            <p className="italic text-muted-foreground mb-4">
              "Vendi meu carro em 12 dias! Luiz foi super profissional, tudo transparente. Antes eu
              tentei vender sozinho por meses sem sucesso. Recomendo muito!"
            </p>
            <p className="font-bold">- João Silva, Uberaba</p>
          </Card>
          <Card className="p-6 text-left shadow-md">
            <div className="flex text-yellow-500 mb-4">
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
            </div>
            <p className="italic text-muted-foreground mb-4">
              "Não queria mais me preocupar vendendo sozinho. Consignei na Carro e Cia, recebi em 20
              dias e sem dor de cabeça. Serviço impecável."
            </p>
            <p className="font-bold">- Maria Santos, Uberlândia</p>
          </Card>
          <Card className="p-6 text-left shadow-md">
            <div className="flex text-yellow-500 mb-4">
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
            </div>
            <p className="italic text-muted-foreground mb-4">
              "Luiz cuida do seu carro como se fosse dele. Profissionalismo de quem realmente ama
              carros. Vendeu no preço que combinamos."
            </p>
            <p className="font-bold">- Carlos Oliveira, Uberaba</p>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/20 py-20 border-t border-border/50">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-10">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: 'Como funciona a consignação?',
                a: 'Você deixa seu carro com a gente, assinamos um contrato definindo preço mínimo e prazo. Nós preparamos o carro, tiramos fotos profissionais e anunciamos em vários portais. Quando vendemos, você recebe o valor combinado.',
              },
              {
                q: 'Qual é a taxa de consignação?',
                a: 'Nossa taxa é negociada e transparente, geralmente um percentual sobre a venda ou um valor fixo acordado previamente. Não cobramos mensalidade para anunciar o seu veículo.',
              },
              {
                q: 'Quanto tempo leva vender em consignação?',
                a: 'Em média, nossos carros consignados são vendidos em 15 dias, graças ao nosso forte investimento em marketing e rede de clientes.',
              },
              {
                q: 'Meu carro precisa estar em perfeito estado?',
                a: 'Recomendamos que o carro esteja em bom estado, mas nós fazemos uma avaliação transparente e podemos orientar sobre pequenos reparos estéticos ou mecânicos que aumentam o valor de venda.',
              },
              {
                q: 'Como é feita a avaliação?',
                a: 'Avaliamos com base na Tabela FIPE, histórico do veículo (RENAVAM/Chassi), estado de conservação, quilometragem e demanda de mercado. Você recebe uma proposta honesta.',
              },
              {
                q: 'O contrato protege a gente também?',
                a: 'Sim, 100%. O contrato estipula suas garantias, responsabilidades da loja e protege o veículo em nosso pátio contra qualquer eventualidade.',
              },
              {
                q: 'Posso retirar meu carro se não vender?',
                a: 'Sim. O contrato possui regras claras para rescisão. Geralmente, basta um aviso prévio simples caso você mude de ideia ou acabe o prazo acordado sem venda.',
              },
              {
                q: 'Como recebo o dinheiro?',
                a: 'Assim que o financiamento do comprador for aprovado e pago, ou o pagamento à vista for compensado, o valor é transferido diretamente para a sua conta bancária de forma segura.',
              },
              {
                q: 'Preciso estar presente na negociação?',
                a: 'Não. Nós cuidamos de toda a demonstração, test drive, documentação e negociação com os interessados. Você só é chamado para assinar a transferência no final.',
              },
              {
                q: 'E se o carro não vender em 30 dias?',
                a: 'Nós reavaliamos as condições de mercado com você. Se o preço estiver alinhado, continuamos a publicidade. Caso contrário, podemos ajustar a estratégia juntos.',
              },
            ].map((faq, i) => (
              <AccordionItem value={`item-${i}`} key={i}>
                <AccordionTrigger className="text-left font-bold">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 text-center bg-[#1A1A1A] text-white">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-display font-extrabold mb-4">
            Seu Carro Vale Mais do Que Você Imagina
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Pronto para consignar? Venda em dias com a Carro e Cia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-16 px-10 text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white"
              asChild
            >
              <a
                href="#processo"
                onClick={() => trackCTAClick('Iniciar Consignação Agora', '/consignacao')}
              >
                Iniciar Consignação Agora
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-16 px-10 text-lg bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              asChild
            >
              <a
                href={getWhatsAppLink('Olá Luiz, estou pronto para consignar meu carro.')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCTAClick('Falar com Luiz CTA Final', '/consignacao')}
              >
                Falar com Luiz
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
