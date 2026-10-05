import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { MessageCircle, ThumbsUp, Facebook, Instagram, Flame } from 'lucide-react'

export default function SocialComments({ embedded = false }: { embedded?: boolean } = {}) {
  const [comments, setComments] = useState<any[]>([])
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [soInteresse, setSoInteresse] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('social_comments')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setComments(data)
  }

  // Passa a REDE do comentário: sem ela o social-actions trata tudo como Facebook, e a resposta/curtida
  // de um comentário do Instagram ia para o endereço errado. Também mostra o erro da Meta de verdade
  // (antes dizia "Curtido!" mesmo quando a Meta recusava).
  const handleAction = async (comment: any, action: string, message?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('social-actions', {
        body: { action, commentId: comment.comment_id, message, platform: comment.platform },
      })
      if (error || data?.error) {
        throw new Error(data?.error || 'A Meta recusou a ação. Tente de novo em instantes.')
      }
      if (action === 'reply') {
        await supabase
          .from('social_comments')
          .update({ is_replied: true })
          .eq('comment_id', comment.comment_id)
        toast({ title: 'Resposta enviada!' })
        setReplyText((prev) => ({ ...prev, [comment.comment_id]: '' }))
        fetchComments()
      } else {
        toast({ title: 'Curtido!' })
      }
    } catch (e: any) {
      toast({ title: 'Não foi possível concluir', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className={embedded ? '' : 'p-6 bg-slate-50 min-h-[calc(100vh-64px)]'}>
      {!embedded && (
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" /> Interações Sociais (Comentários)
        </h1>
      )}
      <div className="flex items-center gap-2 mb-4 max-w-4xl">
        <Button
          size="sm"
          variant={soInteresse ? 'default' : 'outline'}
          className="h-8 text-xs"
          onClick={() => setSoInteresse((v) => !v)}
        >
          <Flame className="w-3 h-3 mr-1" /> Só com interesse de compra
        </Button>
        <span className="text-xs text-slate-500">
          {comments.filter((c) => c.demonstra_interesse).length} de {comments.length} comentários
          pedem preço ou mostram interesse
        </span>
      </div>
      <div className="grid gap-4 max-w-4xl">
        {(soInteresse ? comments.filter((c) => c.demonstra_interesse) : comments).map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {c.platform === 'facebook' ? (
                  <Facebook className="w-4 h-4 text-blue-600" />
                ) : (
                  <Instagram className="w-4 h-4 text-pink-600" />
                )}
                <span className="font-bold text-sm">{c.from_name}</span>
                <span className="text-xs text-slate-400">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              {c.demonstra_interesse && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 text-[11px] font-semibold px-2 py-1">
                  <Flame className="w-3 h-3" /> Interesse de compra
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg border">
              {c.message}
            </p>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-blue-600"
                onClick={() => handleAction(c, 'like')}
              >
                <ThumbsUp className="w-4 h-4 mr-1" /> Curtir
              </Button>
              {!c.is_replied && (
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Escreva uma resposta..."
                    value={replyText[c.comment_id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [c.comment_id]: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => handleAction(c, 'reply', replyText[c.comment_id])}
                  >
                    Responder
                  </Button>
                </div>
              )}
              {c.is_replied && (
                <span className="text-xs text-green-600 font-bold ml-auto flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" /> Respondido
                </span>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-slate-500 py-10 border-2 border-dashed rounded-lg bg-white">
            Nenhum comentário encontrado.
          </p>
        )}
      </div>
    </div>
  )
}
