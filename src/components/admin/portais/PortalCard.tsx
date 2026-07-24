import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, ExternalLink, Loader2 } from 'lucide-react'
import { translateError } from '@/lib/platform-errors'
import { PortalTierSelector } from './PortalTierSelector'
import { useDebouncedToggle } from '@/hooks/use-debounced-toggle'
import type { Plataforma, PublicacaoStatus, VeiculoSync } from '@/services/plataformas'

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

function formatLastSync(dateStr: string | null): string {
  if (!dateStr) return 'Nunca sincronizado'
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Agora'
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}

interface Props {
  plataforma: Plataforma
  veiculo: VeiculoSync
  publicacao?: PublicacaoStatus
  onSync: (
    slug: string,
    veiculoId: string,
    publicar: boolean,
  ) => Promise<{ success: boolean; message: string }>
  onUpdateAdType: (veiculoId: string, platform: string, adType: string) => void
}

export function PortalCard({ plataforma, veiculo, publicacao, onSync, onUpdateAdType }: Props) {
  const field = SLUG_MAP[plataforma.slug]
  const published = veiculo[field] as boolean
  const hasError = publicacao?.status === 'error' || publicacao?.status === 'erro'
  const errorMsg =
    hasError && publicacao?.erro_msg ? translateError(publicacao.erro_msg).message : null

  const { isLoading, error, handleToggle } = useDebouncedToggle(async (checked: boolean) => {
    const result = await onSync(plataforma.slug, veiculo.id, checked)
    if (!result.success) {
      throw new Error(result.message)
    }
  })

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 ${error ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: plataforma.cor || '#999' }}
        />
        <span className="font-medium text-sm flex-1 truncate">{plataforma.nome}</span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />}
        <Switch checked={published || false} disabled={isLoading} onCheckedChange={handleToggle} />
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={published ? 'default' : 'secondary'}
          className={`text-[10px] ${published ? 'bg-green-100 text-green-700' : ''}`}
        >
          {published ? 'Publicado' : 'Não publicado'}
        </Badge>
        {publicacao?.url_publicacao && (
          <a
            href={publicacao.url_publicacao}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-0.5 text-[10px]"
          >
            Ver anúncio <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      <PortalTierSelector
        plataforma={plataforma}
        veiculo={veiculo}
        onUpdateAdType={onUpdateAdType}
      />

      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <Clock className="w-3 h-3" />
        <span>{formatLastSync(publicacao?.publicado_em || publicacao?.updated_at || null)}</span>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-[10px] text-red-700 bg-red-50 rounded p-1.5">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {!error && errorMsg && (
        <div className="flex items-start gap-1.5 text-[10px] text-red-700 bg-red-50 rounded p-1.5">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
