import { Star, MapPin, Clock, Phone } from 'lucide-react'

export function TestimonialsAndLocation() {
  const testimonials = [
    {
      text: 'Vendi meu carro em menos de 2 semanas! Processo seguro e com muita transparência. O Luiz e a equipe são excelentes.',
      author: 'Carlos H.',
      city: 'Uberaba',
    },
    {
      text: 'Comprei meu carro aqui e não me arrependo em nada. Procedência garantida e atendimento maravilhoso!',
      author: 'Mariana S.',
      city: 'Uberaba',
    },
    {
      text: 'O Luiz é um profissional incrível. Recomendo sem hesitar para qualquer pessoa que queira negociar um veículo.',
      author: 'Roberto M.',
      city: 'Patos de Minas',
    },
  ]

  const partners = [
    {
      name: 'Km Zero',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Logo%20quadrado%20fundo%20azul%20transparente.svg',
      highlight: true,
      url: 'https://kmzero.com.br',
    },
    {
      name: 'Bradesco',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Bradesco.png',
    },
    {
      name: 'BV Financeira',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/BV.png',
    },
    {
      name: 'Porto Bank',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/PORTO%20BANK%20LOGO.png',
    },
    {
      name: 'Banco Safra',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Safra.jpeg',
    },
    {
      name: 'Santander',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/santander.png',
    },
  ]

  return (
    <>
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-muted-foreground text-lg">
              A satisfação dos nossos clientes é a nossa maior conquista.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border shadow-sm relative">
                <div className="flex gap-1 text-accent mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg italic text-muted-foreground mb-8 leading-relaxed">
                  "{t.text}"
                </p>
                <div className="mt-auto">
                  <p className="font-bold text-foreground">{t.author}</p>
                  <p className="text-sm text-muted-foreground">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-y">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-12 text-muted-foreground">
            Nossos Parceiros Oficiais
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
            {partners.map((p, i) => (
              <a
                key={i}
                href={p.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex items-center justify-center ${p.highlight ? 'w-48 h-24' : 'w-32 h-16'} grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100`}
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
                {p.highlight && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Parceiro Oficial
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">
              Venha nos Fazer uma Visita
            </h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Endereço</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Av. Guilherme Ferreira, 1119
                    <br />
                    São Benedito, Uberaba - MG
                    <br />
                    CEP: 38022-200
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Horário de Funcionamento</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Segunda a Sexta: 08h às 18h
                    <br />
                    Sábado: 08h às 13h
                    <br />
                    Domingo: Fechado
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 bg-[#25D366]/10 rounded-full flex items-center justify-center text-[#25D366]">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">WhatsApp de Atendimento</h4>
                  <p className="text-muted-foreground">
                    <a
                      href="https://wa.me/5534999484285"
                      className="text-[#25D366] hover:underline font-medium text-lg"
                    >
                      (34) 99948-4285
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl h-[500px] border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3755.932468759535!2d-47.93268868461794!3d-19.76810008669527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bad00010839e0d%3A0xc3cf4813589b9d31!2sCarro%20%26%20Cia%20Ve%C3%ADculos!5e0!3m2!1spt-BR!2sbr!4v1714570198270!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </>
  )
}
