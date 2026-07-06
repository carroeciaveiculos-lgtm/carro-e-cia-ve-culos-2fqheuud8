import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, RefreshCw } from 'lucide-react'

export function RevisionAlerts() {
  const [oldArticles, setOldArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOldArticles = async () => {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data } = await supabase
        .from('articles')
        .select('id, titulo, slug, atualizado_em, requires_review, status_publicacao')
        .or(`requires_review.eq.true,atualizado_em.lt.${ninetyDaysAgo.toISOString()}`)
        .neq('status_publicacao', 'Rascunho')
        .order('atualizado_em', { ascending: true })
        .limit(5)

      setOldArticles(data || [])
      setLoading(false)
    }
    fetchOldArticles()
  }, [])

  if (loading || oldArticles.length === 0) return null

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800">Artigos precisando de revisão</h3>
        <Badge className="bg-amber-200 text-amber-800">{oldArticles.length}</Badge>
      </div>
      <div className="space-y-2">
        {oldArticles.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2"
          >
            <span className="text-amber-900 font-medium line-clamp-1">{a.titulo}</span>
            <span className="text-xs text-amber-600 flex items-center gap-1 shrink-0 ml-2">
              {a.requires_review ? (
                <>
                  <RefreshCw className="w-3 h-3" /> Revisão necessária
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  {new Date(a.atualizado_em).toLocaleDateString('pt-BR')}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
