export const PHOTO_REQUIREMENTS = {
  minWidth: 1200,
  minHeight: 1540,
  minFileSizeKB: 600,
  minPhotoCount: 20,
  orientation: 'vertical' as const,
  dpi: 72,
  colorMode: 'RGB',
}

export interface PhotoIssue {
  type: 'dimensions' | 'orientation' | 'filesize' | 'count'
  message: string
  severity: 'error' | 'warning'
}

export interface SinglePhotoValidation {
  url: string
  valid: boolean
  issues: PhotoIssue[]
  width?: number
  height?: number
  fileSizeKB?: number
}

export interface VehiclePhotoValidation {
  totalPhotos: number
  hasMinimumPhotos: boolean
  photoIssues: PhotoIssue[]
  results: SinglePhotoValidation[]
}

export async function validateSinglePhoto(url: string): Promise<SinglePhotoValidation> {
  const issues: PhotoIssue[] = []
  try {
    const response = await fetch(url, { method: 'GET' })
    const blob = await response.blob()
    const fileSizeKB = Math.round(blob.size / 1024)
    if (fileSizeKB < PHOTO_REQUIREMENTS.minFileSizeKB) {
      issues.push({
        type: 'filesize',
        message: `Tamanho: ${fileSizeKB}KB (min: 600KB)`,
        severity: 'warning',
      })
    }
    const img = new Image()
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = URL.createObjectURL(blob)
    })
    if (
      dimensions.width < PHOTO_REQUIREMENTS.minWidth ||
      dimensions.height < PHOTO_REQUIREMENTS.minHeight
    ) {
      issues.push({
        type: 'dimensions',
        message: `${dimensions.width}x${dimensions.height} (min: 1200x1540)`,
        severity: 'error',
      })
    }
    if (dimensions.width >= dimensions.height) {
      issues.push({
        type: 'orientation',
        message: 'Horizontal (deve ser vertical)',
        severity: 'error',
      })
    }
    URL.revokeObjectURL(img.src)
    return {
      url,
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      width: dimensions.width,
      height: dimensions.height,
      fileSizeKB,
    }
  } catch {
    return {
      url,
      valid: false,
      issues: [{ type: 'dimensions', message: 'Erro ao carregar imagem', severity: 'error' }],
    }
  }
}

export async function validateVehiclePhotos(photoUrls: string[]): Promise<VehiclePhotoValidation> {
  const photosToValidate = photoUrls.slice(0, 30)
  const results = await Promise.all(photosToValidate.map((url) => validateSinglePhoto(url)))
  const photoIssues: PhotoIssue[] = []
  if (photoUrls.length < PHOTO_REQUIREMENTS.minPhotoCount) {
    photoIssues.push({
      type: 'count',
      message: `${photoUrls.length} fotos (min: 20)`,
      severity: 'error',
    })
  }
  return {
    totalPhotos: photoUrls.length,
    hasMinimumPhotos: photoUrls.length >= PHOTO_REQUIREMENTS.minPhotoCount,
    photoIssues,
    results,
  }
}
