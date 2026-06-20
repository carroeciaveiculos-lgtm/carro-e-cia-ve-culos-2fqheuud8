import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Car, Clock, ShieldCheck, Star } from 'lucide-react'

export function HomeInfo() {
  const [vehicleCount, setVehicleCount] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchCount = async () => {
      try {
        // Ensuring head: true to only get count without body data
        const { count, error } = await supabase
          .from('veiculos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'disponivel')

        if (error) throw error

        if (isMounted) setVehicleCount(count ?? 0)
      } catch (err) {
        console.error('Erro na contagem de veículos:', err)
        // Fallback state for graceful recovery
        if (isMounted) setVehicleCount(0)
      }
    }
    fetchCount()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="py-16 bg-muted/30 border-y">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-sm border transition-shadow hover:shadow-md">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-foreground">
              {vehicleCount !== null ? vehicleCount : '...'}
            </h3>
            <p className="text-muted-foreground font-medium">Veículos em Estoque</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-sm border transition-shadow hover:shadow-md">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-foreground">+20 Anos</h3>
            <p className="text-muted-foreground font-medium">De Mercado em Uberaba</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-sm border transition-shadow hover:shadow-md">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-foreground">100%</h3>
            <p className="text-muted-foreground font-medium">Venda Segura</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-sm border transition-shadow hover:shadow-md">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-foreground">48h</h3>
            <p className="text-muted-foreground font-medium">Venda Rápida</p>
          </div>
        </div>
      </div>
    </section>
  )
}
