import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, ChevronRight } from 'lucide-react'
import { getImageUrl, handleImageError } from '@/lib/image-utils'

export function HomeFeatures() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, versao, ano_fabricacao, combustivel, cor, preco_venda, quilometragem, fotos, is_zero_km',
      )
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setVehicles(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <section className="py-20 bg-muted/30 border-y border-border/50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Veículos em Destaque
            </h2>
            <p className="text-muted-foreground text-lg">
              Confira nossas melhores ofertas disponíveis no momento.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/estoque">
              Ver todo o estoque <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-80 animate-pulse bg-muted/50 border-0" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed shadow-sm">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Nenhum veículo encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Entre em contato para pedidos especiais. Nós ajudamos você a encontrar o seu carro.
            </p>
            <Button asChild>
              <Link to="/contato">Fale com nosso time</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => {
              const foto =
                v.fotos && v.fotos.length > 0
                  ? getImageUrl(v.fotos[0], 'media', { width: 400 })
                  : getImageUrl('fotos/modelo-veiculo.webp', 'media', { width: 400 })
              return (
                <Card
                  key={v.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col w-full bg-card"
                >
                  <div className="relative w-full h-[240px] bg-muted overflow-hidden">
                    {v.is_zero_km && (
                      <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded">
                        0 KM
                      </div>
                    )}
                    <Link to={`/estoque/${v.id}`} className="w-full h-full block">
                      <img
                        src={foto}
                        alt={`${v.marca} ${v.modelo}`}
                        className="w-full h-full object-cover bg-muted group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e.currentTarget, `${v.marca} ${v.modelo}`)}
                      />
                    </Link>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1 mb-2">
                        {v.marca} {v.modelo}
                      </h3>
                      <p className="text-[13px] text-muted-foreground line-clamp-1 mb-1">
                        Ano: {v.ano_fabricacao} | {v.combustivel || 'N/I'}
                      </p>
                      <p className="text-[13px] text-muted-foreground line-clamp-1">
                        Km: {v.quilometragem?.toLocaleString('pt-BR') || 0}
                      </p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg mb-4 mt-auto">
                      <p className="text-2xl font-bold text-[#25D366] m-0">
                        {v.preco_venda
                          ? `R$ ${v.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Consulte'}
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full h-10 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-lg"
                    >
                      <a
                        href={`https://wa.me/5534997384177?text=${encodeURIComponent(`Olá! Vi o ${v.marca} ${v.modelo} no site por R$ ${v.preco_venda}. Ainda está disponível?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        CHAMAR VENDEDOR
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
