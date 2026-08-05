import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { handleImageError, CAR_PLACEHOLDER_IMAGE, getImageUrl } from '@/lib/image-utils'
import { buildVehicleTitle, getVersaoComplementar } from '@/lib/vehicle-title'
import { CalendarDays, Settings2, Fuel, Gauge } from 'lucide-react'

function getVehiclePhoto(fotos: any, emPreparacao: boolean): string {
  if (Array.isArray(fotos)) {
    const firstPhoto = fotos.find(
      (url: any) => typeof url === 'string' && !url.match(/\.(mp4|mov|webm|avi|mkv)$/i),
    )
    if (firstPhoto) return getImageUrl(firstPhoto)
  }
  if (emPreparacao) {
    return 'https://img.usecurling.com/p/400/300?q=car%20detailing%20workshop&color=gray'
  }
  return CAR_PLACEHOLDER_IMAGE
}

export function VehicleCard({ vehicle, priority = false }: { vehicle: any; priority?: boolean }) {
  const foto = getVehiclePhoto(vehicle.fotos, (vehicle as any).em_preparacao)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col w-full bg-card">
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        {vehicle.is_zero_km && (
          <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded shadow-sm">
            0 KM
          </div>
        )}
        {(vehicle as any).em_preparacao && (
          <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white px-2 py-1 text-xs font-bold rounded shadow-sm">
            Em Preparação
          </div>
        )}
        <Link to={`/estoque/${vehicle.slug || vehicle.id}`} className="w-full h-full block">
          <img
            src={foto}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="w-full h-full object-cover object-[center_65%] bg-muted group-hover:scale-105 transition-transform duration-500"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onError={(e) => handleImageError(e.currentTarget, `${vehicle.marca} ${vehicle.modelo}`)}
          />
        </Link>
      </div>
      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="mb-2">
          <h2 className="font-bold text-base leading-tight group-hover:text-primary transition-colors mb-2">
            {buildVehicleTitle([
              vehicle.marca,
              vehicle.modelo,
              getVersaoComplementar(vehicle.modelo, vehicle.versao),
            ])}
          </h2>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge
              variant="secondary"
              className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
            >
              <CalendarDays className="w-3 h-3" /> {vehicle.ano_fabricacao}/
              {vehicle.ano_modelo || vehicle.ano_fabricacao}
            </Badge>
            {vehicle.quilometragem != null && !vehicle.nao_exibir_km && (
              <Badge
                variant="secondary"
                className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
              >
                <Gauge className="w-3 h-3" />{' '}
                {Number(vehicle.quilometragem).toLocaleString('pt-BR')} KM
              </Badge>
            )}
            {vehicle.cambio && (
              <Badge
                variant="secondary"
                className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
              >
                <Settings2 className="w-3 h-3" /> {vehicle.cambio}
              </Badge>
            )}
            {vehicle.combustivel && (
              <Badge
                variant="secondary"
                className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
              >
                <Fuel className="w-3 h-3" /> {vehicle.combustivel}
              </Badge>
            )}
          </div>
        </div>
        <div className="bg-muted/40 p-2.5 rounded-lg mb-3 mt-auto">
          <p className="text-xl font-bold text-foreground m-0">
            {vehicle.preco_venda
              ? `R$ ${vehicle.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Consulte'}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full h-10 font-bold text-sm rounded-lg">
          <Link to={`/estoque/${vehicle.slug || vehicle.id}`}>Ver Detalhes</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
