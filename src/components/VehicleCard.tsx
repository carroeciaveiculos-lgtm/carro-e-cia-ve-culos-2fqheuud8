import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { handleImageError, CAR_PLACEHOLDER_IMAGE, getImageUrl } from '@/lib/image-utils'
import { buildVehicleTitle } from '@/lib/vehicle-title'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick } from '@/lib/tracking'
import {
  CalendarDays,
  Settings2,
  Fuel,
  Gauge,
  ShieldCheck,
  FileCheck,
  MessageCircle,
} from 'lucide-react'

const TAG_STYLES: Record<string, string> = {
  oferta: 'bg-red-600',
  novidade: 'bg-blue-600',
  reservado: 'bg-gray-500',
}
const TAG_LABELS: Record<string, string> = {
  oferta: 'OFERTA',
  novidade: 'NOVIDADE',
  reservado: 'RESERVADO',
}

function getVehiclePhoto(fotos: any, _emPreparacao: boolean): string {
  if (Array.isArray(fotos)) {
    const firstPhoto = fotos.find(
      (url: any) => typeof url === 'string' && !url.match(/\.(mp4|mov|webm|avi|mkv)$/i),
    )
    if (firstPhoto) return getImageUrl(firstPhoto, 'media', { width: 400 })
  }
  // Sem fotos (inclusive quando em preparação): usa o placeholder local.
  // O badge "Em Preparação" já é exibido sobre a imagem quando aplicável.
  return CAR_PLACEHOLDER_IMAGE
}

export function VehicleCard({ vehicle, priority = false }: { vehicle: any; priority?: boolean }) {
  const foto = getVehiclePhoto(vehicle.fotos, (vehicle as any).em_preparacao)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col w-full bg-card">
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
          {vehicle.is_zero_km && (
            <div className="bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded shadow-sm">
              0 KM
            </div>
          )}
          {(vehicle as any).em_preparacao && (
            <div className="bg-amber-500 text-white px-2 py-1 text-xs font-bold rounded shadow-sm">
              Em Preparação
            </div>
          )}
          {(vehicle as any).garantia && (
            <div className="bg-slate-900 text-white px-2 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Garantia
            </div>
          )}
          {(vehicle as any).laudo_cautelar && (
            <div className="bg-slate-900 text-white px-2 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> Laudo Cautelar
            </div>
          )}
        </div>
        {(vehicle as any).tag_promocional && (
          <div
            className={`absolute bottom-3 left-3 z-10 text-white px-2 py-1 text-xs font-bold rounded shadow-sm ${TAG_STYLES[(vehicle as any).tag_promocional] || 'bg-gray-500'}`}
          >
            {TAG_LABELS[(vehicle as any).tag_promocional] || (vehicle as any).tag_promocional}
          </div>
        )}
        <Link to={`/estoque/${vehicle.slug || vehicle.id}`} className="w-full h-full block">
          {/* object-contain (17/08/2026, pedido da Adriana) — antes era
              object-cover, que cortava o carro quando a foto não era no
              formato paisagem 4:3 (fotos em retrato ou quadradas, comuns
              quando alguém tira do celular na vertical, ficavam com o teto
              ou a lateral cortados). Mostra a foto inteira sempre, com
              faixas do bg-muted quando a proporção não bate — nunca corta
              o carro. */}
          <img
            src={foto}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="w-full h-full object-contain bg-muted group-hover:scale-105 transition-transform duration-500"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onError={(e) => handleImageError(e.currentTarget, `${vehicle.marca} ${vehicle.modelo}`)}
          />
        </Link>
      </div>
      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="mb-2">
          <h2 className="font-bold text-base leading-tight group-hover:text-primary transition-colors mb-2">
            {buildVehicleTitle([vehicle.marca, vehicle.modelo])}
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
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 h-10 font-bold text-sm rounded-lg">
            <Link to={`/estoque/${vehicle.slug || vehicle.id}`}>Ver Detalhes</Link>
          </Button>
          <Button
            asChild
            className="flex-1 h-10 font-bold text-sm rounded-lg bg-[#25D366] hover:bg-[#1ebe5a] text-white"
          >
            <a
              href={getWhatsAppLink(
                `Olá, tenho interesse no ${buildVehicleTitle([vehicle.marca, vehicle.modelo])} - ${vehicle.ano_modelo || vehicle.ano_fabricacao} no valor de ${vehicle.preco_venda ? `R$ ${vehicle.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'consulte'}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick(`WhatsApp Card: ${vehicle.marca} ${vehicle.modelo}`, 'capa')}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
