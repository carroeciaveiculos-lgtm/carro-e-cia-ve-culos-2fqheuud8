import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Check,
  X,
  Edit2,
  Clock,
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Aprovar NÃO publica: só muda o post pra 'Agendado'. Quem publica é o cron
// publicar-social-cron-job, a cada 15 minutos, e só depois do horário do post.
// Até 30/09/2026 a tela escondia isso: o post aprovado continuava na lista sem
// explicação, o aviso dizia só "aprovado e agendado", e quem falhava virava
// 'Erro' e sumia da lista sem nenhum aviso. Agora a tela mostra o estado real,
// atualiza sozinha e avisa quando o resultado chega.
const ATUALIZACAO_MS = 30_000
const ORDEM_STATUS: Record<string, number> = {
  Erro: 0,
  Agendado: 1,
  Rascunho: 2,
  Aprovado: 3,
  Publicado: 4,
}
const DIAS_ERRO = 7
const HORAS_PUBLICADO = 48

export function SocialApprovalDashboard() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const statusAnterior = useRef<Record<string, string>>({})
  const { toast } = useToast()

  const fetchPosts = async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    const { data, error } = await supabase
      .from('social_posts')
      .select('*, veiculos(marca, modelo)')
      .in('status', ['Rascunho', 'Agendado', 'Aprovado', 'Erro', 'Publicado'])
      .order('data_agendamento', { ascending: false })
    if (error) {
      if (!silencioso) toast({ title: 'Erro ao carregar os posts', variant: 'destructive' })
      setLoading(false)
      return
    }
    const agora = Date.now()
    const visiveis = (data || [])
      .filter((p: any) => {
        if (p.status === 'Erro') {
          return (
            agora - new Date(p.data_agendamento || p.criado_em).getTime() < DIAS_ERRO * 86_400_000
          )
        }
        if (p.status === 'Publicado') {
          return (
            agora - new Date(p.publicado_em || p.data_agendamento || p.criado_em).getTime() <
            HORAS_PUBLICADO * 3_600_000
          )
        }
        return true
      })
      .sort((a: any, b: any) => (ORDEM_STATUS[a.status] ?? 9) - (ORDEM_STATUS[b.status] ?? 9))

    // Avisa quando um post que estava aguardando publicação teve resultado.
    for (const p of visiveis) {
      const antes = statusAnterior.current[p.id]
      if (antes === 'Agendado' && p.status === 'Publicado') {
        toast({ title: 'Post publicado com sucesso nas redes!' })
      } else if (antes === 'Agendado' && p.status === 'Erro') {
        toast({
          title: 'Não foi possível publicar o post',
          description: p.erro_msg || 'Veja o motivo no cartão do post.',
          variant: 'destructive',
        })
      }
    }
    statusAnterior.current = Object.fromEntries(visiveis.map((p: any) => [p.id, p.status]))
    setPosts(visiveis)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Enquanto houver post esperando publicação, confere o resultado sozinho.
  const temAgendado = posts.some((p) => p.status === 'Agendado')
  useEffect(() => {
    if (!temAgendado) return
    const t = setInterval(() => fetchPosts(true), ATUALIZACAO_MS)
    return () => clearInterval(t)
  }, [temAgendado])

  const agendar = async (id: string, aviso: string) => {
    const { error } = await supabase
      .from('social_posts')
      .update({ status: 'Agendado', erro_msg: null })
      .eq('id', id)
    if (error) {
      toast({
        title: 'Não foi possível aprovar o post',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    toast({ title: aviso })
    // Mostra já o novo estado e deixa o resultado real vir da próxima atualização.
    statusAnterior.current[id] = 'Agendado'
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Agendado', erro_msg: null } : p)),
    )
  }

  const handleApprove = (id: string) =>
    agendar(
      id,
      'Post aprovado! Ele entra na fila de publicação (até 15 min) e avisamos aqui quando sair.',
    )

  const handleRetry = (id: string) =>
    agendar(id, 'Nova tentativa agendada. Avisamos aqui quando o resultado chegar.')

  const handleReject = async (id: string) => {
    if (!confirm('Rejeitar este post?')) return
    const { error } = await supabase.from('social_posts').delete().eq('id', id)
    if (error) {
      toast({
        title: 'Não foi possível rejeitar o post',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Post rejeitado' })
    fetchPosts(true)
  }

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase.from('social_posts').update({ texto: editText }).eq('id', id)
    if (error) {
      toast({
        title: 'Não foi possível salvar o texto',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    setEditingId(null)
    toast({ title: 'Texto atualizado' })
    fetchPosts(true)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Rascunho: 'bg-slate-200 text-slate-700',
      Agendado: 'bg-blue-100 text-blue-700',
      Aprovado: 'bg-green-100 text-green-700',
      Erro: 'bg-red-100 text-red-700',
      Publicado: 'bg-green-100 text-green-700',
    }
    return map[status] || 'bg-slate-100'
  }

  const quandoSai = (post: any) => {
    const data = post.data_agendamento ? new Date(post.data_agendamento) : null
    if (data && data.getTime() > Date.now()) {
      return `Aprovado — será publicado em ${data.toLocaleString('pt-BR')}`
    }
    return 'Aprovado — aguardando publicação (o sistema publica em até 15 minutos)'
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
              {post.status === 'Agendado' && (
                <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  {quandoSai(post)}
                </div>
              )}
              {post.status === 'Erro' && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    <strong>Não foi publicado.</strong>{' '}
                    {post.erro_msg || 'O motivo não foi registrado — veja Logs de Integração.'}
                  </span>
                </div>
              )}
              {post.status === 'Publicado' && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  Publicado com sucesso
                  {post.publicado_em &&
                    ` em ${new Date(post.publicado_em).toLocaleString('pt-BR')}`}
                </div>
              )}
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
              {editingId !== post.id && post.status !== 'Publicado' && (
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
                  {post.status === 'Erro' ? (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleRetry(post.id)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Tentar de novo
                    </Button>
                  ) : (
                    post.status !== 'Agendado' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(post.id)}
                      >
                        <Check className="w-3 h-3 mr-1" /> Aprovar
                      </Button>
                    )
                  )}
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
