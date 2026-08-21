import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Calendar as CalendarIcon,
  List,
  Filter,
  Wand2,
  ImagePlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface SocialPost {
  id: string
  redes: Record<string, boolean>
  texto: string
  imagem: string | null
  data_agendamento: string
  status: string
  criado_em: string
  veiculo_id?: string | null
  content_type?: string | null
}

const NETWORK_COLORS: Record<string, string> = {
  instagram: 'bg-[#E4405F]',
  facebook: 'bg-[#1877F2]',
  linkedin: 'bg-[#0A66C2]',
  whatsapp: 'bg-[#25D366]',
}

const NETWORK_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-3 h-3 text-white" />,
  facebook: <Facebook className="w-3 h-3 text-white" />,
  linkedin: <Linkedin className="w-3 h-3 text-white" />,
  whatsapp: <MessageCircle className="w-3 h-3 text-white" />,
}

export default function RedesSociais({ embedded = false }: { embedded?: boolean } = {}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const { toast } = useToast()

  // Form states
  const [formRedes, setFormRedes] = useState<Record<string, boolean>>({})
  const [formTexto, setFormTexto] = useState('')
  const [formHora, setFormHora] = useState('12:00')
  const [formStatus, setFormStatus] = useState('Agendado')
  // Formato do post — adicionado em 20/08/2026 junto com o suporte a Stories
  // no Instagram (publicar-social lê esse campo). Facebook Stories ainda não
  // existe (endpoint diferente, /photo_stories) — selecionar Stories com
  // Facebook marcado faz o post cair em erro em vez de publicar errado no
  // feed. Ver docs/meta-integracao.md.
  const [formContentType, setFormContentType] = useState('feed')
  const [formVeiculoId, setFormVeiculoId] = useState<string>('nenhum')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [veiculos, setVeiculos] = useState<any[]>([])

  useEffect(() => {
    fetchPosts()
    fetchVeiculos()
  }, [currentDate, viewMode])

  // Conexão LinkedIn (21/08/2026) — status da linha única de
  // linkedin_integracao, pra mostrar o botão "Conectar" ou a confirmação de
  // que já está conectado.
  const [linkedinStatus, setLinkedinStatus] = useState<{
    status: string
    author_nome: string | null
    expires_at: string | null
  } | null>(null)
  const [conectandoLinkedin, setConectandoLinkedin] = useState(false)

  useEffect(() => {
    supabase
      .from('linkedin_integracao')
      .select('status, author_nome, expires_at')
      .limit(1)
      .single()
      .then(({ data }) => setLinkedinStatus(data))
  }, [])

  const handleConectarLinkedin = async () => {
    setConectandoLinkedin(true)
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-oauth-start')
      if (error) throw error
      if (data?.authUrl) window.open(data.authUrl, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      toast({ title: 'Erro ao gerar link do LinkedIn', description: e.message, variant: 'destructive' })
    } finally {
      setConectandoLinkedin(false)
    }
  }

  const fetchVeiculos = async () => {
    const { data } = await supabase
      .from('veiculos')
      .select('id, marca, modelo, ano_fabricacao, placa')
      .eq('status', 'Disponivel')
    if (data) setVeiculos(data)
  }

  const fetchPosts = async () => {
    let query = supabase
      .from('social_posts')
      .select('*')
      .order('data_agendamento', { ascending: false })

    if (viewMode === 'calendar') {
      const start = startOfMonth(currentDate).toISOString()
      const end = endOfMonth(currentDate).toISOString()
      query = query.gte('data_agendamento', start).lte('data_agendamento', end)
    }

    const { data, error } = await query

    if (!error && data) {
      setPosts(data as any)
    }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setFormRedes({})
    setFormTexto('')
    setFormHora('12:00')
    setFormStatus('Agendado')
    setFormVeiculoId('nenhum')
    setFormFile(null)
    setFormContentType('feed')
    setIsModalOpen(true)
  }

  const handleGenerateAI = async () => {
    if (!formVeiculoId || formVeiculoId === 'nenhum') {
      toast({
        title: 'Selecione um veículo',
        description: 'É necessário selecionar um veículo para gerar o texto.',
        variant: 'destructive',
      })
      return
    }

    setIsGeneratingAi(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-social', {
        body: { veiculo_id: formVeiculoId },
      })
      if (error) throw error
      if (data?.success) {
        setFormTexto(data.data)
        toast({ title: 'Texto gerado com sucesso!' })
      } else {
        throw new Error(data?.error || 'Erro desconhecido')
      }
    } catch (e: any) {
      toast({ title: 'Erro ao gerar texto', description: e.message, variant: 'destructive' })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0]
      if (f.size > 52428800) {
        // 50MB limit
        toast({
          title: 'Payload too large',
          description: 'Arquivo muito grande. O limite é 50MB.',
          variant: 'destructive',
        })
        return
      }
      setFormFile(f)
    }
  }

  const handlePostClick = (post: SocialPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedPost(post)
    setIsSidebarOpen(true)
  }

  const handleSavePost = async () => {
    if (Object.keys(formRedes).filter((k) => formRedes[k]).length === 0 || !formTexto) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    setLoading(true)
    let imagemUrl = null

    if (formFile) {
      try {
        const fileExt = formFile.name.split('.').pop()
        const path = `social/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('logos-e-imagens')
          .upload(path, formFile)
        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from('logos-e-imagens').getPublicUrl(path)
        imagemUrl = publicUrlData.publicUrl
      } catch (e: any) {
        if (e.message?.includes('Payload too large') || e.statusCode === 413) {
          toast({
            title: 'Payload too large',
            description: 'O arquivo excede o limite permitido de 50MB.',
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Erro no upload', description: e.message, variant: 'destructive' })
        }
        setLoading(false)
        return
      }
    }

    const dataAgendamento = new Date(selectedDate)
    const [hours, minutes] = formHora.split(':')
    dataAgendamento.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0)

    const newPost: any = {
      redes: formRedes,
      texto: formTexto,
      data_agendamento: dataAgendamento.toISOString(),
      status: formStatus,
      imagem: imagemUrl,
      content_type: formContentType,
    }

    if (formVeiculoId && formVeiculoId !== 'nenhum') {
      newPost.veiculo_id = formVeiculoId
    }

    const { error } = await supabase.from('social_posts').insert(newPost)

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Post salvo com sucesso!' })
      setIsModalOpen(false)
      fetchPosts()
    }
    setLoading(false)
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Deseja excluir este post?')) return
    const { error } = await supabase.from('social_posts').delete().eq('id', id)
    if (!error) {
      toast({ title: 'Post excluído' })
      setIsSidebarOpen(false)
      fetchPosts()
    }
  }

  const toggleRede = (rede: string) => {
    setFormRedes((prev) => ({ ...prev, [rede]: !prev[rede] }))
  }

  const filteredPosts = posts.filter((p) => filterStatus === 'todos' || p.status === filterStatus)

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })

  const startDay = startOfMonth(currentDate).getDay()
  const paddingDays = Array.from({ length: startDay }).map(() => subMonths(currentDate, 1))

  return (
    <div className="flex h-full w-full bg-white relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        {/* Header (oculto quando embutido na Central de Redes Sociais, que já tem o seu) */}
        <div className="p-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white z-10">
          {!embedded && (
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Instagram className="w-5 h-5 text-blue-600" />
              Social Media & Automação
            </h1>
          )}

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-slate-100 p-1 rounded-md flex items-center mr-2">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <List className="w-4 h-4 mr-2" /> Lista
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-8"
              >
                <CalendarIcon className="w-4 h-4 mr-2" /> Calendário
              </Button>
            </div>

            <Button onClick={() => handleDayClick(new Date())}>
              <Plus className="w-4 h-4 mr-2" /> Novo Post
            </Button>
          </div>
        </div>

        {/* Status de conexão LinkedIn — 21/08/2026 */}
        {linkedinStatus && linkedinStatus.status !== 'conectado' && (
          <div className="px-4 py-2 border-b bg-blue-50 flex items-center justify-between gap-3 text-sm">
            <span className="text-blue-900">
              LinkedIn ainda não conectado — clique e autorize com a conta que vai assinar os
              posts (publica em nome dessa pessoa, não como página da empresa).
            </span>
            <Button
              size="sm"
              variant="outline"
              className="bg-white shrink-0"
              onClick={handleConectarLinkedin}
              disabled={conectandoLinkedin}
            >
              <Linkedin className="w-4 h-4 mr-2" />
              {conectandoLinkedin ? 'Gerando link...' : 'Conectar LinkedIn'}
            </Button>
          </div>
        )}
        {linkedinStatus?.status === 'conectado' && (
          <div className="px-4 py-2 border-b bg-green-50 text-sm text-green-800">
            LinkedIn conectado como <strong>{linkedinStatus.author_nome || 'perfil'}</strong>
            {linkedinStatus.expires_at &&
              ` — token válido até ${new Date(linkedinStatus.expires_at).toLocaleDateString('pt-BR')}`}
            .
          </div>
        )}

        {/* Filters bar for list view */}
        {viewMode === 'list' && (
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">Filtrar por Status:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-white h-9">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Publicado">Publicado</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
                <SelectItem value="Erro">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* View Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {viewMode === 'calendar' ? (
            <>
              <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg border shadow-sm max-w-xs mx-auto">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="font-semibold capitalize text-slate-700">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden min-w-[800px]">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div
                    key={day}
                    className="bg-slate-100 p-2 text-center font-semibold text-sm text-slate-600"
                  >
                    {day}
                  </div>
                ))}

                {paddingDays.map((_, i) => (
                  <div key={`pad-${i}`} className="bg-white/50 h-[120px] p-2" />
                ))}

                {days.map((date) => {
                  const dayPosts = filteredPosts.filter(
                    (p) =>
                      format(new Date(p.data_agendamento), 'yyyy-MM-dd') ===
                      format(date, 'yyyy-MM-dd'),
                  )

                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => handleDayClick(date)}
                      className={cn(
                        'bg-white h-[120px] p-2 border border-transparent hover:border-blue-300 transition-colors cursor-pointer overflow-y-auto no-scrollbar',
                        isToday(date) && 'border-2 border-blue-500 rounded-sm',
                        !isSameMonth(date, currentDate) && 'opacity-50 bg-slate-50',
                      )}
                    >
                      <div className="text-right text-xs font-bold text-slate-500 mb-1">
                        {format(date, 'd')}
                      </div>
                      <div className="flex flex-col gap-1">
                        {dayPosts.map((post) => {
                          const activeRedes = Object.keys(post.redes || {}).filter(
                            (k) => post.redes[k],
                          )
                          const mainRede = activeRedes[0] || 'instagram'

                          return (
                            <div
                              key={post.id}
                              onClick={(e) => handlePostClick(post, e)}
                              className={cn(
                                'flex items-center gap-1 p-1 rounded text-xs text-white shadow-sm cursor-pointer hover:opacity-90 truncate',
                                NETWORK_COLORS[mainRede] || 'bg-slate-500',
                              )}
                              title={post.texto}
                            >
                              {NETWORK_ICONS[mainRede]}
                              <span className="truncate flex-1">
                                {post.texto.substring(0, 15)}...
                              </span>
                              {post.status === 'Rascunho' && (
                                <span className="text-[9px] bg-white/20 px-1 rounded">Rasc</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Redes</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum post encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => {
                      const activeRedes = Object.keys(post.redes || {}).filter((k) => post.redes[k])

                      return (
                        <TableRow
                          key={post.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handlePostClick(post)}
                        >
                          <TableCell className="whitespace-nowrap font-medium text-slate-600">
                            {post.data_agendamento
                              ? format(new Date(post.data_agendamento), 'dd/MM/yyyy HH:mm')
                              : 'Sem data definida'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {activeRedes.map((r) => (
                                <div
                                  key={r}
                                  className={cn(
                                    'p-1.5 rounded-full shadow-sm',
                                    NETWORK_COLORS[r] || 'bg-slate-500',
                                  )}
                                >
                                  {NETWORK_ICONS[r]}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell
                            className="max-w-[300px] truncate text-slate-700"
                            title={post.texto}
                          >
                            {post.texto}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                post.status === 'Agendado'
                                  ? 'default'
                                  : post.status === 'Rascunho'
                                    ? 'secondary'
                                    : post.status === 'Erro'
                                      ? 'destructive'
                                      : 'outline'
                              }
                            >
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handlePostClick(post, e)}
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {isSidebarOpen && selectedPost && (
        <div className="w-full md:w-[400px] border-l bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.1)] flex flex-col absolute right-0 top-0 bottom-0 z-10 animate-in slide-in-from-right">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold flex items-center gap-2 text-slate-800">Detalhes do Post</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex gap-2 mb-6">
              {Object.keys(selectedPost.redes || {})
                .filter((k) => selectedPost.redes[k])
                .map((r) => (
                  <div
                    key={r}
                    className={cn(
                      'p-2 rounded-full shadow-sm',
                      NETWORK_COLORS[r] || 'bg-slate-500',
                    )}
                  >
                    {NETWORK_ICONS[r]}
                  </div>
                ))}
            </div>

            <div className="mb-4 bg-slate-50 p-3 rounded-lg border">
              <Label className="text-slate-500 text-xs uppercase block mb-1">Data e Hora</Label>
              <p className="font-semibold text-slate-800">
                {selectedPost.data_agendamento
                  ? format(new Date(selectedPost.data_agendamento), 'dd/MM/yyyy • HH:mm')
                  : 'Sem data definida — edite pra agendar'}
              </p>
            </div>

            <div className="mb-4 bg-slate-50 p-3 rounded-lg border">
              <Label className="text-slate-500 text-xs uppercase block mb-1">Status</Label>
              <Badge
                variant={
                  selectedPost.status === 'Agendado'
                    ? 'default'
                    : selectedPost.status === 'Rascunho'
                      ? 'secondary'
                      : selectedPost.status === 'Erro'
                        ? 'destructive'
                        : 'outline'
                }
              >
                {selectedPost.status}
              </Badge>
            </div>

            <div className="mb-4">
              <Label className="text-slate-500 text-xs uppercase block mb-2">
                Conteúdo da Publicação
              </Label>
              <div className="bg-white p-4 rounded-md text-sm whitespace-pre-wrap border shadow-inner leading-relaxed text-slate-700">
                {selectedPost.texto}
              </div>
            </div>

            {selectedPost.imagem && (
              <div className="mb-4">
                <Label className="text-slate-500 text-xs uppercase block mb-2">Mídia Anexada</Label>
                {selectedPost.imagem.match(/\.(mp4|mov|webm)$/i) ? (
                  <video
                    src={selectedPost.imagem}
                    className="rounded-md w-full object-cover border"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={selectedPost.imagem}
                    alt="Post"
                    className="rounded-md w-full object-cover border"
                  />
                )}
              </div>
            )}
          </div>
          <div className="p-4 border-t flex flex-col gap-2 bg-slate-50">
            <Button variant="outline" className="w-full justify-start h-9 bg-white">
              Editar Rascunho
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start h-9"
              onClick={() => handleDeletePost(selectedPost.id)}
            >
              Excluir Definitivamente
            </Button>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Novo Post • {format(selectedDate, 'dd/MM/yyyy')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Redes Sociais Alvo</Label>
              <div className="flex gap-2">
                {['instagram', 'facebook', 'linkedin', 'whatsapp'].map((rede) => (
                  <Button
                    key={rede}
                    type="button"
                    variant={formRedes[rede] ? 'default' : 'outline'}
                    className={cn(
                      'capitalize px-3',
                      formRedes[rede] && NETWORK_COLORS[rede],
                      formRedes[rede] && 'text-white hover:text-white',
                    )}
                    onClick={() => toggleRede(rede)}
                  >
                    {rede}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Formato</Label>
              <Select value={formContentType} onValueChange={setFormContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="reels">Reels</SelectItem>
                </SelectContent>
              </Select>
              {formContentType === 'stories' && formRedes.facebook && (
                <p className="text-xs text-amber-600">
                  Facebook ainda não publica Stories — desmarque o Facebook ou o post vai cair em
                  erro. Funciona só no Instagram por enquanto.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Horário</Label>
                <Input type="time" value={formHora} onChange={(e) => setFormHora(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Status Inicial</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Rascunho">Salvar como Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Veículo Vinculado</Label>
              <Select value={formVeiculoId} onValueChange={setFormVeiculoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum veículo vinculado</SelectItem>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.ano_fabricacao} ({v.placa})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Texto da Publicação</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAi || !formVeiculoId || formVeiculoId === 'nenhum'}
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  {isGeneratingAi ? 'Gerando...' : 'Gerar com IA'}
                </Button>
              </div>
              <Textarea
                placeholder="Escreva a legenda do post ou use a IA nos detalhes do veículo..."
                value={formTexto}
                onChange={(e) => setFormTexto(e.target.value)}
                className="h-32 resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label>Mídia (Opcional - Máx 50MB)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,video/mp4"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              {formFile && (
                <span className="text-xs text-slate-500">Arquivo selecionado: {formFile.name}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : 'Salvar Publicação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
