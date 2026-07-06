import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, ListTree } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AiHeadingDraftProps {
  articleTitle: string
  onInsert: (html: string) => void
}

export function AiHeadingDraft({ articleTitle, onInsert }: AiHeadingDraftProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [headings, setHeadings] = useState<{ level: number; text: string }[]>([])
  const { toast } = useToast()

  const generateHeadings = async () => {
    if (!articleTitle) {
      toast({ title: 'Digite um título primeiro', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: result, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: { is_heading_draft: true, article_title: articleTitle },
      })

      if (error) throw error
      if (!result?.success) throw new Error(result?.error || 'Erro ao gerar')

      setHeadings(result.data?.headings || [])
      toast({ title: 'Estrutura de headings gerada!' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const insertIntoEditor = () => {
    const html = headings.map((h) => `<h${h.level}>${h.text}</h${h.level}>`).join('\n')
    onInsert(html)
    toast({ title: 'Headings inseridos no editor!' })
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={generateHeadings}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
        )}
        Gerar Estrutura de Headings (IA)
      </Button>
      {headings.length > 0 && (
        <div className="border rounded-lg p-3 bg-slate-50 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <ListTree className="w-3 h-3" /> Estrutura Sugerida
            </span>
            <Button size="sm" className="h-7 text-xs" onClick={insertIntoEditor}>
              Inserir
            </Button>
          </div>
          {headings.map((h, i) => (
            <div
              key={i}
              className={cn(
                'text-xs py-0.5',
                h.level === 2 ? 'font-bold text-slate-800 pl-0' : 'text-slate-600 pl-4',
              )}
            >
              <Badge variant="outline" className="mr-2 text-[9px]">
                H{h.level}
              </Badge>
              {h.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
