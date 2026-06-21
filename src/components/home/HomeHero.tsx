import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Search, CarFront, ShieldCheck } from 'lucide-react'

import { getImageUrl } from '@/lib/image-utils'

export function HomeHero() {
  const [vehicleCount, setVehicleCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [banner, setBanner] = useState<any>(null)

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

    const fetchBanner = async () => {
      try {
        const { data } = await supabase
          .from('site_banners')
          .select('*')
          .eq('ativo', true)
          .order('ordem', { ascending: true })
          .limit(1)
          .single()
        if (data && isMounted) {
          setBanner(data)
        }
      } catch (err) {
        console.error('Erro ao buscar banner:', err)
      }
    }

    fetchCount()
    fetchBanner()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-16 md:pt-32 md:pb-24 border-b">
      {banner && banner.imagem_url && (
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
          <img
            src={getImageUrl(banner.imagem_url)}
            alt={banner.titulo || 'Banner Carro e Cia'}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}
      <div className="absolute inset-0 z-0 bg-grid-slate-100/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-900/[0.04] dark:bg-bottom" />
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mx-auto max-w-7xl">
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors border-primary/20 bg-primary/10 text-primary mb-6">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Consignação Segura em Uberaba
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6">
              Venda seu carro rápido e seguro
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
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

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
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

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="aspect-[4/3] sm:aspect-video lg:aspect-[4/3] relative overflow-hidden rounded-2xl border shadow-2xl bg-muted">
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
                alt="Fachada da Loja Carro e Cia Motors"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.opacity = '0'
                }}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
            </div>

            {/* Decorative background blur element */}
            <div className="absolute -z-10 -inset-4 bg-primary/20 blur-3xl rounded-[3rem] opacity-50 dark:opacity-20 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}
