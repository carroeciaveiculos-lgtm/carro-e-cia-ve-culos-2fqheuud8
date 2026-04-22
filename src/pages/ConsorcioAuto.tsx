import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Shield, Car, Check, X, Star, CreditCard, Clock, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ConsorcioAuto() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Consórcio de Carro',
        provider: {
          '@type': 'LocalBusiness',
          name: 'Km Zero Corretora de Seguros',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Uberaba',
            addressRegion: 'MG',
            addressCountry: 'BR',
          },
        },
      },
      {
        '@type': 'Person',
        name: 'Adriana Araújo',
        jobTitle: 'Corretora Especialista em Consórcios',
        worksFor: {
          '@type': 'Organization',
          name: 'Km Zero Corretora de Seguros',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Consórcio de veículo tem juros?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Não. O consórcio não tem juros. O custo é apenas a taxa de administração da administradora, diluída nas parcelas mensais. Em geral, essa taxa representa entre 15% e 20% do valor total do bem.',
            },
          },
          {
            '@type': 'Question',
            name: 'Posso usar meu carro atual como lance no consórcio?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sim. Esse é um dos maiores diferenciais da parceria entre a Km Zero e a Carro e Cia. Seu veículo atual é avaliado pela loja e pode ser oferecido como lance, aumentando suas chances de contemplação antecipada.',
            },
          },
          {
            '@type': 'Question',
            name: 'Quanto tempo leva para ser contemplado?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Depende do grupo e da estratégia de lance. Por sorteio, a contemplação pode ocorrer em qualquer mês — do primeiro ao último. Com lance bem planejado pela Adriana, muitos clientes são contemplados nos primeiros meses do grupo.',
            },
          },
          {
            '@type': 'Question',
            name: 'Qual o valor mínimo de parcela de um consórcio de carro?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Depende do valor do bem e do prazo escolhido. Para veículos a partir de R$40.000, parcelas a partir de R$450/mês são possíveis em prazos de 80 a 100 meses. Adriana simula o cenário ideal para seu orçamento.',
            },
          },
          {
            '@type': 'Question',
            name: 'Posso usar a carta de crédito para comprar um carro usado na Carro e Cia?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sim. A carta de crédito de consórcio pode ser usada para aquisição de veículos usados em lojas credenciadas. A Carro e Cia está preparada para receber cartas de crédito de consórcio — fale com o Luiz para verificar o veículo desejado no estoque.',
            },
          },
        ],
      },
    ],
  }

  const adrianaWpp =
    'https://wa.me/5534998037651?text=Olá Adriana! Quero simular um consórcio de veículo e entender como usar meu carro atual como lance.'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Consórcio de Carro em Uberaba | Km Zero Corretora"
        description="Faça um consórcio de veículo em Uberaba sem juros e sem entrada. Adriana Araújo — especialista Km Zero. Simule agora e use seu carro atual como lance."
        canonical="https://carroeciamotors.com.br/consorcio-auto"
        schema={schema}
      />

      {/* SEÇÃO 1 — HERO */}
      <section className="bg-slate-900 text-white py-16 md:py-24 px-4 text-center">
        <div className="container max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-bold tracking-wide text-orange-100 bg-orange-900/30 rounded-full border border-orange-800/50">
            <Shield className="w-4 h-4 mr-2 text-orange-400" />
            Parceria Carro e Cia Veículos × Km Zero Corretora
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white">
            Troque de carro sem pagar juros.
            <br className="hidden md:block" /> Use o seu atual como lance.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            O consórcio é a forma mais inteligente de planejar o próximo veículo. Com a Adriana
            Araújo, você ainda pode usar seu carro atual como lance — e sair do grupo antes de todo
            mundo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12">
            <Button
              asChild
              size="lg"
              className="text-base px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-xl font-bold shadow-lg"
            >
              <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                💬 Simular consórcio com a Adriana
              </a>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
            <span className="flex items-center">
              <Car className="w-4 h-4 mr-2 text-blue-500" /> Sem juros
            </span>
            <span className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-green-500" /> Use seu carro como lance
            </span>
            <span className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-purple-500" /> Sem entrada obrigatória
            </span>
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" /> +20 anos de mercado
            </span>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — O QUE É CONSÓRCIO DE VEÍCULO */}
      <section className="py-20 px-4 bg-white border-b border-slate-100">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Consórcio não é financiamento.
              <br />É planejamento inteligente.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">SEM JUROS</h3>
              <p className="text-slate-600 leading-relaxed">
                No consórcio, você paga apenas taxa de administração (em média 15% a 20% diluída nas
                parcelas) — sem juros de 1,8% ao mês como no financiamento convencional. Em 60
                meses, a diferença pode passar de R$20.000.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">CONTEMPLAÇÃO ESTRATÉGICA</h3>
              <p className="text-slate-600 leading-relaxed">
                Você pode ser contemplado por sorteio a qualquer mês ou usar um lance para
                antecipar. Com a orientação da Adriana, a estratégia de lance é planejada para
                maximizar suas chances de sair logo.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">USE SEU CARRO ATUAL</h3>
              <p className="text-slate-600 leading-relaxed">
                Seu veículo atual pode ser usado como lance em um grupo de consórcio. A Carro e Cia
                avalia seu carro e a Km Zero processa o lance — você troca de veículo com
                planejamento e sem comprometer o caixa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — COMPARATIVO INTELIGENTE */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Financiamento ou Consórcio? Entenda a diferença antes de decidir.
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl shadow-sm border border-slate-200 bg-white">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-r">Característica</th>
                  <th className="px-6 py-4 font-bold border-b border-r text-center text-slate-500">
                    Financiamento
                  </th>
                  <th className="px-6 py-4 font-bold border-b text-center text-orange-700 bg-orange-50/50">
                    Consórcio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium border-r">Juros mensais</td>
                  <td className="px-6 py-4 border-r text-center">1,4% a 2,8% ao mês</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20 font-bold text-green-600">
                    Nenhum
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium border-r">Taxa cobrada</td>
                  <td className="px-6 py-4 border-r text-center">Juros + IOF</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20">Taxa adm. 15-20% total</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium border-r">Veículo imediato</td>
                  <td className="px-6 py-4 border-r text-center">Sim</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20">Aguarda contemplação</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium border-r">Lance com veículo</td>
                  <td className="px-6 py-4 border-r text-center">Não</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20 font-bold text-green-600">
                    Sim ✓
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium border-r">Parcela</td>
                  <td className="px-6 py-4 border-r text-center">Maior</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20 font-bold text-green-600">
                    Menor
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium border-r">Ideal para</td>
                  <td className="px-6 py-4 border-r text-center">Preciso agora</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20 font-bold">
                    Posso planejar
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 font-bold">
                  <td className="px-6 py-4 border-r text-slate-800">Custo total (R$60k/60m)</td>
                  <td className="px-6 py-4 border-r text-center text-red-600">~R$85.000</td>
                  <td className="px-6 py-4 text-center bg-orange-50/20 text-green-600">
                    ~R$69.000
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-600 mb-4">
              "Não existe opção certa ou errada — existe a opção certa para o SEU momento. Adriana
              analisa seu perfil e indica o melhor caminho."
            </p>
            <Button
              asChild
              variant="outline"
              className="font-bold border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                Quero a indicação da Adriana →
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — COMO FUNCIONA O PROCESSO */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Do primeiro contato à chave na mão: como a Adriana cuida de tudo
            </h2>
          </div>

          <div className="relative border-l-2 border-orange-200 ml-4 md:mx-auto md:max-w-2xl">
            {/* 1 */}
            <div className="mb-10 relative pl-8">
              <div className="absolute -left-[17px] top-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-sm">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">SIMULAÇÃO PERSONALIZADA</h3>
              <p className="text-slate-600">
                Adriana simula diferentes cenários de prazo, parcela e estratégia de lance conforme
                o seu perfil e objetivo.
              </p>
            </div>
            {/* 2 */}
            <div className="mb-10 relative pl-8">
              <div className="absolute -left-[17px] top-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-sm">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ESCOLHA DO GRUPO</h3>
              <p className="text-slate-600">
                Seleção do grupo mais adequado: prazo, administradora, perfil dos participantes e
                histórico de contemplação.
              </p>
            </div>
            {/* 3 */}
            <div className="mb-10 relative pl-8">
              <div className="absolute -left-[17px] top-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-sm">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ESTRATÉGIA DE LANCE</h3>
              <p className="text-slate-600">
                Se você tem veículo para dar como lance, a Carro e Cia avalia o bem e a Km Zero
                estrutura o lance para maximizar suas chances de contemplação antecipada.
              </p>
            </div>
            {/* 4 */}
            <div className="mb-10 relative pl-8">
              <div className="absolute -left-[17px] top-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-sm">
                4
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">CONTEMPLAÇÃO</h3>
              <p className="text-slate-600">
                Ao ser contemplado — por sorteio ou lance — a carta de crédito é liberada para
                compra do veículo.
              </p>
            </div>
            {/* 5 */}
            <div className="relative pl-8">
              <div className="absolute -left-[17px] top-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-sm">
                5
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">COMPRA COM PARCERIA</h3>
              <p className="text-slate-600">
                Use sua carta de crédito para adquirir um veículo do estoque da Carro e Cia com toda
                a assessoria do Luiz Fernando.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — QUEM É ADRIANA ARAÚJO */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col md:flex-row border border-slate-100">
            <div className="md:w-5/12 bg-slate-200 aspect-square md:aspect-auto">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Adriana-foto-profissional.webp"
                alt="Adriana Araújo - Especialista em Consórcios"
                loading="lazy"
                width="600"
                height="600"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
                20 anos ajudando Uberaba a fazer escolhas financeiras mais inteligentes
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
                <p>
                  Adriana Araújo é corretora habilitada pela SUSEP desde 2003 e especialista em
                  consórcios há mais de duas décadas. Bacharel em Administração pela Uniube e
                  nutricionista pela UFTM, ela tem uma visão única: proteger o patrimônio é parte do
                  cuidado com a saúde — financeira e familiar.
                </p>
                <p>
                  Em sua trajetória, Adriana acompanhou centenas de famílias em Uberaba realizando o
                  sonho do carro novo com planejamento, sem comprometer a estabilidade financeira de
                  ninguém.
                </p>
                <p className="font-medium text-slate-800">
                  "Quando você fala com a Adriana, você está falando com alguém que vai entender sua
                  vida — não só vender uma cota."
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="self-start bg-[#25D366] hover:bg-[#20bd5a] text-white"
              >
                <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                  💬 Falar com a Adriana agora
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 6 — PROVA SOCIAL */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Quem planejou com a Adriana, realizou.
            </h2>
          </div>

          <div className="bg-orange-50 p-8 md:p-10 rounded-2xl border border-orange-100 max-w-3xl mx-auto relative">
            <div className="flex text-yellow-400 mb-6">
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
            </div>
            <p className="text-lg md:text-xl text-slate-800 mb-8 italic leading-relaxed">
              "A Adriana me ofereceu o consórcio há um ano, adquiri um consórcio de imóvel para
              comprar meu primeiro apartamento, foi a melhor decisão que já tomei"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center font-bold text-xl">
                A
              </div>
              <div>
                <p className="font-bold text-slate-900">Ana Flavia de Santi</p>
                <p className="text-sm text-slate-500">Cliente Km Zero</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 7 — FAQ */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Dúvidas sobre Consórcio de Veículo
            </h2>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <AccordionItem value="item-1" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Consórcio de veículo tem juros?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Não. O consórcio não tem juros. O custo é apenas a taxa de administração da
                administradora, diluída nas parcelas mensais. Em geral, essa taxa representa entre
                15% e 20% do valor total do bem.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Posso usar meu carro atual como lance no consórcio?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Sim. Esse é um dos maiores diferenciais da parceria entre a Km Zero e a Carro e Cia.
                Seu veículo atual é avaliado pela loja e pode ser oferecido como lance, aumentando
                suas chances de contemplação antecipada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Quanto tempo leva para ser contemplado?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Depende do grupo e da estratégia de lance. Por sorteio, a contemplação pode ocorrer
                em qualquer mês — do primeiro ao último. Com lance bem planejado pela Adriana,
                muitos clientes são contemplados nos primeiros meses do grupo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Qual o valor mínimo de parcela de um consórcio de carro?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Depende do valor do bem e do prazo escolhido. Para veículos a partir de R$40.000,
                parcelas a partir de R$450/mês são possíveis em prazos de 80 a 100 meses. Adriana
                simula o cenário ideal para seu orçamento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-none px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Posso usar a carta de crédito para comprar um carro usado na Carro e Cia?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Sim. A carta de crédito de consórcio pode ser usada para aquisição de veículos
                usados em lojas credenciadas. A Carro e Cia está preparada para receber cartas de
                crédito de consórcio — fale com o Luiz para verificar o veículo desejado no estoque.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* SEÇÃO 8 — CTA FINAL */}
      <section className="bg-orange-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Comece a planejar seu próximo carro hoje.
          </h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Simulação gratuita. Sem compromisso. Adriana responde no mesmo dia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              asChild
              size="lg"
              className="text-base px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-xl font-bold shadow-lg"
            >
              <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                💬 Simular agora com a Adriana
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-8 h-14 bg-transparent border-white text-white hover:bg-white hover:text-orange-700 w-full sm:w-auto rounded-xl font-bold"
            >
              <Link to="/estoque">Ver veículos disponíveis na Carro e Cia →</Link>
            </Button>
          </div>

          <div className="mt-16 pt-8 border-t border-orange-500/50 flex flex-col md:flex-row justify-center gap-6 text-sm">
            <Link
              to="/seguro-auto"
              className="text-orange-100 hover:text-white underline underline-offset-4"
            >
              seguro auto em Uberaba
            </Link>
            <Link
              to="/estoque"
              className="text-orange-100 hover:text-white underline underline-offset-4"
            >
              ver estoque de veículos
            </Link>
            <Link
              to="/blog/financiamento-veiculo-guia-completo"
              className="text-orange-100 hover:text-white underline underline-offset-4"
            >
              diferença entre financiamento e consórcio
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
