import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import { QualityScoreMeter } from './QualityScoreMeter'
import { PortalCard } from './PortalCard'
import { calculateAdQualityScore } from '@/lib/ad-quality-score'
import { getImageUrl } from '@/lib/image-utils'
import type { VeiculoSync, Plataforma, PublicacaoStatus } from '@/services/plataformas'

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

function getPubStatus(
  veiculo: VeiculoSync,
  publicacoes?: PublicacaoStatus[],
): { label: string; className: string } {
  const anyPub = Object.values(SLUG_MAP).some((f) => veiculo[f])
  if (anyPub) return { label: 'Publicado', className: 'bg-green-100 text-green-700' }
  const hasPending = publicacoes?.some((p) => p.status === 'agendado' || p.status === 'pending')
  if (hasPending) return { label: 'Pendente', className: 'bg-amber-100 text-amber-700' }
  return { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' }
}

interface Props {
  veiculo: VeiculoSync
  plataformas: Plataforma[]
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onSync: (
    slug: string,
    veiculoId: string,
    publicar: boolean,
  ) => Promise<{ success: boolean; message: string }>
  onUpdateAdType: (veiculoId: string, platform: string, adType: string) => void
}

export function VehicleAccordion({
  veiculo,
  plataformas,
  isSelected,
  onSelect,
  onSync,
  onUpdateAdType,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const score = calculateAdQualityScore(veiculo)
  const foto = veiculo.fotos?.[0]
    ? getImageUrl(veiculo.fotos[0])
    : 'https://img.usecurling.com/p/200/150?q=car'
  const dias = veiculo.created_at
    ? Math.floor((Date.now() - new Date(veiculo.created_at).getTime()) / (1000 * 3600 * 24))
    : 0
  const pubStatus = getPubStatus(veiculo, veiculo.publicacoes)
  const publicacoes = veiculo.publicacoes || []

  return (
    <div className="border-b last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(v) => onSelect(v === true)}
          onClick={(e) => e.stopPropagation()}
        />
        <img
          src={foto}
          alt={`${veiculo.marca} ${veiculo.modelo}`}
          className="w-16 h-12 object-cover rounded-md bg-muted shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm truncate text-gray-800">
              {veiculo.marca} {veiculo.modelo} {veiculo.versao || ''}
            </p>
            <Badge className={`text-[9px] ${pubStatus.className}`}>{pubStatus.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
            <span>{veiculo.ano_modelo || 'N/A'}</span>
            <span>·</span>
            <span>{Number(veiculo.quilometragem || 0).toLocaleString('pt-BR')} km</span>
            <span>·</span>
            <span className="font-mono">{veiculo.placa || 'S/ Placa'}</span>
            <span>·</span>
            <span>{dias} dias</span>
          </div>
        </div>
        <p className="font-bold text-sm text-green-700 shrink-0 hidden sm:block">
          R${' '}
          {Number(veiculo.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
        </p>
        <QualityScoreMeter score={score.score} missingItems={score.missingItems} />
        <div className="flex gap-1 shrink-0">
          {plataformas.map((p) => {
            const published = veiculo[SLUG_MAP[p.slug]] as boolean
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
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 bg-slate-50/50 animate-fade-in">
          {score.missingItems.length > 0 && (
            <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <strong>Pendências para sincronia:</strong> {score.missingItems.join(', ')}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plataformas.map((p) => {
              const pub = publicacoes.find((x) => x.platform === p.slug)
              return (
                <PortalCard
                  key={p.slug}
                  plataforma={p}
                  veiculo={veiculo}
                  publicacao={pub}
                  onSync={onSync}
                  onUpdateAdType={onUpdateAdType}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
