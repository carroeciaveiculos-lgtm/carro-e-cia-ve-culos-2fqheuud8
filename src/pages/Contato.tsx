import { MapPin, Phone, Mail, Instagram } from 'lucide-react'
import { LeadForm } from '@/components/LeadForm'

const Contato = () => {
  return (
    <div className="pt-24 pb-20">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mb-6">Fale Conosco</h1>
          <p className="text-xl text-muted-foreground">
            Estamos prontos para atender você. Tire dúvidas, agende uma visita ou faça uma proposta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-card p-6 rounded-xl border flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Telefone / WhatsApp</h3>
                <p className="text-muted-foreground">(34) 99999-9999</p>
                <p className="text-muted-foreground">(34) 3333-3333</p>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Endereço</h3>
                <p className="text-muted-foreground">
                  Av. Guilherme Ferreira, 1119
                  <br />
                  São Benedito, Uberaba - MG
                </p>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full shrink-0">
                <Instagram className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Instagram</h3>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  @carroecia02
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-muted/20 p-2 rounded-2xl">
            <LeadForm
              title="Envie uma mensagem"
              subtitle="Preencha os campos abaixo que retornaremos em breve."
              origem="Site - Contato"
            />
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg h-[500px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3753.8613134375845!2d-47.93510302488151!3d-19.760670981589335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bad0133c942df3%3A0xcda1909a34e0057b!2sAv.%20Guilherme%20Ferreira%2C%201119%20-%20S%C3%A3o%20Benedito%2C%20Uberaba%20-%20MG%2C%2038020-233!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  )
}

export default Contato
