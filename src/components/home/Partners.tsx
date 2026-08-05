import { useState } from 'react'

const FALLBACK_IMG = 'https://img.usecurling.com/p/200/80?q=bank%20logo&color=gray&dpr=2'

export function Partners() {
  const partners = [
    {
      name: 'Santander',
      src: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/parceiros/santander.webp',
    },
    {
      name: 'Safra',
      src: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/parceiros/Safra.webp',
    },
    {
      name: 'BV',
      src: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/parceiros/BV.webp',
    },
    {
      name: 'Bradesco',
      src: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/parceiros/Bradesco.webp',
    },
    {
      name: 'C6 Financeira',
      src: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/parceiros/C6-FINANCEIRA.webp',
    },
    {
      name: 'Km Zero',
      src: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/parceiros/Logo-km-zero-fundo-transparente.webp',
    },
  ]

  return (
    <section className="py-16 bg-background border-t border-b">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-10">Nossos Parceiros Financeiros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {partners.map((p, i) => (
            <PartnerLogo key={i} name={p.name} src={p.src} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerLogo({ name, src }: { name: string; src: string }) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <div className="h-14 w-[140px] flex items-center justify-center">
      <picture>
        <source srcSet={imgSrc} type="image/webp" />
        <img
          src={imgSrc}
          alt={`Logo do banco parceiro ${name} - Carro e Cia Veículos`}
          width="200"
          height="80"
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full w-auto h-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
      </picture>
    </div>
  )
}
