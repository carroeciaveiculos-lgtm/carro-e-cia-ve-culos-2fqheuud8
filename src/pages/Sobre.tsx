import { Clock, Users, ShieldCheck, Target, Heart, Lightbulb } from 'lucide-react'
import { SEO } from '@/components/SEO'

export default function Sobre() {
  const team = [
    {
      name: 'Luiz Fernando',
      role: 'CEO',
      photo:
        'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Luiz%20Fernando%20foto%20profissional.jpeg',
      bio: 'Com mais de 20 anos de experiência, Luiz é a alma da Carro e Cia. Sua paixão por veículos e seu carisma garantem a melhor experiência para cada cliente.',
    },
    {
      name: 'Roberto Junior',
      role: 'Vendedor',
      photo:
        'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Roberto%20Junior%20foto%20profissional.jpeg',
      bio: 'Irmão de Luiz Fernando, Roberto é o braço direito nas vendas. Com sua energia e conhecimento, ele ajuda a encontrar o veículo perfeito para você.',
    },
    {
      name: 'Jessica Germano',
      role: 'Financeiro',
      photo:
        'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/jessica%20foto%20profissional.jpeg',
      bio: 'Jessica cuida de toda a parte financeira, garantindo que cada transação seja clara, segura e sem burocracia para nossos clientes.',
    },
    {
      name: 'Adriana Araújo',
      role: 'Administrativa',
      photo:
        'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Adriana%20foto%20profissional.jpeg',
      bio: 'Com sua expertise administrativa, Adriana organiza e otimiza os processos internos, assegurando a eficiência e a qualidade do nosso atendimento.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Sobre Nós | Carro e Cia Veículos"
        description="Conheça a Carro e Cia Veículos. Mais de 20 anos de experiência no mercado automóvel. Referência em confiança e qualidade em Uberaba."
      />
      <section className="relative pt-24 pb-32 overflow-hidden bg-secondary text-white">
        <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent z-10" />
        <div className="container relative z-20 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-6 leading-tight">
            Mais de 20 Anos de <span className="text-primary">Confiança em Uberaba</span>
          </h1>
          <p className="text-xl text-gray-300">
            Conheça a história da Carro e Cia Veículos e a equipe que faz a diferença.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Clock className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Nossa Trajetória: Paixão por Veículos e Pessoas
            </h2>
          </div>
          <div className="prose prose-lg text-muted-foreground leading-relaxed">
            <p>
              Luiz Fernando, CEO da Carro e Cia Veículos, começou sua jornada no mundo automotivo há
              mais de 20 anos, não como proprietário, mas como um vendedor apaixonado. Durante 4
              anos, ele mergulhou no mercado, aprendendo cada detalhe e construindo uma reputação de
              honestidade e dedicação.
            </p>
            <p>
              A oportunidade de ser sócio em uma nova loja surgiu, e Luiz a abraçou com a mesma
              paixão. Desde então, nunca mais deixou de trabalhar com veículos, transformando sua
              expertise e carisma em um negócio sólido.
            </p>
            <p>
              Hoje, Luiz Fernando lidera a Carro e Cia Veículos, sua própria loja em Uberaba, com a
              missão de oferecer veículos de qualidade e procedência, e de conectar pessoas ao carro
              certo, com segurança e confiança. Sua empresa é um reflexo de sua dedicação e do
              brilho de um vendedor nato que entende e acolhe a dor de cada cliente, sempre buscando
              a melhor solução.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50 border-y">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Conheça Quem Faz a Carro e Cia Acontecer
            </h2>
            <p className="text-muted-foreground text-lg">
              Uma equipe dedicada a realizar o seu sonho com transparência e agilidade.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border"
              >
                <div className="aspect-square bg-muted">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-bold text-xl mb-1 font-display">{member.name}</h3>
                  <p className="text-primary font-medium mb-4">{member.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-14 text-center">
            Nossos Pilares
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl border text-center shadow-sm">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-4">Missão</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conectar pessoas ao veículo ideal, oferecendo soluções completas de compra, venda e
                consignação com segurança, transparência e excelência no atendimento.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border text-center shadow-sm">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-4">Visão</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ser a principal referência em veículos usados de qualidade e procedência em Uberaba
                e região, expandindo nossa atuação e consolidando a confiança de nossos clientes.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border text-center shadow-sm">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-4">Valores</h3>
              <p className="text-muted-foreground leading-relaxed">
                Confiança, Transparência, Respeito, Excelência, Inovação e Paixão por Veículos e por
                Pessoas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
