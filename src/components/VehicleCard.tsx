import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Fuel, Settings, Gauge } from 'lucide-react'
import { Veiculo } from '@/services/veiculos'

export function VehicleCard({ vehicle }: { vehicle: Veiculo }) {
  const images = (vehicle.fotos as string[]) || ['https://img.usecurling.com/p/800/600?q=car']
  const price = vehicle.preco_venda || 0

  return (
    <Link to={`/estoque/${vehicle.id}`}>
      <Card className="overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 bg-card h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted shrink-0">
          <img
            src={images[0]}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          {vehicle.is_consignado && (
            <Badge className="absolute top-3 left-3 shadow-md bg-accent text-accent-foreground hover:bg-accent/90">
              Consignado
            </Badge>
          )}
        </div>
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="mb-2">
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {vehicle.marca} {vehicle.modelo}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{vehicle.versao}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground my-4">
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>
                {vehicle.ano_fabricacao}/{vehicle.ano_modelo}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>{(vehicle.quilometragem || 0).toLocaleString('pt-BR')} km</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
            <span className="font-display font-bold text-xl text-foreground">
              R$ {price.toLocaleString('pt-BR')}
            </span>
            <span className="text-primary text-sm font-medium group-hover:underline">
              Ver detalhes
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
