export function Partners() {
  const partners = [
    {
      name: 'Bradesco',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Bradesco.webp',
    },
    {
      name: 'BV',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/BV.webp',
    },
    {
      name: 'Safra',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Safra.webp',
    },
    {
      name: 'Santander',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/santander.webp',
    },
    {
      name: 'Km Zero',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Logo-km-zero-fundo-transparente.webp',
    },
  ]

  return (
    <section className="py-16 bg-background border-t border-b">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-10">Nossos Parceiros Financeiros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-70">
          {partners.map((p, i) => (
            <picture key={i}>
              <source srcSet={p.src} type="image/webp" />
              <img
                src={p.src}
                alt={`Logo do banco parceiro ${p.name} - Carro e Cia Veículos`}
                width="200"
                height="80"
                loading="lazy"
                decoding="async"
                className="h-10 w-auto max-w-[200px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
              />
            </picture>
          ))}
        </div>
      </div>
    </section>
  )
}
