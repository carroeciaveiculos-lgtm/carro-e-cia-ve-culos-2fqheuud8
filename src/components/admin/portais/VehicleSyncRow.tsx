import { AdQualityBadge } from './AdQualityBadge'
import { calculateAdQualityScore } from '@/lib/ad-quality-score'
import { getImageUrl } from '@/lib/image-utils'
import { ChevronRight } from 'lucide-react'
import type { VeiculoSync, Plataforma } from '@/services/plataformas'

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

interface Props {
  veiculo: VeiculoSync
  plataformas: Plataforma[]
  onClick: () => void
  onToggleElegivel?: (veiculoId: string, elegivel: boolean) => void
}

export function VehicleSyncRow({ veiculo, plataformas, onClick }: Props) {
  const score = calculateAdQualityScore(veiculo)
  const foto = veiculo.fotos?.[0]
    ? getImageUrl(veiculo.fotos[0])
    : 'https://img.usecurling.com/p/200/150?q=car'

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <img
        src={foto}
        alt={`${veiculo.marca} ${veiculo.modelo}`}
        className="w-16 h-12 object-cover rounded-md bg-muted shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-gray-800">
          {veiculo.marca} {veiculo.modelo} {veiculo.versao || ''}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
          <span>{veiculo.ano_modelo || 'N/A'}</span>
          <span>·</span>
          <span>{Number(veiculo.quilometragem || 0).toLocaleString('pt-BR')} km</span>
          <span>·</span>
          <span className="font-mono">{veiculo.placa || 'S/ Placa'}</span>
        </div>
      </div>
      <p className="font-bold text-sm text-green-700 shrink-0 hidden sm:block">
        R$ {Number(veiculo.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
      </p>
      <AdQualityBadge score={score.score} />
      <div className="flex gap-1 shrink-0">
        {plataformas.map((p) => {
          const field = SLUG_MAP[p.slug]
          const published = veiculo[field] as boolean
          return (
            <div
              key={p.slug}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: published ? p.cor || '#999' : '#e5e7eb' }}
              title={`${p.nome}: ${published ? 'Publicado' : 'Não publicado'}`}
            />
          )
        })}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </div>
  )
}
