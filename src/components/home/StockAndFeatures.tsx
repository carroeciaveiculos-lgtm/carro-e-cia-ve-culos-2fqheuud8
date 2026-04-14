import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { VehicleCard } from '@/components/VehicleCard'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, MapPin, Search, Star } from 'lucide-react'

export function StockAndFeatures() {
  const [vehicles, setVehicles] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setVehicles(data)
      })
  }, [])

  return (
    <>
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Veículos em Destaque
              </h2>
              <p className="text-muted-foreground text-lg">
                Confira as últimas novidades que acabaram de chegar em nosso estoque.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="shrink-0 h-12 px-8">
              <Link to="/estoque">Ver Todo o Estoque</Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
            {vehicles.length === 0 && (
              <div className="col-span-full bg-muted/30 border border-dashed rounded-xl text-center py-16 text-muted-foreground">
                <p className="text-lg">Carregando nosso estoque atualizado...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 border-y">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-14 text-center">
            Por que nos Escolher?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Star,
                t: '+20 anos no mercado',
                d: 'Tradição e confiança consolidadas em Uberaba e região.',
              },
              {
                icon: MapPin,
                t: 'Localização privilegiada',
                d: 'Estamos na Av. Guilherme Ferreira, 1119 - São Benedito.',
              },
              {
                icon: Search,
                t: 'Transparência total',
                d: 'Clareza e segurança em cada etapa da sua negociação.',
              },
              {
                icon: CheckCircle2,
                t: 'Procedência garantida',
                d: 'Centenas de veículos vendidos com 100% de satisfação.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-card p-8 rounded-xl border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-5">
                  <f.icon className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-lg mb-3">{f.t}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
