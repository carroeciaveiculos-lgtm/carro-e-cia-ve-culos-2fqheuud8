import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { MessageCircle, ThumbsUp, UserPlus, Facebook, Instagram } from 'lucide-react'

export default function SocialComments({ embedded = false }: { embedded?: boolean } = {}) {
  const [comments, setComments] = useState<any[]>([])
  const [replyText, setReplyText] = useState<Record<string, string>>({})
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

  const handleAction = async (commentId: string, action: string, message?: string) => {
    try {
      await supabase.functions.invoke('social-actions', {
        body: { action, commentId, message },
      })
      if (action === 'reply') {
        await supabase
          .from('social_comments')
          .update({ is_replied: true })
          .eq('comment_id', commentId)
        toast({ title: 'Resposta enviada!' })
        fetchComments()
      } else {
        toast({ title: 'Curtido!' })
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleCreateLead = async (comment: any) => {
    try {
      await supabase.from('leads').insert({
        nome: comment.from_name,
        origem: comment.platform,
        source: comment.platform,
        status: 'novo',
        tipo: 'compra',
        external_lead_id: comment.from_id,
      })
      toast({ title: 'Lead criado com sucesso!' })
    } catch (e: any) {
      toast({ title: 'Erro ao criar lead', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className={embedded ? '' : 'p-6 bg-slate-50 min-h-[calc(100vh-64px)]'}>
      {!embedded && (
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" /> Interações Sociais (Comentários)
        </h1>
      )}
      <div className="grid gap-4 max-w-4xl">
        {comments.map((c) => (
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
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleCreateLead(c)}
              >
                <UserPlus className="w-3 h-3 mr-1" /> Converter em Lead
              </Button>
            </div>
            <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg border">
              {c.message}
            </p>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-blue-600"
                onClick={() => handleAction(c.comment_id, 'like')}
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
                    onClick={() => handleAction(c.comment_id, 'reply', replyText[c.comment_id])}
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
