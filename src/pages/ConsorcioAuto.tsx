import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Shield, Car, CreditCard, Clock, RefreshCw, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQ = [
  {
    q: 'Consórcio de carro tem juros?',
    a: 'Não. O consórcio não cobra juros. O custo é apenas a taxa de administração (15% a 20% total), muito inferior ao financiamento convencional.',
  },
  {
    q: 'Posso usar meu carro atual como lance no consórcio?',
    a: 'Sim. A Carro e Cia avalia seu veículo e a Km Zero estrutura o lance para maximizar suas chances de contemplação.',
  },
  {
    q: 'Quanto tempo leva para ser contemplado?',
    a: 'Depende do grupo e da estratégia de lance. Por sorteio, a contemplação pode ocorrer em qualquer mês — do primeiro ao último. Com lance bem planejado pela Adriana, muitos clientes são contemplados nos primeiros meses do grupo.',
  },
  {
    q: 'Qual o valor mínimo de parcela de um consórcio de carro?',
    a: 'Depende do valor do bem e do prazo escolhido. Para veículos a partir de R$40.000, parcelas a partir de R$450/mês são possíveis em prazos de 80 a 100 meses. Adriana simula o cenário ideal para seu orçamento.',
  },
  {
    q: 'Posso usar a carta de crédito para comprar um carro usado na Carro e Cia?',
    a: 'Sim. A Carro e Cia aceita cartas de crédito de consórcio para aquisição de veículos usados do estoque.',
  },
]

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Consórcio de Veículo em Uberaba',
      description:
        'Consultoria e contratação de consórcio automotivo em Uberaba MG pela Km Zero Corretora, com estratégia de lance usando veículo atual como oferta.',
      provider: {
        '@type': 'LocalBusiness',
        name: 'Km Zero Corretora de Seguros e Consórcios',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Uberaba',
          addressRegion: 'MG',
          addressCountry: 'BR',
        },
        telephone: '+5534998037651',
      },
      areaServed: {
        '@type': 'City',
        name: 'Uberaba',
      },
      serviceType: 'Consórcio Automotivo',
    },
    {
      '@type': 'Person',
      name: 'Adriana Araújo',
      jobTitle: 'Consultora de Consórcios',
      description:
        'Especialista em planejamento financeiro automotivo com 20+ anos ajudando famílias em Uberaba a conquistar veículos com inteligência e sem juros.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: 'https://carroeciamotors.com.br',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Nossos Serviços',
          item: 'https://carroeciamotors.com.br/#servicos',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Consórcio Auto',
          item: 'https://carroeciamotors.com.br/consorcio-auto',
        },
      ],
    },
  ],
}

