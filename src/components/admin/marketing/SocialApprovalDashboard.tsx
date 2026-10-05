import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Check,
  Trash2,
  Edit2,
  Clock,
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Repeat,
  CheckCircle2,
  Facebook,
  Instagram,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  FORMATO_ROTULO,
  MIN_FOTOS_CARROSSEL,
  agendarPost,
  duplicarPostPublicado,
  excluirPost,
  midiasDoPost,
  paraCampoData,
  redesDoPost,
  salvarEdicaoPost,
} from '@/services/social-posts'

// Aprovar NÃO publica: só muda o post pra 'Agendado'. Quem publica é o cron
// publicar-social-cron-job, a cada 15 minutos, e só depois do horário do post.
// Até 30/09/2026 a tela escondia isso: o post aprovado continuava na lista sem
// explicação, o aviso dizia só "aprovado e agendado", e quem falhava virava
// 'Erro' e sumia da lista sem nenhum aviso. Agora a tela mostra o estado real,
// atualiza sozinha e avisa quando o resultado chega.
//
// 04/10/2026 (pedido da Adriana): botões de ação em todos os estados —
// Aprovar, Editar (texto, horário e fotos do carrossel), Excluir e Publicar
// novamente — e visualização do carrossel (todas as fotos) com a rede e o
// formato de cada post. Estado 'Publicando' (post travado pelo publicador) agora
// aparece na lista em vez de sumir enquanto a Meta processa.
const ATUALIZACAO_MS = 30_000
const ORDEM_STATUS: Record<string, number> = {
  Erro: 0,
  Publicando: 1,
  Agendado: 2,
  Rascunho: 3,
  Aprovado: 4,
  Publicado: 5,
}
const DIAS_ERRO = 7
const HORAS_PUBLICADO = 48
type Confirmacao = { tipo: 'excluir' | 'republicar'; post: any } | null

