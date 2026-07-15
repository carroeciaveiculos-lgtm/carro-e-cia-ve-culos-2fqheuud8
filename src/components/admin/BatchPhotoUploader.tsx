import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react'
import { resizeImages } from '@/lib/image-resize'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Props {
  vehicleId?: string
  modelo: string
  placa: string
  onUploaded: (urls: string[]) => void
}

export function BatchPhotoUploader({ vehicleId, modelo, placa, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[]
    if (!files.length) return

    setUploading(true)
    setProgress(0)

    try {
      const resizedBlobs = await resizeImages(files)
      const folderName = `${modelo || 'veiculo'}_${placa || 'semplaca'}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      const newUrls: string[] = []

      for (let i = 0; i < resizedBlobs.length; i++) {
        const blob = resizedBlobs[i]
        const fileName = `${Date.now()}_${i}.${blob.type.includes('png') ? 'png' : 'jpg'}`
        const filePath = `${folderName}/${fileName}`

        const { error } = await supabase.storage.from('media').upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        })

        if (error) {
          const { error: err2 } = await supabase.storage
            .from('site-assets')
            .upload(filePath, blob, {
              contentType: blob.type || 'image/jpeg',
              upsert: true,
            })
          if (err2) throw err2
          const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(filePath)
          newUrls.push(pub.publicUrl)
        } else {
          const { data: pub } = supabase.storage.from('media').getPublicUrl(filePath)
          newUrls.push(pub.publicUrl)
        }

        await supabase.from('media_assets').insert([
          {
            file_name: files[i].name,
            file_path: newUrls[i],
            file_size: blob.size,
            mime_type: blob.type || 'image/jpeg',
            folder: folderName,
            uploaded_by: userId,
          },
        ])

        setProgress(Math.round(((i + 1) / resizedBlobs.length) * 100))
      }

      if (vehicleId) {
        const { data: v } = await supabase
          .from('veiculos')
          .select('fotos')
          .eq('id', vehicleId)
          .single()
        const currentFotos = (v?.fotos as string[]) || []
        await supabase
          .from('veiculos')
          .update({ fotos: [...currentFotos, ...newUrls] })
          .eq('id', vehicleId)
      }

      onUploaded(newUrls)
      toast({ title: `${newUrls.length} fotos enviadas e redimensionadas (1200x1540px)!` })
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={handleUpload}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redimensionando... {progress}%
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload em Lote (Auto-Resize)
          </>
        )}
      </Button>
      {uploading && progress > 0 && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
