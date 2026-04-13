import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Fuel, Settings, Gauge } from 'lucide-react'

interface VehicleProps {
  vehicle: {
    id: string
    brand: string
    model: string
    version: string
    year: string
    km: number
    price: number
    type: string
    images: string[]
    transmission: string
    fuel: string
  }
}

export function VehicleCard({ vehicle }: VehicleProps) {
  return (
    <Link to={`/estoque/${vehicle.id}`}>
      <Card className="overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <Badge
            variant={vehicle.type === 'consignado' ? 'secondary' : 'default'}
            className="absolute top-3 left-3 shadow-md"
          >
            {vehicle.type === 'consignado' ? 'Consignado' : 'Próprio'}
          </Badge>
        </div>
        <CardContent className="p-5">
          <div className="mb-2">
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{vehicle.version}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground my-4">
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>{vehicle.year}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>{vehicle.km.toLocaleString('pt-BR')} km</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="font-display font-bold text-xl text-foreground">
              R$ {vehicle.price.toLocaleString('pt-BR')}
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
