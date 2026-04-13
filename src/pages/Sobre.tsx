import { mockTeam } from '@/lib/mock-data'

const Sobre = () => {
  return (
    <div className="pt-24 pb-20">
      {/* History Section */}
      <section className="container mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display font-extrabold text-4xl mb-6">Nossa História</h1>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Fundada em 2004, a Carro e Cia Veículos nasceu com um propósito claro: trazer
                transparência e confiança para o mercado de seminovos em Uberaba.
              </p>
              <p>
                Começamos pequenos, mas com uma visão grande. Acreditamos que comprar um carro é a
                realização de um sonho e a venda de um, o início de um novo projeto. Nosso papel é
                ser a ponte segura entre essas duas pontas.
              </p>
              <p>
                Hoje, com mais de 20 anos de tradição, nos orgulhamos de ter ajudado milhares de
                famílias e de sermos referência em consignação e venda de veículos premium e
                populares na região do Triângulo Mineiro.
              </p>
            </div>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://img.usecurling.com/p/800/600?q=dealership&color=gray"
              alt="Loja Carro e Cia"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-secondary text-secondary-foreground py-20 mb-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="font-display font-bold text-2xl mb-4 text-primary">Missão</h3>
              <p className="text-gray-300">
                Oferecer soluções automotivas seguras, conectando pessoas através de negócios
                transparentes e justos.
              </p>
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl mb-4 text-primary">Visão</h3>
              <p className="text-gray-300">
                Ser a marca mais lembrada e confiável no mercado de veículos seminovos de Minas
                Gerais.
              </p>
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl mb-4 text-primary">Valores</h3>
              <p className="text-gray-300">
                Transparência absoluta, respeito ao cliente, excelência no atendimento e inovação
                constante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-3xl mb-4">Nossa Equipe</h2>
          <p className="text-muted-foreground">
            Profissionais dedicados e apaixonados pelo que fazem, prontos para te atender.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockTeam.map((member, i) => (
            <div key={i} className="text-center group">
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden mb-4 border-4 border-background shadow-lg group-hover:border-primary transition-colors">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-bold text-lg">{member.name}</h4>
              <p className="text-sm text-primary font-medium">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Sobre
