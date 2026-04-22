import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function VehicleCard({ vehicle, isList = false }: { vehicle: any; isList?: boolean }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const wppText = encodeURIComponent(
    `Olá! Vi o ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao} por ${formatCurrency(vehicle.preco_venda || 0)} no site. Ainda está disponível?`,
  )

  const getOptimizedUrl = (url: string) => {
    if (!url) return 'https://img.usecurling.com/p/400/300?q=car'
    // Remover uso do render transform do Supabase (causando quebra de imagem sem o plano PRO)
    if (url.includes('supabase.co/storage/v1/render/image/public/')) {
      return url
        .replace('/storage/v1/render/image/public/', '/storage/v1/object/public/')
        .split('?')[0]
    }
    return url
  }

  const coverImage =
    vehicle.fotos && vehicle.fotos.length > 0
      ? getOptimizedUrl(vehicle.fotos[0])
      : 'https://img.usecurling.com/p/400/300?q=car'

  if (isList) {
    return (
      <div className="group flex bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow w-full">
        <div className="relative w-[140px] md:w-[240px] shrink-0 overflow-hidden bg-muted">
          <img
            src={coverImage}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-display font-bold text-base md:text-lg text-foreground line-clamp-1">
            {vehicle.marca} {vehicle.modelo}
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm mb-2">
            {vehicle.ano_fabricacao} • {vehicle.quilometragem?.toLocaleString('pt-BR') || 0} km •{' '}
            {vehicle.cambio}
          </p>
          <div className="mt-auto">
            <span className="font-bold text-primary text-lg md:text-xl">
              {formatCurrency(vehicle.preco_venda || 0)}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <Button asChild variant="outline" className="w-full h-10 text-xs md:text-sm">
              <Link to={`/estoque/${vehicle.id}`}>Detalhes</Link>
            </Button>
            <Button
              asChild
              className="w-full h-10 text-xs md:text-sm bg-[#25D366] hover:bg-[#20bd5a] text-white"
            >
              <a
                href={`https://wa.me/5534999484285?text=${wppText}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Interesse
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[16/9] md:aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={coverImage}
          alt={`${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao}`}
          width="400"
          height="300"
          loading="lazy"
          decoding="async"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-display font-bold text-lg text-foreground line-clamp-1">
          {vehicle.marca} {vehicle.modelo} {vehicle.ano_fabricacao}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {vehicle.quilometragem?.toLocaleString('pt-BR') || 0} km • {vehicle.cambio}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-primary text-xl">
            {formatCurrency(vehicle.preco_venda || 0)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button asChild variant="outline" className="w-full">
            <Link to={`/estoque/${vehicle.id}`}>Detalhes</Link>
          </Button>
          <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
            <a
              href={`https://wa.me/5534999484285?text=${wppText}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tenho Interesse
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
