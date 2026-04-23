import { Link } from 'react-router-dom'
import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-16 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="mb-6 text-left md:text-center">
              <picture className="inline-block mb-2">
                <source
                  media="(max-width: 480px)"
                  srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  type="image/webp"
                />
                <source
                  media="(min-width: 481px)"
                  srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  type="image/webp"
                />
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                  alt="Carro e Cia"
                  loading="lazy"
                  width="150"
                  height="60"
                  className="max-w-full h-12 md:h-16 object-contain"
                />
              </picture>
            </div>
            <p className="text-muted-foreground mb-6">
              Mais de 20 anos de experiência realizando sonhos e garantindo negócios seguros em
              Uberaba e região.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/carroecia02"
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
            <h3 className="font-display font-bold text-xl mb-6 text-white">Links Rápidos</h3>
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
                  Consignação Segura
                </Link>
              </li>
              <li>
                <Link
                  to="/servicos"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Nossos Serviços
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/sobre"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  A História de Luiz Fernando
                </Link>
              </li>
              <li>
                <Link
                  to="/contato"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl mb-6 text-white">Parceiros</h3>
            <ul className="flex flex-wrap gap-4 items-center mb-6">
              <li>
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Bradesco.webp"
                  alt="Bradesco"
                  className="h-6 filter grayscale invert opacity-70 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </li>
              <li>
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/BV.webp"
                  alt="BV"
                  className="h-6 filter grayscale invert opacity-70 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </li>
              <li>
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Safra.webp"
                  alt="Safra"
                  className="h-6 filter grayscale invert opacity-70 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </li>
              <li>
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/santander.webp"
                  alt="Santander"
                  className="h-6 filter grayscale invert opacity-70 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl mb-6 text-white">Contato</h3>
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
                <Phone className="w-5 h-5 text-[#25D366] shrink-0" />
                <div className="flex flex-col text-muted-foreground">
                  <a
                    href="https://wa.me/5534999484285"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Luiz (Vendas): (34) 99948-4285
                  </a>
                  <a
                    href="https://wa.me/5534992000300"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Gabriel (Seguros): (34) 99200-0300
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a
                  href="mailto:contato@carroeciamotors.com.br"
                  className="text-muted-foreground hover:text-white"
                >
                  contato@carroeciamotors.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-12 border-t border-border/50 pt-12">
          <div className="rounded-xl overflow-hidden shadow-lg mb-6">
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
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Carro e Cia Veículos. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/politica-de-privacidade" className="hover:text-white">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
