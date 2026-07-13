import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getImageUrl } from '@/lib/image-utils'
import type { VeiculoSync } from '@/services/plataformas'
import type { Plataforma } from '@/services/plataformas'

interface Props {
  veiculo: VeiculoSync
  plataformas: Plataforma[]
  onToggle: (slug: string, veiculoId: string, publicar: boolean) => void
  toggling: Record<string, boolean>
}

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

export function VehicleSyncCard({ veiculo, plataformas, onToggle, toggling }: Props) {
  const foto = veiculo.fotos?.[0]
    ? getImageUrl(veiculo.fotos[0])
    : 'https://img.usecurling.com/p/400/300?q=car'

  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        <img
          src={foto}
          alt={`${veiculo.marca} ${veiculo.modelo}`}
          className="w-24 h-20 object-cover rounded-md bg-muted shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">
            {veiculo.marca} {veiculo.modelo} {veiculo.versao || ''}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="secondary" className="text-[10px]">
              {veiculo.ano_modelo || 'N/A'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {veiculo.placa || 'S/ Placa'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {Number(veiculo.quilometragem || 0).toLocaleString('pt-BR')} km
            </Badge>
          </div>
          <p className="text-primary font-bold text-sm mt-1">
            R${' '}
            {Number(veiculo.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <CardContent className="pt-0 pb-3 px-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t pt-2">
          {plataformas.map((p) => {
            const field = SLUG_MAP[p.slug]
            const checked = veiculo[field] as boolean
            const toggleKey = `${veiculo.id}-${p.slug}`
            return (
              <div key={p.slug} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.cor || '#999' }}
                />
                <span className="text-[10px] font-medium truncate flex-1">{p.nome}</span>
                <Switch
                  checked={checked || false}
                  disabled={toggling[toggleKey]}
                  onCheckedChange={(val) => onToggle(p.slug, veiculo.id, val)}
                  className="scale-75 origin-center"
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
