import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link2, Loader2 } from 'lucide-react'

interface InternalLinkSuggestionsProps {
  keywords: string[]
  currentId: string
}

export function InternalLinkSuggestions({ keywords, currentId }: InternalLinkSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!keywords || keywords.length === 0) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('articles')
          .select('id, titulo, slug, status_publicacao, palavras_chave_principais')
          .eq('status_publicacao', 'Publicado')
          .neq('id', currentId)
          .limit(10)

        if (data) {
          const matched = data.filter((article: any) => {
            const articleKeywords = (article.palavras_chave_principais as string[]) || []
            return keywords.some(
              (kw) =>
                articleKeywords.some((ak: string) => ak.toLowerCase().includes(kw.toLowerCase())) ||
                article.titulo?.toLowerCase().includes(kw.toLowerCase()),
            )
          })
          setSuggestions(matched.slice(0, 5))
        }
      } catch {
        // silent fail
      }

      setLoading(false)
    }
    fetchSuggestions()
  }, [keywords, currentId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Buscando links...
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-blue-500" /> Links Internos Sugeridos
      </h4>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="p-3 bg-white border rounded-lg hover:border-blue-400 transition-colors"
          >
            <p className="text-sm font-medium text-slate-800 line-clamp-1">{s.titulo}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">
                /{s.slug}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(`<a href="/blog/${s.slug}">${s.titulo}</a>`)
                }}
              >
                Copiar link
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
