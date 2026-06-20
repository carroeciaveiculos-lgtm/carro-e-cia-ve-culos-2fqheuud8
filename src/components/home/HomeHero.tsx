import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Search, CarFront, ShieldCheck } from 'lucide-react'

export function HomeHero() {
  const [vehicleCount, setVehicleCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchCount = async () => {
      try {
        setIsLoading(true)
        // HEAD request to get exact count without fetching rows
        const { count, error } = await supabase
          .from('veiculos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'disponivel')

        if (error) throw error

        if (isMounted) {
          // Correctly handle the count property instead of looking for body in data
          setVehicleCount(count ?? 0)
        }
      } catch (err) {
        console.error('Erro ao buscar contagem de veículos:', err)
        // Fallback state for graceful error recovery to prevent UI crashes
        if (isMounted) setVehicleCount(0)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchCount()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-16 md:pt-32 md:pb-24 border-b">
      <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-900/[0.04] dark:bg-bottom" />
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors border-primary/20 bg-primary/10 text-primary mb-6">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Consignação Segura em Uberaba
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6">
            Venda seu carro rápido e seguro
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Avaliação grátis, contrato protegido e transparência total.
            {isLoading ? (
              <span className="animate-pulse"> Verificando estoque...</span>
            ) : vehicleCount !== null && vehicleCount > 0 ? (
              <span>
                {' '}
                Mais de <strong>{vehicleCount} veículos</strong> disponíveis!
              </span>
            ) : (
              <span> Confira nossas opções de compra e venda.</span>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8">
              <Link to="/estoque">
                <Search className="mr-2 h-5 w-5" />
                Ver Estoque ({isLoading ? '...' : vehicleCount})
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto h-12 px-8 border-primary text-primary hover:bg-primary/5"
            >
              <Link to="/consignacao">
                <CarFront className="mr-2 h-5 w-5" />
                Vender Meu Veículo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
