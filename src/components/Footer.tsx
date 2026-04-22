import { Link } from 'react-router-dom'
import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-16 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-display font-bold text-xl mb-6">Carro e Cia Veículos</h3>
            <p className="text-muted-foreground mb-6">
              Mais de 20 anos de experiência realizando sonhos e garantindo negócios seguros em
              Uberaba e região.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/carroecia02"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                aria-label="Visitar página do Instagram da Carro e Cia"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/carroeciaosmelhoresveiculos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                aria-label="Visitar página do Facebook da Carro e Cia"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl mb-6">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/estoque"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Estoque de Veículos
                </Link>
              </li>
              <li>
                <Link
                  to="/consignacao"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Consignação
                </Link>
              </li>
              <li>
                <Link
                  to="/financiamento-auto"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Financiamento
                </Link>
              </li>
              <li>
                <Link
                  to="/seguro-auto"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Seguro Auto
                </Link>
              </li>
              <li>
                <Link
                  to="/contato"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl mb-6">Contato</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  Av. Guilherme Ferreira, 1119
                  <br />
                  São Benedito
                  <br />
                  Uberaba - MG · CEP 38022-200
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-muted-foreground">WhatsApp: (34) 99948-4285</span>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-muted-foreground">contato@carroeciamotors.com.br</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-12 border-t border-border/50 pt-12">
          <div className="rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)] mb-6">
            <iframe
              title="Mapa de Localização da Carro e Cia Veículos em Uberaba"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3754.8879051323597!2d-47.93789018845835!3d-19.759916581513842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bad1b54ff23a55%3A0x1d3108bae712d85d!2sCarro%20e%20Cia%20Com%C3%A9rcio%20de%20Ve%C3%ADculos!5e0!3m2!1spt-BR!2sbr!4v1776692231909!5m2!1spt-BR!2sbr"
              width="100%"
              height="280"
              className="border-0"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>📍 Av. Guilherme Ferreira, 1119 - São Benedito, Uberaba - MG · CEP 38022-200</p>
            <p>⏰ Seg a Sex: 8h às 18h | Sábado: 8h às 13h</p>
            <p className="font-medium text-primary">📱 WhatsApp: (34) 99948-4285</p>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Carro e Cia Veículos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
