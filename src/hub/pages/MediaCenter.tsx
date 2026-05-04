import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Loader2,
  Copy,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FOLDERS = ['Geral', 'Veículos', 'Fotos', 'Equipe', 'Logos Parceiros']

export default function MediaCenterPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeFolder, setActiveFolder] = useState('Geral')
  const { toast } = useToast()

  const loadAssets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro ao carregar mídia', description: error.message, variant: 'destructive' })
    } else {
      setAssets(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1080
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Falha no canvas'))),
            'image/webp',
            0.8,
          )
        }
      }
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)

    try {
      for (const file of Array.from(e.target.files)) {
        const compressedBlob = await compressImage(file)
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
          type: 'image/webp',
        })
        const filename = `media/${Date.now()}_${Math.random().toString(36).substring(2)}.webp`

        const { error: uploadError } = await supabase.storage
          .from('veiculos-fotos')
          .upload(filename, compressedFile)
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('veiculos-fotos').getPublicUrl(filename)

        await supabase.from('media_assets').insert({
          file_name: compressedFile.name,
          file_path: publicUrl,
          file_size: compressedFile.size,
          mime_type: 'image/webp',
          folder: activeFolder,
        })
      }

      toast({
        title: 'Upload concluído!',
        description: `Imagens otimizadas e salvas na pasta ${activeFolder}.`,
      })
      loadAssets()
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Deseja realmente excluir esta imagem?')) return
    try {
      const path = url.split('/veiculos-fotos/')[1]
      if (path) await supabase.storage.from('veiculos-fotos').remove([path])
      await supabase.from('media_assets').delete().eq('id', id)

      toast({ title: 'Imagem excluída' })
      setAssets(assets.filter((a) => a.id !== id))
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: 'URL Copiada!' })
  }

  const filteredAssets = assets.filter((a) => (a.folder || 'Geral') === activeFolder)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Media Center</h1>
          <p className="mt-1 text-gray-500">
            Organize suas imagens em pastas e reutilize em todo o site.
          </p>
        </div>
        <div>
          <input
            type="file"
            id="upload-media"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="upload-media">
            <Button
              asChild
              disabled={uploading}
              className="bg-[#CC0000] hover:bg-red-700 cursor-pointer w-full md:w-auto"
            >
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-2" />
                )}
                Fazer Upload p/ {activeFolder}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pastas</h2>
          <nav className="space-y-1">
            {FOLDERS.map((folder) => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  activeFolder === folder
                    ? 'bg-red-50 text-[#CC0000]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                {activeFolder === folder ? (
                  <FolderOpen className="w-5 h-5" />
                ) : (
                  <Folder className="w-5 h-5 text-gray-400" />
                )}
                {folder}
                <span className="ml-auto bg-white border px-2 py-0.5 rounded-full text-xs text-gray-500">
                  {assets.filter((a) => (a.folder || 'Geral') === folder).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-400" /> {activeFolder}
          </h2>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <Card className="border-dashed border-[3px] border-gray-200 bg-gray-50/50 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600">Pasta vazia</h3>
                <p className="text-gray-400 mt-2">
                  Faça upload de imagens para a pasta "{activeFolder}".
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 hover:border-[#CC0000] transition-colors"
                >
                  <div className="aspect-square relative">
                    <img
                      src={asset.file_path}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => copyUrl(asset.file_path)}
                        className="h-8 w-8 rounded-full hover:bg-white"
                        title="Copiar URL"
                      >
                        <Copy className="w-4 h-4 text-gray-700" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(asset.id, asset.file_path)}
                        className="h-8 w-8 rounded-full"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-white border-t">
                    <p
                      className="text-xs text-gray-600 truncate font-medium"
                      title={asset.file_name}
                    >
                      {asset.file_name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {asset.file_size ? (asset.file_size / 1024).toFixed(1) + ' KB' : 'WebP'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
