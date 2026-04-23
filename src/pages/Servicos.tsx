import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick } from '@/lib/tracking'

export default function Servicos() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Serviços Carro e Cia | Consignação, Compra, Financiamento, Seguros',
    description:
      'Serviços completos: consignação, compra segura, financiamento, seguros com Km Zero. Tudo em um lugar. Carro e Cia.',
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title="Serviços Carro e Cia | Consignação, Compra, Financiamento, Seguros"
        description="Serviços completos: consignação, compra segura, financiamento, seguros com Km Zero. Tudo em um lugar. Carro e Cia."
        schema={schema}
        canonical="https://carroeciamotors.com.br/servicos"
      />

      <section className="container max-w-5xl mx-auto px-4 mb-20 text-center">
        <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-6">O Que Oferecemos</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Soluções Completas Para Vender e Comprar Carros
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" asChild>
            <a href="#consignacao">Consignação</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#compra">Compra</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#financiamento">Financiamento</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#seguros">Km Zero Seguros</a>
          </Button>
        </div>
      </section>

      {/* Consignação */}
      <section id="consignacao" className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao.webp"
                alt="Consignação Segura"
                className="rounded-2xl shadow-xl w-full"
                loading="lazy"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-display font-bold">Consignação: Venda Segura</h2>
              <p className="text-lg text-muted-foreground">
                Venda em dias, não em meses. Contrato protetor. Você não se preocupa.
              </p>
              <ul className="space-y-3">
                {[
                  'Venda rápida (média 15 dias)',
                  'Contrato protetor',
                  'Avaliação profissional',
                  'Marketing em 3 plataformas',
                  'Zero burocracia',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link
                    to="/consignacao"
                    onClick={() => trackCTAClick('Saiba Mais Consignação', '/servicos')}
                  >
                    Saiba Mais
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a
                    href={getWhatsAppLink('Quero consignar meu carro.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consignar Agora
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compra Segura */}
      <section id="compra" className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <h2 className="text-3xl font-display font-bold">
                Compra Segura: Carros com Procedência
              </h2>
              <p className="text-lg text-muted-foreground">
                Compre com confiança. Procedência verificada. Segurança jurídica garantida.
              </p>
              <ul className="space-y-3">
                {[
                  'Procedência verificada (RENAVAM + CHASSIS)',
                  'Inspeção profissional',
                  'Sem histórico de sinistros graves',
                  'Carros com melhor custo-benefício',
                  'Financiamento facilitado',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link to="/estoque" onClick={() => trackCTAClick('Ver Estoque', '/servicos')}>
                    Ver Estoque
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a
                    href={getWhatsAppLink('Quero comprar um carro.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar com Luiz
                  </a>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp"
                alt="Compra Segura"
                className="rounded-2xl shadow-xl w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Financiamento */}
      <section id="financiamento" className="py-16 bg-[#1A1A1A] text-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-white p-8 rounded-2xl mb-8 w-fit shadow-xl">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Logo-km-zero-fundo-transparente.webp"
                  alt="Km Zero"
                  className="h-16"
                  loading="lazy"
                />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">
                Financiamento Seguro com Km Zero
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Parceria com principais bancos. Taxa competitiva. Aprovação rápida.
              </p>
              <div className="flex flex-wrap gap-4 mb-8 bg-white/5 p-4 rounded-xl items-center justify-center">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Bradesco.webp"
                  alt="Bradesco"
                  className="h-8 object-contain filter brightness-0 invert"
                  loading="lazy"
                />
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/BV.webp"
                  alt="BV"
                  className="h-8 object-contain filter brightness-0 invert"
                  loading="lazy"
                />
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Safra.webp"
                  alt="Safra"
                  className="h-8 object-contain filter brightness-0 invert"
                  loading="lazy"
                />
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/santander.webp"
                  alt="Santander"
                  className="h-8 object-contain filter brightness-0 invert"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="space-y-6">
              <ul className="space-y-3">
                {[
                  'Principais bancos do Brasil',
                  'Taxa competitiva',
                  'Aprovação em 48h',
                  'Simulador online gratuito',
                  'Gabriel (especialista) disponível',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 pt-4">
                <Button size="lg" className="bg-[#25D366] hover:bg-[#20bd5a]" asChild>
                  <a
                    href={getWhatsAppLink('Quero simular financiamento.', '5534992000300')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCTAClick('Simular Financiamento', '/servicos')}
                  >
                    Simular Agora
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 hover:bg-white/10"
                  asChild
                >
                  <a
                    href={getWhatsAppLink(
                      'Olá Gabriel, preciso de ajuda com financiamento.',
                      '5534992000300',
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar com Gabriel
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seguros */}
      <section id="seguros" className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <h2 className="text-3xl font-display font-bold">Km Zero Seguros e Consórcios</h2>
              <p className="text-lg text-muted-foreground">
                20+ anos de expertise. Adriana e Gabriel: especialistas em proteção.
              </p>
              <ul className="space-y-3">
                {[
                  'Seguro Auto Completo',
                  'Consórcios Veículos',
                  'Seguro Vida',
                  'Seguro Residencial',
                  'Responsabilidade Civil',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 pt-4">
                <Button size="lg" asChild>
                  <a
                    href="https://www.kmzero.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCTAClick('Cotar Seguro', '/servicos')}
                  >
                    Cotar Seguro
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a
                    href={getWhatsAppLink('Quero fazer seguro.', '5534992000300')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contato Gabriel
                  </a>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="bg-muted p-12 rounded-full shadow-inner">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Logo-km-zero-fundo-transparente.webp"
                  alt="Km Zero Seguros"
                  className="w-48 h-48 object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20 border-y border-border/50 text-center">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-12">Por Que Escolher Carro e Cia?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl mb-4 font-black text-primary">1</div>
              <h3 className="font-bold text-lg mb-2">20+ Anos</h3>
              <p className="text-sm text-muted-foreground">Solidez. Confiança. Referência.</p>
            </div>
            <div>
              <div className="text-4xl mb-4 font-black text-primary">2</div>
              <h3 className="font-bold text-lg mb-2">Luiz Fernando</h3>
              <p className="text-sm text-muted-foreground">Dedicado. Apaixonado. Humanizado.</p>
            </div>
            <div>
              <div className="text-4xl mb-4 font-black text-primary">3</div>
              <h3 className="font-bold text-lg mb-2">Transparência Total</h3>
              <p className="text-sm text-muted-foreground">Sem surpresas. Contrato protetor.</p>
            </div>
            <div>
              <div className="text-4xl mb-4 font-black text-primary">4</div>
              <h3 className="font-bold text-lg mb-2">Soluções Completas</h3>
              <p className="text-sm text-muted-foreground">Vender, comprar, financiar, segurar.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-8">Qual Serviço Você Precisa?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-14 px-6 text-base" asChild>
              <Link
                to="/consignacao"
                onClick={() => trackCTAClick('Consignar Carro CTA Bottom', '/servicos')}
              >
                Consignar Carro
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="h-14 px-6 text-base" asChild>
              <Link to="/estoque">Comprar Carro</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-6 text-base" asChild>
              <a
                href={getWhatsAppLink('Financiar', '5534992000300')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Financiar
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-6 text-base" asChild>
              <a href="https://www.kmzero.com.br" target="_blank" rel="noopener noreferrer">
                Segurar
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
