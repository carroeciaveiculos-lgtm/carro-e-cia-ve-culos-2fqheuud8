import { Instagram, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const testimonials = [
  {
    name: 'Carlos Mendes',
    text: 'Deixei meu Corolla lá e em menos de 10 dias venderam. Super indico, o Luiz é muito transparente e o processo todo foi tranquilo.',
    rating: 5,
  },
  {
    name: 'Ana Paula Silva',
    text: 'Tentei vender meu carro particular por meses e só aparecia golpista. Na Carro e Cia resolveram rápido e com total segurança.',
    rating: 5,
  },
  {
    name: 'Roberto Alves',
    text: 'Atendimento excelente! Pegaram meu carro, avaliaram bem e ainda cuidaram de toda a papelada de transferência. Recomendo.',
    rating: 5,
  },
]

export function HomeSocial() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-6 animate-fade-in-up">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Quem confia, <span className="text-primary">recomenda</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Veja o que nossos clientes dizem sobre a experiência de negociar com a Carro e Cia.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-2">
            <a
              href="https://www.instagram.com/carroecia02"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-4 h-4" /> Siga nosso Instagram
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-secondary/20 p-6 rounded-2xl border border-border/50 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {testimonial.name.charAt(0)}
                </div>
                <span className="font-semibold text-foreground">{testimonial.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
