export function Partners() {
  const partners = [
    {
      name: 'Bradesco',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Bradesco.png',
    },
    {
      name: 'BV',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/BV.png',
    },
    {
      name: 'Porto Bank',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/PORTO%20BANK%20LOGO.png',
    },
    {
      name: 'Safra',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Safra.jpeg',
    },
    {
      name: 'Santander',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/santander.png',
    },
    {
      name: 'Km Zero',
      src: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Logo%20quadrado%20fundo%20branco%202%20transparente.png',
    },
  ]

  return (
    <section className="py-16 bg-background border-t border-b">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-10">Nossos Parceiros Financeiros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-70">
          {partners.map((p, i) => (
            <img
              key={i}
              src={p.src}
              alt={`${p.name} - Parceiro Carro e Cia`}
              width="200"
              height="80"
              loading="lazy"
              decoding="async"
              className="h-10 object-contain grayscale hover:grayscale-0 transition-all duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
