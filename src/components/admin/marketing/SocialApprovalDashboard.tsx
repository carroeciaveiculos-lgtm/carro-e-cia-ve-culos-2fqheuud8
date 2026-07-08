import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Edit2, Clock, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SocialApprovalDashboard() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const { toast } = useToast()

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('social_posts')
      .select('*, veiculos(marca, modelo)')
      .in('status', ['Rascunho', 'Agendado', 'Aprovado'])
      .order('data_agendamento', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleApprove = async (id: string) => {
    await supabase.from('social_posts').update({ status: 'Aprovado' }).eq('id', id)
    toast({ title: 'Post aprovado!' })
    fetchPosts()
  }

  const handleReject = async (id: string) => {
    if (!confirm('Rejeitar este post?')) return
    await supabase.from('social_posts').delete().eq('id', id)
    toast({ title: 'Post rejeitado' })
    fetchPosts()
  }

  const handleSaveEdit = async (id: string) => {
    await supabase.from('social_posts').update({ texto: editText }).eq('id', id)
    setEditingId(null)
    toast({ title: 'Texto atualizado' })
    fetchPosts()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Rascunho: 'bg-slate-200 text-slate-700',
      Agendado: 'bg-blue-100 text-blue-700',
      Aprovado: 'bg-green-100 text-green-700',
    }
    return map[status] || 'bg-slate-100'
  }

  if (loading) return <div className="text-center py-8 text-slate-400">Carregando...</div>

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Nenhum post pendente de aprovação.</p>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="border-slate-200">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge className={statusBadge(post.status)}>{post.status}</Badge>
                  {post.content_type && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {post.content_type}
                    </Badge>
                  )}
                  {post.veiculos && (
                    <span className="text-xs text-purple-600 font-medium">
                      {post.veiculos.marca} {post.veiculos.modelo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {post.data_agendamento
                    ? new Date(post.data_agendamento).toLocaleString('pt-BR')
                    : 'Sem data'}
                </div>
              </div>
              {post.imagem && (
                <div className="w-full h-32 rounded-md overflow-hidden bg-slate-100">
                  <img src={post.imagem} alt="Post" className="w-full h-full object-cover" />
                </div>
              )}
              {editingId === post.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(post.id)}>
                      <Save className="w-3 h-3 mr-1" /> Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.texto}</p>
              )}
              {editingId !== post.id && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(post.id)
                      setEditText(post.texto)
                    }}
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(post.id)}
                  >
                    <Check className="w-3 h-3 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(post.id)}>
                    <X className="w-3 h-3 mr-1" /> Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
