import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { VehicleCard } from '@/components/VehicleCard'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, MapPin, Search, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function StockAndFeatures() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setVehicles(data)
        setLoading(false)
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
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col space-y-3 bg-card rounded-lg overflow-hidden border p-0"
                >
                  <Skeleton className="h-[250px] w-full rounded-none" />
                  <div className="p-5 space-y-4 flex flex-col flex-grow">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="mt-auto pt-4">
                      <Skeleton className="h-8 w-1/3 mb-4" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : vehicles.length === 0 ? (
              <div className="col-span-full bg-muted/30 border border-dashed rounded-xl text-center py-16 text-muted-foreground">
                <p className="text-lg">Nenhum veículo encontrado no momento.</p>
              </div>
            ) : (
              vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)
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
