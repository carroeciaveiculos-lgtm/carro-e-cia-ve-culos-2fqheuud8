import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, ImageIcon, Loader2 } from 'lucide-react'
import {
  validateVehiclePhotos,
  PHOTO_REQUIREMENTS,
  type VehiclePhotoValidation,
} from '@/lib/photo-validation'

export function VehiclePhotoValidator({ photoUrls }: { photoUrls: string[] }) {
  const [validation, setValidation] = useState<VehiclePhotoValidation | null>(null)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    setLoading(true)
    const result = await validateVehiclePhotos(photoUrls)
    setValidation(result)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" /> Validacao de Fotos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Badge
            variant={
              photoUrls.length >= PHOTO_REQUIREMENTS.minPhotoCount ? 'default' : 'destructive'
            }
          >
            {photoUrls.length}/{PHOTO_REQUIREMENTS.minPhotoCount} fotos
          </Badge>
          <Button
            onClick={handleValidate}
            disabled={loading || photoUrls.length === 0}
            size="sm"
            variant="outline"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Validar Fotos
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          Requisitos: {PHOTO_REQUIREMENTS.minPhotoCount}+ fotos | {PHOTO_REQUIREMENTS.minWidth}x
          {PHOTO_REQUIREMENTS.minHeight}px | Vertical | ~{PHOTO_REQUIREMENTS.minFileSizeKB}KB | RGB
          | {PHOTO_REQUIREMENTS.dpi}dpi
        </div>
        {validation && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {validation.photoIssues.map((issue, i) => (
              <div key={`issue-${i}`} className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <Badge variant="destructive" className="text-xs">
                  {issue.message}
                </Badge>
              </div>
            ))}
            {validation.results.map((r, i) => (
              <div key={`photo-${i}`} className="flex items-center gap-2 text-sm">
                {r.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Foto {i + 1}</span>
                {r.width && (
                  <span className="text-xs text-muted-foreground">
                    {r.width}x{r.height}px
                  </span>
                )}
                {r.fileSizeKB && (
                  <span className="text-xs text-muted-foreground">{r.fileSizeKB}KB</span>
                )}
                {r.issues.map((issue, j) => (
                  <Badge key={j} variant="outline" className="text-xs text-red-500">
                    {issue.message}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
