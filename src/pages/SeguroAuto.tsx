import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Shield, Car, CloudRain, Wrench, HeartPulse, Users, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: Car,
    title: 'Roubo e Furto',
    color: 'text-red-600',
    bg: 'bg-red-50',
    desc: 'Em Uberaba, como em todo o Brasil, veículos são furtados diariamente. O seguro cobre o valor de mercado do veículo em caso de perda total.',
  },
  {
    icon: Shield,
    title: 'Colisão e Danos',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    desc: 'Um acidente pode acontecer com qualquer motorista. Cobertura de colisão garante reparo ou indenização sem comprometer seu orçamento.',
  },
  {
    icon: CloudRain,
    title: 'Danos por Fenômenos Naturais',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    desc: 'Granizo, alagamento, queda de árvore — eventos climáticos cobertos pelo seguro completo. Seu investimento protegido em qualquer situação.',
  },
  {
    icon: Wrench,
    title: 'Assistência 24h',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    desc: 'Pane, acidente ou emergência: carro reserva, guincho, assistência mecânica e suporte em qualquer rodovia do Brasil.',
  },
  {
    icon: HeartPulse,
    title: 'Seguro de Vida Incluso',
    color: 'text-green-600',
    bg: 'bg-green-50',
    desc: 'A maioria dos seguros auto inclui cobertura de vida para o condutor. Proteção dupla: veículo e família.',
  },
  {
    icon: Users,
    title: 'Proteção a Terceiros',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    desc: 'Em caso de acidente envolvendo terceiros, o seguro cobre danos materiais e corporais — evitando processos e prejuízos inesperados.',
  },
]

const FAQ = [
  {
    q: 'Quanto custa um seguro auto em Uberaba?',
    a: 'O valor varia conforme perfil do motorista, modelo do veículo e coberturas. A Km Zero faz cotação gratuita em 10+ seguradoras. Fale com Gabriel pelo WhatsApp.',
  },
  {
    q: 'Posso contratar seguro no mesmo dia que comprar o carro?',
    a: 'Sim. A parceria Carro e Cia + Km Zero permite que você saia da loja com o veículo novo e o seguro já ativo.',
  },
  {
    q: 'Quais seguradoras a Km Zero trabalha?',
    a: 'Porto Seguro, Bradesco Seguros, Allianz, Tokio Marine, Mapfre, Azul, Yelum, HDI, Suhai e BP Seguros.',
  },
  {
    q: 'Motorista com menos de 26 anos pode contratar?',
    a: 'Sim, mas o seguro tende a ter valor mais elevado para condutores jovens. A Adriana e o Gabriel orientam sobre as melhores opções para cada perfil de condutor.',
  },
  {
    q: 'O que é franquia e como ela afeta o valor do seguro?',
    a: 'Franquia é o valor que o segurado paga em caso de sinistro. Quanto maior a franquia que você aceita, menor tende a ser o prêmio do seguro. A Km Zero explica cada detalhe antes de você assinar.',
  },
]

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Seguro Auto em Uberaba',
      description:
        'Cotação e contratação de seguro automotivo em Uberaba MG pela Km Zero Corretora de Seguros, habilitada pela SUSEP desde 2003.',
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
        url: 'https://carroeciamotors.com.br/seguro-auto',
      },
      areaServed: { '@type': 'City', name: 'Uberaba' },
      serviceType: 'Seguro Automotivo',
    },
    {
      '@type': 'Person',
      name: 'Adriana Araújo',
      jobTitle: 'Corretora de Seguros',
      description:
        'Corretora habilitada pela SUSEP desde 2003 com mais de 20 anos de experiência em seguros e consórcios em Uberaba MG.',
      worksFor: { '@type': 'Organization', name: 'Km Zero Corretora de Seguros e Consórcios' },
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
          name: 'Seguro Auto',
          item: 'https://carroeciamotors.com.br/seguro-auto',
        },
      ],
    },
  ],
}

