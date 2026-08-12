import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw, ImageOff } from 'lucide-react'
import { getImageUrl } from '@/lib/image-utils'
import type { ReviewVehicle } from '@/services/portal-review'

// Rótulo de plataforma pro erro — reprocessar precisa saber qual, já que um
// veículo pode ter pendência em mais de uma plataforma ao mesmo tempo.
const PLATFORM_LABELS: Record<string, string> = {
  webmotors: 'Webmotors',
  mercadolivre: 'Mercado Livre',
  olx: 'OLX',
  icarros: 'iCarros',
  napista: 'Napista',
}

interface Props {
  veiculo: ReviewVehicle
  onResync: (veiculoId: string, platform: string) => void
  resyncingPlatforms: Record<string, boolean>
}

export function ReviewVehicleCard({ veiculo, onResync, resyncingPlatforms }: Props) {
  const allErrors = [
    ...veiculo.syncErrors.map((e) => ({ source: 'Sync', platform: e.platform, ...e })),
    ...veiculo.publicacaoErrors.map((e) => ({ source: 'Portal', platform: e.platform, ...e })),
  ]

  const invalidImageUrls = new Set<string>()
  for (const err of veiculo.syncErrors) {
    if (err.metadata?.invalid_images) {
      for (const img of err.metadata.invalid_images) {
        invalidImageUrls.add(img.url)
      }
    }
  }

  const fotos = Array.isArray(veiculo.fotos) ? veiculo.fotos : []

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-bold text-sm">
            {veiculo.marca} {veiculo.modelo} {veiculo.versao || ''}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="secondary" className="text-[10px]">
              {veiculo.ano_modelo || 'N/A'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {veiculo.placa || 'S/ Placa'}
            </Badge>
            {veiculo.requires_review && (
              <Badge variant="destructive" className="text-[10px]">
                Requer Revisão
              </Badge>
            )}
            {veiculo.em_preparacao && (
              <Badge variant="secondary" className="text-[10px]">
                Em Preparação
              </Badge>
            )}
          </div>
        </div>
      </div>

      {allErrors.length > 0 && (
        <div className="space-y-2 mb-3">
          {allErrors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-md"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {err.platform && (
                    <Badge className="text-[9px] bg-slate-700 text-white border-none">
                      {PLATFORM_LABELS[err.platform] || err.platform}
                    </Badge>
                  )}
                  <Badge variant="destructive" className="text-[9px]">
                    {err.source}
                  </Badge>
                  <span className="text-xs font-medium text-gray-700">{err.translatedMessage}</span>
                  {err.platform && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 ml-auto"
                      disabled={resyncingPlatforms[err.platform]}
                      onClick={() => onResync(veiculo.id, err.platform as string)}
                    >
                      <RefreshCw
                        className={`w-3 h-3 mr-1 ${resyncingPlatforms[err.platform] ? 'animate-spin' : ''}`}
                      />
                      Reprocessar
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Ação: {err.translatedAction}</p>
                {err.metadata?.invalid_images && (
                  <div className="mt-1 space-y-0.5">
                    {err.metadata.invalid_images.map((img: any, j: number) => (
                      <p key={j} className="text-[10px] text-red-600">
                        ⚠ {img.reason}
                        {img.detectedResolution && ` (${img.detectedResolution})`}
                        {img.required && ` — mínimo: ${img.required}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {fotos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">
            Imagens do Veículo ({fotos.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {fotos.slice(0, 10).map((foto, i) => {
              const url = getImageUrl(foto)
              const isInvalid = invalidImageUrls.has(foto) || invalidImageUrls.has(url)
              return (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className={`w-16 h-16 object-cover rounded-md ${
                      isInvalid ? 'ring-2 ring-red-500 opacity-60' : 'ring-1 ring-gray-200'
                    }`}
                    loading="lazy"
                  />
                  {isInvalid && (
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                      <ImageOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
            {fotos.length > 10 && (
              <span className="text-xs text-gray-400 self-center">+{fotos.length - 10} fotos</span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
