import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCw, Sparkles, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { validateSinglePhoto, PHOTO_REQUIREMENTS } from '@/lib/photo-validation'

export function ImageEditorModal({
  isOpen,
  onClose,
  imageUrl,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onSave: (newUrl: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(imageUrl)
  const [isAiOptimized, setIsAiOptimized] = useState(false)
  const [photoValidation, setPhotoValidation] = useState<{
    valid: boolean
    issues: string[]
    width?: number
    height?: number
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setPreviewUrl(imageUrl)
    setIsAiOptimized(false)
    setPhotoValidation(null)
    validateSinglePhoto(imageUrl).then((r) => {
      setPhotoValidation({
        valid: r.valid,
        issues: r.issues.map((i) => i.message),
        width: r.width,
        height: r.height,
      })
    })
  }, [imageUrl, isOpen])

  const loadImageToCanvas = (src: string, applyFilter = false, rotation = 0): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('No canvas context')

        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)

        if (applyFilter) {
          ctx.filter = 'contrast(1.1) saturate(1.2) brightness(1.05)'
        }

        ctx.drawImage(img, -img.width / 2, -img.height / 2)

        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = reject
      img.src = src + (src.includes('?') ? '&' : '?') + 't=' + new Date().getTime()
    })
  }

  const handleRotate = async () => {
    setProcessing(true)
    try {
      const rotated = await loadImageToCanvas(previewUrl, false, 90)
      setPreviewUrl(rotated)
    } catch (e) {
      toast({ title: 'Erro ao girar imagem', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const handleOptimizeAI = async () => {
    setProcessing(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      const optimized = await loadImageToCanvas(previewUrl, true, 0)
      setPreviewUrl(optimized)
      setIsAiOptimized(true)
      toast({ title: 'Imagem otimizada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao otimizar imagem', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(previewUrl)
      const blob = await res.blob()

      const fileName = `edited_${Date.now()}.jpg`
      const filePath = `inventory/edited/${fileName}`

      const { error } = await supabase.storage
        .from('logos-e-imagens')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from('logos-e-imagens').getPublicUrl(filePath)

      await supabase.from('media_assets').insert({
        file_name: fileName,
        file_path: data.publicUrl,
        mime_type: 'image/jpeg',
        folder: 'Edições',
      })

      onSave(data.publicUrl)
      toast({ title: 'Imagem salva com sucesso!' })
      onClose()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-50">
        <DialogHeader>
          <DialogTitle>Editor e Otimização de Imagem</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-500">Original</span>
            <div className="relative aspect-video bg-black/5 rounded-lg overflow-hidden border">
              <img src={imageUrl} className="w-full h-full object-contain" alt="Original" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-500">
              Preview {isAiOptimized && '(Otimizado)'}
            </span>
            <div className="relative aspect-video bg-black/5 rounded-lg overflow-hidden border">
              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
              <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
            </div>
          </div>
        </div>

        {photoValidation && (
          <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              {photoValidation.valid ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm font-medium text-slate-700">
                Validacao: {photoValidation.valid ? 'Aprovado' : 'Requer ajuste'}
              </span>
              {photoValidation.width && (
                <span className="text-xs text-slate-500">
                  {photoValidation.width}x{photoValidation.height}px
                </span>
              )}
            </div>
            {photoValidation.issues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {photoValidation.issues.map((issue, i) => (
                  <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    {issue}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Requisitos: {PHOTO_REQUIREMENTS.minWidth}x{PHOTO_REQUIREMENTS.minHeight}px | Vertical
              | ~{PHOTO_REQUIREMENTS.minFileSizeKB}KB
            </p>
          </div>
        )}

        <DialogFooter className="mt-6 flex sm:justify-between items-center w-full">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRotate} disabled={processing || loading}>
              <RotateCw className="w-4 h-4 mr-2" />
              Girar 90º
            </Button>
            <Button
              variant="secondary"
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
              onClick={handleOptimizeAI}
              disabled={processing || loading || isAiOptimized}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Otimizar com IA
            </Button>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || processing || previewUrl === imageUrl}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