export function SocialApprovalDashboard() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editData, setEditData] = useState('')
  const [editMidias, setEditMidias] = useState<string[]>([])
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)
  const statusAnterior = useRef<Record<string, string>>({})
  const { toast } = useToast()

  const fetchPosts = async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    const { data, error } = await supabase
      .from('social_posts')
      .select('*, veiculos(marca, modelo)')
      .in('status', ['Rascunho', 'Agendado', 'Publicando', 'Aprovado', 'Erro', 'Publicado'])
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
      const esperava = antes === 'Agendado' || antes === 'Publicando'
      if (esperava && p.status === 'Publicado') {
        toast({ title: 'Post publicado com sucesso nas redes!' })
      } else if (esperava && p.status === 'Erro') {
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
  const temEmFila = posts.some((p) => p.status === 'Agendado' || p.status === 'Publicando')
  useEffect(() => {
    if (!temEmFila) return
    const t = setInterval(() => fetchPosts(true), ATUALIZACAO_MS)
    return () => clearInterval(t)
  }, [temEmFila])

  // Aprovar e "tentar de novo" são a mesma operação (ver agendarPost em services/social-posts.ts).
  const agendar = async (id: string, aviso: string) => {
    setOcupadoId(id)
    const { erro } = await agendarPost(id)
    setOcupadoId(null)
    if (erro) {
      toast({
        title: 'Não foi possível aprovar o post',
        description: erro,
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

  const excluir = async (post: any) => {
    setOcupadoId(post.id)
    const { erro } = await excluirPost(post.id)
    setOcupadoId(null)
    if (erro) {
      toast({
        title: 'Não foi possível excluir o post',
        description: erro,
        variant: 'destructive',
      })
      return
    }
    toast({
      title:
        post.status === 'Publicado'
          ? 'Removido da lista. A publicação continua no Instagram/Facebook.'
          : 'Post excluído',
    })
    fetchPosts(true)
  }

  // "Publicar novamente" um post já publicado = criar um post NOVO igual, na fila.
  const republicar = async (post: any) => {
    setOcupadoId(post.id)
    const { erro } = await duplicarPostPublicado(post)
    setOcupadoId(null)
    if (erro) {
      toast({
        title: 'Não foi possível publicar novamente',
        description: erro,
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Nova publicação na fila! Ela sai em até 15 minutos e avisamos aqui.',
    })
    fetchPosts(true)
  }

  const confirmar = async () => {
    const c = confirmacao
    setConfirmacao(null)
    if (!c) return
    if (c.tipo === 'excluir') await excluir(c.post)
    else await republicar(c.post)
  }

  const iniciarEdicao = (post: any) => {
    setEditingId(post.id)
    setEditText(post.texto ?? '')
    setEditData(paraCampoData(post.data_agendamento))
    setEditMidias(midiasDoPost(post))
  }

  const handleSaveEdit = async (post: any) => {
    setOcupadoId(post.id)
    const { erro } = await salvarEdicaoPost(post, {
      texto: editText,
      dataLocal: editData,
      midias: editMidias,
    })
    setOcupadoId(null)
    if (erro) {
      toast({
        title: 'Não foi possível salvar as alterações',
        description: erro,
        variant: 'destructive',
      })
      return
    }
    setEditingId(null)
    toast({ title: 'Alterações salvas' })
    fetchPosts(true)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Rascunho: 'bg-slate-200 text-slate-700',
      Agendado: 'bg-blue-100 text-blue-700',
      Publicando: 'bg-amber-100 text-amber-800',
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
        posts.map((post) => {
          const editando = editingId === post.id
          const ocupado = ocupadoId === post.id
          const midias = editando ? editMidias : midiasDoPost(post)
          const ehCarrossel = post.formato === 'feed_carrossel'
          const podeEditar = ['Rascunho', 'Agendado', 'Erro', 'Aprovado'].includes(post.status)
          const redes = redesDoPost(post)
          return (
            <Card key={post.id} className="border-slate-200">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusBadge(post.status)}>{post.status}</Badge>
                    {redes.includes('instagram') && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Instagram className="w-3 h-3" /> Instagram
                      </Badge>
                    )}
                    {redes.includes('facebook') && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Facebook className="w-3 h-3" /> Facebook
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {post.formato
                        ? `${FORMATO_ROTULO[post.formato] ?? post.formato}${midias.length > 1 ? ` · ${midias.length} fotos` : ''}`
                        : post.content_type}
                    </Badge>
                    {post.formato === 'feed_carrossel' &&
                      typeof post.fotos_marcadas_ia === 'number' && (
                        <Badge
                          variant="outline"
                          className={
                            post.fotos_marcadas_ia > 0
                              ? 'text-xs border-amber-400 text-amber-700 bg-amber-50'
                              : 'text-xs border-green-400 text-green-700 bg-green-50'
                          }
                          title="Fotos editadas por IA (Galaxy AI) trazem a marca d'água 'Conteúdo gerado por IA'"
                        >
                          {post.fotos_marcadas_ia > 0
                            ? `${post.fotos_marcadas_ia} foto(s) com marca de IA`
                            : 'Fotos sem marca de IA'}
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
                {post.status === 'Publicando' && (
                  <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    Publicando agora nas redes — aguarde, isso pode levar alguns minutos.
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

                {midias.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {midias.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative shrink-0 w-24 h-24 rounded-md overflow-hidden bg-slate-100"
                      >
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {editando && ehCarrossel && editMidias.length > MIN_FOTOS_CARROSSEL && (
                          <button
                            type="button"
                            title="Tirar esta foto do carrossel"
                            className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-0.5 hover:bg-red-600"
                            onClick={() =>
                              setEditMidias((prev) => prev.filter((_, idx) => idx !== i))
                            }
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {editando ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={10}
                    />
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        Data e hora de publicação
                      </label>
                      <Input
                        type="datetime-local"
                        value={editData}
                        onChange={(e) => setEditData(e.target.value)}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-slate-500">
                        Se a data já passou, o post sai no próximo ciclo (até 15 minutos) depois de
                        aprovado.
                      </p>
                    </div>
                    {ehCarrossel && (
                      <p className="text-xs text-slate-500">
                        Para tirar uma foto do carrossel, clique no X dela (mínimo{' '}
                        {MIN_FOTOS_CARROSSEL} fotos).
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" disabled={ocupado} onClick={() => handleSaveEdit(post)}>
                        {ocupado ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3 mr-1" />
                        )}
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.texto}</p>
                )}

                {!editando && post.status !== 'Publicando' && (
                  <div className="flex gap-2 pt-2 border-t flex-wrap">
                    {podeEditar && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ocupado}
                        onClick={() => iniciarEdicao(post)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Editar
                      </Button>
                    )}
                    {(post.status === 'Rascunho' || post.status === 'Aprovado') && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={ocupado}
                        onClick={() => handleApprove(post.id)}
                      >
                        <Check className="w-3 h-3 mr-1" /> Aprovar
                      </Button>
                    )}
                    {post.status === 'Erro' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={ocupado}
                        onClick={() => handleRetry(post.id)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Publicar novamente
                      </Button>
                    )}
                    {post.status === 'Publicado' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={ocupado}
                        onClick={() => setConfirmacao({ tipo: 'republicar', post })}
                      >
                        <Repeat className="w-3 h-3 mr-1" /> Publicar novamente
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={ocupado}
                      onClick={() => setConfirmacao({ tipo: 'excluir', post })}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Excluir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}

      <AlertDialog open={!!confirmacao} onOpenChange={(aberto) => !aberto && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacao?.tipo === 'excluir' ? 'Excluir este post?' : 'Publicar novamente?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacao?.tipo === 'excluir'
                ? confirmacao.post.status === 'Publicado'
                  ? 'O post será removido desta lista. Ele continua publicado no Instagram e no Facebook — para tirá-lo das redes, apague lá.'
                  : 'O post será apagado da fila e não será publicado.'
                : 'Será criado um post novo, igual a este, que vai para a fila e sai em até 15 minutos. O post original continua como está nas redes — o conteúdo aparecerá duas vezes.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmar}>
              {confirmacao?.tipo === 'excluir' ? 'Excluir' : 'Publicar novamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
