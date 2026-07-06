import { useState, useEffect } from 'react'
import { Star, MapPin, Clock, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export function TestimonialsAndLocation() {
  const [testimonials, setTestimonials] = useState<
    Database['public']['Tables']['site_depoimentos']['Row'][]
  >([])

  useEffect(() => {
    supabase
      .from('site_depoimentos')
      .select('*')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTestimonials(data)
        } else {
          setTestimonials([
            {
              texto: 'Excelente loja, pessoal muito educado e atenciosos.',
              nome_cliente: 'Rodrigo Carvalho Gomide',
              tipo: 'Local Guide',
              estrelas: 5,
              id: 'fallback-1',
              foto_url: null,
              publicado: true,
              verificado: true,
              created_at: null,
            },
          ])
        }
      })
  }, [])

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
          <div className="flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {testimonials.map((t, i) => (
              <div
                key={t.id || i}
                className="bg-card p-8 rounded-2xl border shadow-sm relative shrink-0 w-[85vw] md:w-[350px] snap-center flex flex-col"
              >
                <div className="flex gap-1 text-accent mb-6">
                  {Array.from({ length: t.estrelas || 5 }).map((_, s) => (
                    <Star key={s} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg italic text-muted-foreground mb-8 leading-relaxed flex-1">
                  "{t.texto}"
                </p>
                <div className="mt-auto flex items-center gap-3">
                  {t.foto_url ? (
                    <img
                      src={t.foto_url}
                      alt={t.nome_cliente || 'Cliente'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {t.nome_cliente?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-foreground">{t.nome_cliente}</p>
                    <p className="text-sm text-muted-foreground">{t.tipo}</p>
                  </div>
                </div>
              </div>
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
                  <h3 className="font-bold text-lg mb-1">Endereço</h3>
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
                  <h3 className="font-bold text-lg mb-1">Horário de Funcionamento</h3>
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
                  <h3 className="font-bold text-lg mb-1">WhatsApp de Atendimento</h3>
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
              title="Mapa de localização da Carro e Cia Veículos"
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
