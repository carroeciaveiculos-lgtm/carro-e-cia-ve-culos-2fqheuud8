import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Shield, Car, CloudRain, Wrench, HeartPulse, Users, Check, X, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SeguroAuto() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Seguro Auto',
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
        jobTitle: 'Corretora de Seguros Habilitada SUSEP',
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
            name: 'Quanto custa um seguro auto em Uberaba?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'O valor varia conforme o perfil do motorista, modelo do veículo, CEP de pernoite e coberturas escolhidas. A Km Zero faz a cotação em múltiplas seguradoras para encontrar o melhor custo-benefício para o seu perfil. Em média, seguros básicos partem de R$150/mês e completos de R$300/mês para veículos populares. Fale com o Gabriel para uma cotação personalizada.',
            },
          },
          {
            '@type': 'Question',
            name: 'Posso contratar o seguro no mesmo dia que comprar o veículo na Carro e Cia?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sim. Essa é justamente a proposta da parceria entre a Carro e Cia Veículos e a Km Zero Corretora. Você escolhe o veículo, fecha o negócio com o Luiz e a equipe da Km Zero faz a cotação e contratação antes de você sair da loja.',
            },
          },
          {
            '@type': 'Question',
            name: 'Quais seguradoras a Km Zero trabalha?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A Km Zero é corretora independente e trabalha com as principais seguradoras do mercado, garantindo cotação em múltiplas operadoras para o melhor preço e cobertura.',
            },
          },
          {
            '@type': 'Question',
            name: 'Motorista com menos de 26 anos pode contratar?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sim, mas o seguro tende a ter valor mais elevado para condutores jovens. A Adriana e o Gabriel orientam sobre as melhores opções para cada perfil de condutor.',
            },
          },
          {
            '@type': 'Question',
            name: 'O que é franquia e como ela afeta o valor do seguro?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Franquia é o valor que o segurado paga em caso de sinistro. Quanto maior a franquia que você aceita, menor tende a ser o prêmio do seguro. A Km Zero explica cada detalhe antes de você assinar.',
            },
          },
        ],
      },
    ],
  }

  const gabrielWpp =
    'https://wa.me/5534992000300?text=Olá Gabriel! Comprei um veículo na Carro e Cia e quero cotar o seguro agora.'
  const adrianaWpp =
    'https://wa.me/5534998037651?text=Olá Adriana! Quero cotar o seguro do meu veículo.'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Seguro Auto em Uberaba | Km Zero Corretora de Seguros"
        description="Cote seu seguro auto em Uberaba com a Km Zero Corretora. Adriana Araújo — 20+ anos SUSEP. Atendimento humanizado, cotação rápida e proteção completa. Fale agora."
        canonical="https://carroeciamotors.com.br/seguro-auto"
        schema={schema}
      />

      {/* SEÇÃO 1 — HERO */}
      <section className="bg-slate-900 text-white py-16 md:py-24 px-4 text-center">
        <div className="container max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-bold tracking-wide text-blue-100 bg-blue-900/30 rounded-full border border-blue-800/50">
            <Shield className="w-4 h-4 mr-2 text-blue-400" />
            Parceria Carro e Cia Veículos × Km Zero Corretora
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white">
            Comprou seu carro. <br className="hidden md:block" /> Agora proteja.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Saia da Carro e Cia com seu veículo novo e com o seguro já contratado no mesmo dia. A Km
            Zero Corretora cuida de tudo — com quem realmente entende do assunto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12">
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
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
            <span className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-blue-500" /> Habilitada SUSEP desde 2003
            </span>
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" /> +20 anos protegendo Uberaba
            </span>
            <span className="flex items-center">
              <CloudRain className="w-4 h-4 mr-2 text-cyan-500" /> Cotação em minutos
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-green-500" /> Atendimento 100% humanizado
            </span>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — QUEM CUIDA DO SEU SEGURO */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Você não está falando com um robô.
              <br />
              Está falando com quem tem 20 anos de experiência.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Adriana */}
            <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 mx-auto sm:mx-0">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Adriana-foto-profissional.webp"
                  alt="Adriana Araújo - CEO da Km Zero Corretora de Seguros"
                  loading="lazy"
                  width="160"
                  height="160"
                  className="w-full h-full object-cover object-top rounded-full shadow-md border-4 border-white"
                />
              </div>
              <div className="flex-1 text-center sm:text-left flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900">Adriana Araújo</h3>
                <p className="text-sm font-bold text-blue-600 mb-3">
                  Corretora de Seguros Habilitada pela SUSEP desde 2003
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  "Adriana tem mais de 20 anos protegendo famílias e patrimônios em Uberaba.
                  Bacharel em Administração pela Uniube e Nutricionista pela UFTM, ela combina visão
                  estratégica e cuidado humano para encontrar o seguro ideal para cada cliente — não
                  o mais barato, o mais adequado."
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto self-start bg-white hover:bg-slate-100"
                >
                  <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                    Falar com a Adriana →
                  </a>
                </Button>
              </div>
            </div>

            {/* Gabriel */}
            <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 mx-auto sm:mx-0">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp/Gabriel-foto-profissional.webp"
                  alt="Gabriel - Equipe Carro e Cia Veículos"
                  loading="lazy"
                  width="160"
                  height="160"
                  className="w-full h-full object-cover object-top rounded-full shadow-md border-4 border-white"
                />
              </div>
              <div className="flex-1 text-center sm:text-left flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900">Gabriel Araújo</h3>
                <p className="text-sm font-bold text-blue-600 mb-3">
                  Especialista em Seguro Auto | Km Zero Corretora
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  "Gabriel é o rosto digital da Km Zero. Ágil, atento e especializado em seguro
                  auto, ele garante que você receba a melhor cotação com agilidade — sem burocracia,
                  sem demora."
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto self-start bg-white hover:bg-slate-100"
                >
                  <a href={gabrielWpp} target="_blank" rel="noopener noreferrer">
                    Falar com o Gabriel →
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — POR QUE CONTRATAR */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Seu carro vale quanto você pagou por ele.
              <br />
              Você não pode arriscar.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Roubo e Furto</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Em Uberaba, como em todo o Brasil, veículos são furtados diariamente. O seguro cobre
                o valor de mercado do veículo em caso de perda total.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Colisão e Danos</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Um acidente pode acontecer com qualquer motorista. Cobertura de colisão garante
                reparo ou indenização sem comprometer seu orçamento.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <CloudRain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Danos por Fenômenos Naturais
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Granizo, alagamento, queda de árvore — eventos climáticos cobertos pelo seguro
                completo. Seu investimento protegido em qualquer situação.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Assistência 24h</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Pane, acidente ou emergência: carro reserva, guincho, assistência mecânica e suporte
                em qualquer rodovia do Brasil.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Seguro de Vida Incluso</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A maioria dos seguros auto inclui cobertura de vida para o condutor. Proteção dupla:
                veículo e família.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Proteção a Terceiros</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Em caso de acidente envolvendo terceiros, o seguro cobre danos materiais e corporais
                — evitando processos e prejuízos inesperados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — DIFERENCIAIS */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              A vantagem de resolver tudo no mesmo lugar
            </h2>
          </div>

          <div className="relative">
            {/* Linha vertical desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>

            <div className="space-y-12">
              {/* Passo 1 */}
              <div className="relative flex flex-col md:flex-row items-center md:justify-between w-full">
                <div className="md:w-5/12 text-center md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">PASSO 1 🚗</h3>
                  <p className="font-bold text-blue-600 mb-2">
                    Escolha seu veículo no estoque da Carro e Cia
                  </p>
                  <p className="text-sm text-slate-600">
                    Mais de 20 anos de mercado. Veículos com procedência, documentação verificada e
                    histórico conferido.
                  </p>
                </div>
                <div className="z-10 flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-sm text-white font-bold mb-4 md:mb-0">
                  1
                </div>
                <div className="md:w-5/12"></div>
              </div>

              {/* Passo 2 */}
              <div className="relative flex flex-col md:flex-row items-center md:justify-between w-full">
                <div className="md:w-5/12 hidden md:block"></div>
                <div className="z-10 flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-sm text-white font-bold mb-4 md:mb-0">
                  2
                </div>
                <div className="md:w-5/12 text-center md:text-left mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">PASSO 2 💰</h3>
                  <p className="font-bold text-blue-600 mb-2">
                    Financie ou consigne com o Luiz Fernando
                  </p>
                  <p className="text-sm text-slate-600">
                    Simule o financiamento, use seu carro atual como entrada ou consigne para vender
                    mais rápido.
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="relative flex flex-col md:flex-row items-center md:justify-between w-full">
                <div className="md:w-5/12 text-center md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">PASSO 3 🔒</h3>
                  <p className="font-bold text-blue-600 mb-2">
                    Contrate o seguro com a Km Zero antes de sair
                  </p>
                  <p className="text-sm text-slate-600">
                    Gabriel ou Adriana fazem a cotação na hora. Você sai da loja com o carro e com o
                    seguro ativo.
                  </p>
                </div>
                <div className="z-10 flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-sm text-white font-bold mb-4 md:mb-0">
                  3
                </div>
                <div className="md:w-5/12"></div>
              </div>

              {/* Passo 4 */}
              <div className="relative flex flex-col md:flex-row items-center md:justify-between w-full">
                <div className="md:w-5/12 hidden md:block"></div>
                <div className="z-10 flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-sm text-white font-bold mb-4 md:mb-0">
                  4
                </div>
                <div className="md:w-5/12 text-center md:text-left mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">PASSO 4 ✅</h3>
                  <p className="font-bold text-blue-600 mb-2">Pronto. Patrimônio protegido.</p>
                  <p className="text-sm text-slate-600">
                    Do estoque ao seguro, tudo em Uberaba, com quem você já conhece e confia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — TIPOS DE COBERTURA */}
      <section className="py-20 px-4 bg-slate-50 border-y border-slate-200">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Qual cobertura é certa para o seu perfil?
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl shadow-sm border border-slate-200 bg-white">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-r">Cobertura</th>
                  <th className="px-6 py-4 font-bold border-b border-r text-center">Básico</th>
                  <th className="px-6 py-4 font-bold border-b border-r text-center">
                    Intermediário
                  </th>
                  <th className="px-6 py-4 font-bold border-b text-center text-blue-700 bg-blue-50/50">
                    Completo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Roubo e Furto', b: true, i: true, c: true },
                  { name: 'Colisão', b: false, i: true, c: true },
                  { name: 'Fenômenos Naturais', b: false, i: true, c: true },
                  { name: 'Assistência 24h', b: true, i: true, c: true },
                  { name: 'Carro Reserva', b: false, i: false, c: true },
                  { name: 'Danos a Terceiros', b: true, i: true, c: true },
                  { name: 'Cobertura de Vida', b: false, i: true, c: true },
                  { name: 'Proteção Vidros', b: false, i: false, c: true },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium border-r">{item.name}</td>
                    <td className="px-6 py-4 border-r text-center">
                      {item.b ? (
                        <Check className="w-5 h-5 mx-auto text-green-500" />
                      ) : (
                        <X className="w-5 h-5 mx-auto text-slate-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 border-r text-center">
                      {item.i ? (
                        <Check className="w-5 h-5 mx-auto text-green-500" />
                      ) : (
                        <X className="w-5 h-5 mx-auto text-slate-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center bg-blue-50/20">
                      {item.c ? (
                        <Check className="w-5 h-5 mx-auto text-blue-600" />
                      ) : (
                        <X className="w-5 h-5 mx-auto text-slate-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-600 mb-4">
              "A Adriana analisa seu perfil e recomenda a cobertura ideal. Sem empurrar o mais caro
              — o mais adequado para você."
            </p>
            <Button
              asChild
              variant="outline"
              className="font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <a href={adrianaWpp} target="_blank" rel="noopener noreferrer">
                Quero a indicação da Adriana →
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 6 — PROVA SOCIAL */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              O que dizem os clientes que já protegem seu veículo com a Km Zero
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Depoimento 1 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
              <div className="flex text-yellow-400 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-700 mb-6 italic leading-relaxed">
                "Comprei meu carro na Carro e Cia e o Gabriel me ajudou a cotar o seguro na mesma
                hora. Saí com tudo resolvido em menos de 2 horas. Recomendo demais!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  M
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Marcos Silva</p>
                  <p className="text-xs text-slate-500">Uberaba, MG</p>
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
              <div className="flex text-yellow-400 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-700 mb-6 italic leading-relaxed">
                "A Adriana foi super atenciosa, explicou todas as coberturas e achou um seguro que
                cabia no meu bolso. Atendimento nota 10!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                  L
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Letícia Costa</p>
                  <p className="text-xs text-slate-500">Uberaba, MG</p>
                </div>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
              <div className="flex text-yellow-400 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-700 mb-6 italic leading-relaxed">
                "Nunca tinha feito seguro antes e tinha muitas dúvidas. O Gabriel me atendeu super
                bem pelo WhatsApp e foi super transparente. Muito satisfeito."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold">
                  R
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Rafael Mendes</p>
                  <p className="text-xs text-slate-500">Uberaba, MG</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10 flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
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

      {/* SEÇÃO 7 — FAQ */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Dúvidas sobre seguro auto em Uberaba
            </h2>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <AccordionItem value="item-1" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Quanto custa um seguro auto em Uberaba?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                O valor varia conforme o perfil do motorista, modelo do veículo, CEP de pernoite e
                coberturas escolhidas. A Km Zero faz a cotação em múltiplas seguradoras para
                encontrar o melhor custo-benefício para o seu perfil. Em média, seguros básicos
                partem de R$150/mês e completos de R$300/mês para veículos populares. Fale com o
                Gabriel para uma cotação personalizada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Posso contratar o seguro no mesmo dia que comprar o veículo na Carro e Cia?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Sim. Essa é justamente a proposta da parceria entre a Carro e Cia Veículos e a Km
                Zero Corretora. Você escolhe o veículo, fecha o negócio com o Luiz e a equipe da Km
                Zero faz a cotação e contratação antes de você sair da loja.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Quais seguradoras a Km Zero trabalha?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                A Km Zero é corretora independente e trabalha com as principais seguradoras do
                mercado, garantindo cotação em múltiplas operadoras para o melhor preço e cobertura.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                Motorista com menos de 26 anos pode contratar?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Sim, mas o seguro tende a ter valor mais elevado para condutores jovens. A Adriana e
                o Gabriel orientam sobre as melhores opções para cada perfil de condutor.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-none px-6">
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline py-5">
                O que é franquia e como ela afeta o valor do seguro?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                Franquia é o valor que o segurado paga em caso de sinistro. Quanto maior a franquia
                que você aceita, menor tende a ser o prêmio do seguro. A Km Zero explica cada
                detalhe antes de você assinar.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* SEÇÃO 8 — CTA FINAL */}
      <section className="bg-blue-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Seu carro já tem dono. Agora dê a ele a proteção que merece.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Cotação gratuita. Sem compromisso. Resposta em minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              asChild
              size="lg"
              className="text-base px-8 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full sm:w-auto rounded-xl font-bold shadow-lg"
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

          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-blue-200">
            <span>SUSEP</span>
            <span>•</span>
            <span>20 anos de mercado</span>
            <span>•</span>
            <span>Uberaba MG</span>
          </div>

          <div className="mt-16 pt-8 border-t border-blue-500/50 flex flex-col md:flex-row justify-center gap-6 text-sm">
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
