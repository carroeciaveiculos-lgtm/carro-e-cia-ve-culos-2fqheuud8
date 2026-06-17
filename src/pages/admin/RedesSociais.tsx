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

export default function RedesSociais() {
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

  useEffect(() => {
    fetchPosts()
  }, [currentDate, viewMode])

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
    setIsModalOpen(true)
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
    const dataAgendamento = new Date(selectedDate)
    const [hours, minutes] = formHora.split(':')
    dataAgendamento.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0)

    const newPost = {
      redes: formRedes,
      texto: formTexto,
      data_agendamento: dataAgendamento.toISOString(),
      status: formStatus,
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
        {/* Header */}
        <div className="p-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Instagram className="w-5 h-5 text-blue-600" />
            Social Media & Automação
          </h1>

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
                            {format(new Date(post.data_agendamento), 'dd/MM/yyyy HH:mm')}
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
                {format(new Date(selectedPost.data_agendamento), 'dd/MM/yyyy • HH:mm')}
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
              <Label>Texto da Publicação</Label>
              <Textarea
                placeholder="Escreva a legenda do post ou use a IA nos detalhes do veículo..."
                value={formTexto}
                onChange={(e) => setFormTexto(e.target.value)}
                className="h-32 resize-none"
              />
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
