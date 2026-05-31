import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useGerarConteudo } from '@/hooks/use-gerar-conteudo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface GeradorIAModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (data: {
    titulo: string
    slug: string
    meta_description: string
    conteudo: string
    keyword: string
    ia_confidence: string
    image_url?: string
  }) => void
}

export function GeradorIAModal({ open, onOpenChange, onSuccess }: GeradorIAModalProps) {
  const [tema, setTema] = useState('')
  const [palavraChave, setPalavraChave] = useState('')
  const [tom, setTom] = useState('Conversacional')
  const [gerarCapa, setGerarCapa] = useState(false)

  const { gerarConteudo, gerarImagem, isGenerating } = useGerarConteudo()

  const handleGenerate = async () => {
    if (!tema || !palavraChave) return

    const content = await gerarConteudo(tema, palavraChave, tom)
    if (!content) return

    let image_url
    if (gerarCapa) {
      image_url = await gerarImagem(tema)
    }

    onSuccess({
      titulo: content.titulo,
      slug: content.slug,
      meta_description: content.meta_description,
      conteudo: content.texto_html,
      keyword: content.keyword_principal,
      ia_confidence: content.certeza,
      image_url,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Assistente de IA
          </DialogTitle>
          <DialogDescription>
            Gere conteúdo otimizado para SEO em segundos com nossa inteligência artificial avançada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tema">Tema do Artigo</Label>
            <Input
              id="tema"
              placeholder="Ex: Como avaliar um carro usado antes da compra"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keyword">Palavra-chave Foco</Label>
            <Input
              id="keyword"
              placeholder="Ex: avaliar carro usado"
              value={palavraChave}
              onChange={(e) => setPalavraChave(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tom">Tom de Voz</Label>
            <Select value={tom} onValueChange={setTom} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Formal">Formal & Profissional</SelectItem>
                <SelectItem value="Conversacional">Conversacional & Amigável</SelectItem>
                <SelectItem value="Técnico">Técnico & Detalhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="gerarCapa"
              checked={gerarCapa}
              onChange={(e) => setGerarCapa(e.target.checked)}
              disabled={isGenerating}
              className="rounded border-slate-300"
            />
            <Label
              htmlFor="gerarCapa"
              className="font-normal cursor-pointer flex items-center gap-2 text-sm"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              Gerar imagem de capa com DALL-E 3
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !tema || !palavraChave}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Gerar Conteúdo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
