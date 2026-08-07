import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react'
import { translateError } from '@/lib/platform-errors'
import { PortalTierSelector } from './PortalTierSelector'
import { useToast } from '@/hooks/use-toast'
import type { Plataforma, PublicacaoStatus, VeiculoSync } from '@/services/plataformas'

const SLUG_MAP: Record<string, keyof VeiculoSync> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

function getAutoStatus(
  published: boolean,
  publicacao?: PublicacaoStatus,
  elegivel?: boolean | null,
): { label: string; className: string } {
  if (publicacao?.status === 'error' || publicacao?.status === 'erro')
    return { label: 'Erro', className: 'bg-red-100 text-red-700' }
  if (published) return { label: 'Publicado', className: 'bg-green-100 text-green-700' }
  if (elegivel === false) return { label: 'Inelegível', className: 'bg-gray-100 text-gray-500' }
  if (publicacao?.status === 'agendado' || publicacao?.status === 'pending')
    return { label: 'Pendente', className: 'bg-amber-100 text-amber-700' }
  return { label: 'Pendente', className: 'bg-gray-100 text-gray-600' }
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
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const field = SLUG_MAP[plataforma.slug]
  const published = veiculo[field] as boolean
  const hasError = publicacao?.status === 'error' || publicacao?.status === 'erro'
  const errorMsg =
    hasError && publicacao?.erro_msg ? translateError(publicacao.erro_msg).message : null
  const autoStatus = getAutoStatus(published, publicacao, veiculo.elegivel_portais)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await onSync(plataforma.slug, veiculo.id, true)
      toast({
        title: result.success ? 'Sincronizado com sucesso' : 'Erro na sincronização',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 ${hasError ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: plataforma.cor || '#999' }}
        />
        <span className="font-medium text-sm flex-1 truncate">{plataforma.nome}</span>
        <Badge className={`text-[10px] ${autoStatus.className}`}>{autoStatus.label}</Badge>
      </div>

      <div className="flex items-center gap-2">
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

      {errorMsg && (
        <div className="flex items-start gap-1.5 text-[10px] text-red-700 bg-red-50 rounded p-1.5">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="break-words">{errorMsg}</span>
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 text-xs"
        onClick={handleSync}
        disabled={syncing}
      >
        <RefreshCw className={`w-3 h-3 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
      </Button>
    </div>
  )
}
