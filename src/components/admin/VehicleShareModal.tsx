import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Loader2, Activity } from 'lucide-react'
import { getVehicleUrl, formatCurrency } from '@/lib/cta-router'

export function VehicleShareModal({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [platform, setPlatform] = useState('instagram')
  const [text, setText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (vehicle) {
      const shareUrl = getVehicleUrl(vehicle)
      setText(
        `🚗 ${vehicle.marca} ${vehicle.modelo}\n💰 ${formatCurrency(vehicle.preco_venda || 0)}\n🔗 ${shareUrl}`,
      )
    }
  }, [vehicle])

  if (!vehicle) return null

  const handleGenerateIA = async () => {
    setIsGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-social', {
        body: { veiculo: vehicle, platform },
      })
      if (error) throw error
      if (data?.success) {
        setText(data.text)
        toast({ title: 'Conteúdo gerado com IA!' })
      } else {
        throw new Error(data?.error || 'Erro desconhecido')
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', description: err.message, variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Anúncio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Plataforma</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a rede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Texto do Post</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-40 bg-slate-50 text-xs font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateIA}
              disabled={isGenerating}
              className="w-1/2 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar com IA
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(text)
                toast({ title: 'Copiado para a área de transferência!' })
              }}
              className="w-1/2"
            >
              Copiar
            </Button>
          </div>
          {text && (
            <Button
              variant="secondary"
              onClick={async () => {
                const { error } = await supabase.from('social_posts').insert({
                  texto: text,
                  imagem: vehicle.fotos?.[0] || '',
                  redes: [platform],
                  status: 'Rascunho',
                  veiculo_id: vehicle.id,
                })
                if (error) {
                  toast({
                    title: 'Erro ao enviar',
                    description: error.message,
                    variant: 'destructive',
                  })
                } else {
                  toast({
                    title: 'Sucesso',
                    description: 'Conteúdo enviado para o painel de Marketing!',
                  })
                  onOpenChange(false)
                }
              }}
              className="w-full mt-2 bg-slate-800 text-white hover:bg-slate-700 border-none"
            >
              <Activity className="w-4 h-4 mr-2" />
              Enviar para o Hub de Marketing
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