export default function SeguroAuto() {
  const gabrielWpp =
    'https://wa.me/5534992000300?text=Olá Gabriel! Comprei um veículo na Carro e Cia e quero cotar o seguro agora.'
  const adrianaWpp =
    'https://wa.me/5534998037651?text=Olá Adriana! Quero cotar o seguro do meu veículo.'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Seguro Auto em Uberaba | Km Zero Corretora de Seguros"
        description="Cote seu seguro auto em Uberaba com a Km Zero Corretora. Adriana Araújo — SUSEP desde 2003, 20+ anos de experiência. Atendimento humanizado, cotação em minutos. Fale agora."
        canonical="https://carroeciamotors.com.br/seguro-auto"
        image="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Adriana-foto-profissional.webp"
        schema={SCHEMA}
      />
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
          <span className="text-slate-800 font-medium">Seguro Auto</span>
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16 md:py-24 px-4 text-center">
        <div className="container max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-bold text-blue-100 bg-blue-900/30 rounded-full border border-blue-800/50">
            <Shield className="w-4 h-4 mr-2 text-blue-400" /> Parceria Carro e Cia Veículos × Km
            Zero Corretora
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white">
            Comprou seu carro. <br className="hidden md:block" /> Agora proteja.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-2xl mx-auto">
            Saia da Carro e Cia com seu veículo novo e com o seguro já contratado no mesmo dia. A Km
            Zero Corretora cuida de tudo — com quem realmente entende do assunto.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-blue-200 mb-10">
            <span>[20+] anos de SUSEP</span>
            <span>|</span>
            <span>[10] seguradoras parceiras</span>
            <span>|</span>
            <span>[⚡ Cotação] em minutos</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-2">
            <Button
              asChild
              size="lg"
              className="text-base px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-xl font-bold shadow-lg"
            >
              <a href={gabrielWpp} target="_blank" rel="noopener noreferrer">
                💬 Cotar seguro agora com Gabriel
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-8 h-14 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto rounded-xl font-bold"
            >
              <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                Prefiro falar com a Adriana →
              </a>
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            ⚡ Tempo médio de resposta: menos de 10 minutos
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            Quem cuida do seu seguro — Km Zero Corretora
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {[
              {
                img: 'Adriana-foto-profissional.webp',
                alt: 'Adriana Araújo — Corretora de Seguros SUSEP em Uberaba MG | Km Zero Corretora',
                name: 'Adriana Araújo',
                title: 'Corretora de Seguros Habilitada pela SUSEP desde 2003',
                desc: 'Adriana tem mais de 20 anos protegendo famílias e patrimônios em Uberaba. Bacharel em Administração pela Uniube e Nutricionista pela UFTM, ela combina visão estratégica e cuidado humano para encontrar o seguro ideal para cada cliente — não o mais barato, o mais adequado.',
                link: adrianaWpp,
              },
              {
                img: 'Gabriel-foto-profissional.webp',
                alt: 'Gabriel Araújo — Especialista em Seguro Auto | Km Zero Corretora Uberaba',
                name: 'Gabriel Araújo',
                title: 'Especialista em Seguro Auto | Km Zero Corretora',
                desc: 'Gabriel é o rosto digital da Km Zero. Ágil, atento e especializado em seguro auto, ele garante que você receba a melhor cotação com agilidade — sem burocracia, sem demora.',
                link: gabrielWpp,
              },
            ].map((p) => (
              <div
                key={p.name}
                className="flex flex-col sm:flex-row gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <img
                  src={`https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/${p.img}`}
                  alt={p.alt}
                  width="160"
                  height="160"
                  className="w-32 h-32 sm:w-40 sm:h-40 object-cover object-top rounded-full shadow-md border-4 border-white mx-auto sm:mx-0"
                  loading="lazy"
                />
                <div className="flex-1 text-center sm:text-left flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900">{p.name}</h3>
                  <p className="text-sm font-bold text-blue-600 mb-3">{p.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">"{p.desc}"</p>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto self-start bg-white hover:bg-slate-100"
                  >
                    <a href={p.link} target="_blank" rel="noopener noreferrer">
                      Falar com {p.name.split(' ')[0]} →
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            Por que contratar seguro auto em Uberaba?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div
                  className={`w-12 h-12 ${f.bg} ${f.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Seguradoras parceiras da Km Zero
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {[
              'Porto Seguro',
              'Bradesco',
              'Allianz',
              'Tokio Marine',
              'Mapfre',
              'Azul',
              'Yelum',
              'HDI',
              'Suhai',
              'BP',
            ].map((s) => (
              <div
                key={s}
                className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center grayscale hover:grayscale-0 transition-all"
              >
                <img
                  src={`https://img.usecurling.com/i?q=${s}&shape=outline`}
                  alt={`Logo ${s} — parceira Km Zero Corretora Uberaba MG`}
                  title={`${s} — Seguro Auto em Uberaba`}
                  className="max-h-10 object-contain"
                  width="120"
                  height="60"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50 border-y border-slate-200">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Como funciona a contratação do seguro
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: 1, t: 'Me chame no WhatsApp' },
              { num: 2, t: 'Coto nas 10 seguradoras parceiras' },
              { num: 3, t: 'Você escolhe a melhor cobertura' },
            ].map((s) => (
              <div
                key={s.num}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.t}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white text-center">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            O que dizem os clientes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: 'Lucas de Freitas',
                t: 'Fui atendida pelo Gabriel depois de comprar meu carro na Carro e Cia. Ele encontrou o melhor seguro em minutos. Saí protegida no mesmo dia!',
              },
              {
                n: 'Marcos Silva',
                t: 'A Adriana foi super atenciosa, explicou todas as coberturas e achou um seguro que cabia no meu bolso. Atendimento nota 10!',
              },
              {
                n: 'Rafael Mendes',
                t: 'Nunca tinha feito seguro antes e tinha muitas dúvidas. O Gabriel me atendeu super bem pelo WhatsApp e foi transparente.',
              },
            ].map((d) => (
              <div key={d.n} className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <div className="flex justify-center text-yellow-400 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-slate-700 mb-6 italic text-sm">"{d.t}"</p>
                <p className="font-bold text-slate-900 text-sm">{d.n}</p>
                <p className="text-xs text-slate-500">Uberaba, MG</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Perguntas frequentes sobre seguro auto
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-white rounded-xl shadow-sm border border-slate-200 text-left"
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

      <section className="py-20 px-4 bg-white">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Conheça também</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Link
              to="/consorcio-auto"
              className="block bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-500 transition-colors text-center sm:text-left"
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                🚗 Quer trocar de carro sem juros?
              </h3>
              <p className="text-slate-600 text-sm">
                Conheça o consórcio de veículo sem juros com a Adriana Araújo →
              </p>
            </Link>
            <Link
              to="/estoque"
              className="block bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-500 transition-colors text-center sm:text-left"
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                🔍 Procurando seu próximo veículo?
              </h3>
              <p className="text-slate-600 text-sm">
                Ver veículos disponíveis no estoque da Carro e Cia →
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Seu carro já tem dono. Agora dê a ele a proteção que merece.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Cotação gratuita. Sem compromisso. Resposta em minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              asChild
              size="lg"
              className="text-base px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-xl font-bold"
            >
              <a href={gabrielWpp} target="_blank" rel="noopener noreferrer">
                💬 Cotar agora com Gabriel
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-8 h-14 bg-transparent border-white text-white hover:bg-white hover:text-blue-700 w-full sm:w-auto rounded-xl font-bold"
            >
              <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                Prefiro falar com a Adriana
              </a>
            </Button>
          </div>
          <p className="text-sm text-blue-200 mb-8">
            ⚡ Tempo médio de resposta: menos de 10 minutos
          </p>
          <div className="mt-8 pt-8 border-t border-blue-500/50 flex flex-col md:flex-row justify-center gap-6 text-sm">
            <Link
              to="/consorcio-auto"
              className="text-blue-100 hover:text-white underline underline-offset-4"
            >
              consórcio de veículo sem juros
            </Link>
            <Link
              to="/estoque"
              className="text-blue-100 hover:text-white underline underline-offset-4"
            >
              ver veículos disponíveis
            </Link>
            <Link
              to="/blog/financiamento-veiculo-guia-completo"
              className="text-blue-100 hover:text-white underline underline-offset-4"
            >
              financiamento de veículo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
