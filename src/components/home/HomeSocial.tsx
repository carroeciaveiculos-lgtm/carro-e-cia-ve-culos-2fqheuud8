import { Instagram } from 'lucide-react'

export function HomeSocial() {
  return (
    <section className="py-16 bg-muted/10 border-y border-border/50">
      <div className="container text-center max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-2xl text-white mb-6 shadow-lg">
          <Instagram className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-4">Acompanhe nosso dia a dia</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Siga nosso Instagram para ver novidades, bastidores e entregas reais da loja.
        </p>
        <a
          href="https://instagram.com/carroeciamotors"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-primary hover:underline text-lg"
        >
          @carroeciamotors
        </a>
      </div>
    </section>
  )
}
