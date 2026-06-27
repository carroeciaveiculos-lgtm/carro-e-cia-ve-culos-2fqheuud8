import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getImageUrl } from '@/lib/image-utils'

export function VehicleCard({ vehicle }: { vehicle: any }) {
  const foto =
    vehicle.fotos && vehicle.fotos.length > 0
      ? getImageUrl(vehicle.fotos[0])
      : getImageUrl('fotos/modelo-veiculo.webp')

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col w-full bg-card">
      <div className="relative w-full h-[240px] bg-muted group-hover:scale-105 transition-transform duration-500">
        {vehicle.is_zero_km && (
          <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded shadow-sm">
            0 KM
          </div>
        )}
        <Link to={`/estoque/${vehicle.id}`} className="w-full h-full block">
          <img
            src={foto}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="w-full h-full object-cover bg-muted"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = 'https://img.usecurling.com/p/400/300?q=car'
            }}
          />
        </Link>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-3">
            {vehicle.marca} {vehicle.modelo} {vehicle.versao}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs font-normal">
              Ano {vehicle.ano_modelo || vehicle.ano_fabricacao}
            </Badge>
            {vehicle.combustivel && (
              <Badge variant="secondary" className="text-xs font-normal">
                {vehicle.combustivel}
              </Badge>
            )}
            {vehicle.cor && (
              <Badge variant="secondary" className="text-xs font-normal">
                {vehicle.cor}
              </Badge>
            )}
          </div>
        </div>
        <div className="bg-muted/40 p-3 rounded-lg mb-4 mt-auto">
          <p className="text-2xl font-bold text-[#25D366] m-0">
            {vehicle.preco_venda
              ? `R$ ${vehicle.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Consulte'}
          </p>
        </div>
        <Button
          asChild
          className="w-full h-10 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-lg"
        >
          <a
            href={`https://wa.me/5534999484285?text=${encodeURIComponent(`Olá! Vi o ${vehicle.marca} ${vehicle.modelo} no site por R$ ${vehicle.preco_venda}. Ainda está disponível?`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            CHAMAR NO WHATSAPP
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