export default function ConsorcioAuto() {
  const adrianaWpp =
    'https://wa.me/5534998037651?text=Olá Adriana! Quero simular um consórcio de veículo e entender como usar meu carro atual como lance.'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Consórcio de Carro em Uberaba | Km Zero Corretora"
        description="Faça seu consórcio de veículo em Uberaba sem juros. Adriana Araújo — Km Zero Corretora. Use seu carro atual como lance e realize seu próximo veículo com planejamento."
        canonical="https://carroeciamotors.com.br/consorcio-auto"
        image="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Adriana-foto-profissional.webp"
        schema={SCHEMA}
      />

      {/* BREADCRUMB */}
      <div className="bg-slate-100 py-3 px-4 border-b border-slate-200 hidden md:block">
        <div className="container max-w-6xl mx-auto flex text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">
            Início
          </Link>
          <span className="mx-2">›</span>
          <Link to="/#servicos" className="hover:text-blue-600">
            Nossos Serviços
          </Link>
          <span className="mx-2">›</span>
          <span className="text-slate-800 font-medium">Consórcio Auto</span>
        </div>
      </div>

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
          <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            O consórcio é a forma mais inteligente de planejar o próximo veículo. Com a Adriana
            Araújo, você ainda pode usar seu carro atual como lance — e sair do grupo antes de todo
            mundo.
          </p>

          {/* NÚMEROS DE AUTORIDADE */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-orange-200 mb-10">
            <span>[20+] anos de experiência</span>
            <span>|</span>
            <span>[2] administradoras</span>
            <span>|</span>
            <span>[🚗 Lance] com seu carro atual</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-2">
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
          <p className="text-sm text-slate-400 mt-2">
            ⚡ Tempo médio de resposta: menos de 10 minutos
          </p>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400 mt-10">
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
              O que é consórcio de veículo e como funciona
            </h2>
            <p className="text-lg text-slate-600">
              Consórcio não é financiamento. É planejamento inteligente.
            </p>
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
              Financiamento ou consórcio: qual é melhor para você?
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

      {/* SEÇÃO 4 — COMO FUNCIONA */}
      <section className="py-20 px-4 bg-white border-y border-slate-200">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Como funciona a contratação do consórcio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: 1, t: 'Adriana simula seu perfil' },
              { num: 2, t: 'Escolhemos o grupo ideal' },
              { num: 3, t: 'Você é contemplado e compra o veículo' },
            ].map((s) => (
              <div
                key={s.num}
                className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-800">{s.t}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — QUEM É ADRIANA ARAÚJO */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            Quem cuida do seu consórcio — Km Zero Corretora
          </h2>
          <div className="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col md:flex-row border border-slate-100">
            <div className="md:w-5/12 bg-slate-200 aspect-square md:aspect-auto">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Adriana-foto-profissional.webp"
                alt="Adriana Araújo — Corretora de Seguros SUSEP em Uberaba MG | Km Zero Corretora"
                title="Adriana Araújo — Consultora de Consórcios em Uberaba"
                loading="lazy"
                width="600"
                height="600"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">
                20 anos ajudando Uberaba a fazer escolhas financeiras mais inteligentes
              </h3>
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
                <p className="font-medium text-slate-800 italic">
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

      {/* SEÇÃO 6 — ADMINISTRADORAS PARCEIRAS */}
      <section className="py-20 px-4 bg-white text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Administradoras parceiras da Km Zero
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-center items-center">
            {['Porto Consorcios', 'Ademicon'].map((s) => (
              <div
                key={s}
                className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center grayscale hover:grayscale-0 transition-all col-span-1"
              >
                <picture>
                  <source
                    srcSet={`https://img.usecurling.com/i?q=${s}&shape=outline`}
                    type="image/webp"
                  />
                  <img
                    src={`https://img.usecurling.com/i?q=${s}&shape=outline`}
                    alt={`Logo ${s} — parceira Km Zero Corretora Uberaba MG`}
                    title={`${s} — Consórcio em Uberaba`}
                    className="max-h-12 object-contain"
                    width="140"
                    height="70"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 7 — PROVA SOCIAL */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Prova social: quem planejou com a Adriana, realizou
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm md:col-start-2">
              <div className="flex justify-center text-yellow-400 mb-4">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 mb-6 italic text-base leading-relaxed">
                "A Adriana me ofereceu o consórcio há um ano, adquiri um consórcio para comprar meu
                primeiro imóvel/veículo, foi a melhor decisão que já tomei"
              </p>
              <p className="font-bold text-slate-900 text-sm">Ana Flavia de Santi</p>
              <p className="text-xs text-slate-500">Uberaba, MG</p>
            </div>
          </div>
          <div className="mt-8 text-center flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Avaliações verificadas Google
          </div>
        </div>
      </section>

      {/* SEÇÃO 8 — FAQ */}
      <section className="py-20 px-4 bg-white border-t border-slate-200">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Perguntas frequentes sobre consórcio de carro
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-slate-50 rounded-xl shadow-sm border border-slate-200 text-left"
          >
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b px-6">
                <AccordionTrigger className="font-bold text-slate-800 hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* SEÇÃO 9 — CONHEÇA TAMBÉM */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Conheça também</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Link
              to="/seguro-auto"
              className="block bg-white p-6 rounded-2xl border border-slate-200 hover:border-orange-500 transition-colors text-center sm:text-left shadow-sm"
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">🔒 Já tem seu veículo?</h3>
              <p className="text-slate-600 text-sm">
                Proteja com seguro auto em Uberaba pela Km Zero →
              </p>
            </Link>
            <Link
              to="/estoque"
              className="block bg-white p-6 rounded-2xl border border-slate-200 hover:border-orange-500 transition-colors text-center sm:text-left shadow-sm"
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">🚗 Já foi contemplado?</h3>
              <p className="text-slate-600 text-sm">
                Encontre seu veículo no estoque de veículos disponíveis da Carro e Cia →
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* SEÇÃO 10 — CTA FINAL */}
      <section className="bg-orange-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Comece a planejar seu próximo carro hoje.
          </h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Simulação gratuita. Sem compromisso. Adriana responde no mesmo dia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
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
          <p className="text-sm text-orange-200 mb-8">
            ⚡ Tempo médio de resposta: menos de 10 minutos
          </p>

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
              to="/blog/emprestimo-com-garantia-veiculo"
              className="text-orange-100 hover:text-white underline underline-offset-4"
            >
              crédito com veículo de garantia
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
