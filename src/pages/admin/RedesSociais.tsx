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
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface SocialPost {
  id: string
  redes: string[]
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
  const { toast } = useToast()

  // Form states
  const [formRedes, setFormRedes] = useState<string[]>([])
  const [formTexto, setFormTexto] = useState('')
  const [formHora, setFormHora] = useState('12:00')

  useEffect(() => {
    fetchPosts()
  }, [currentDate])

  const fetchPosts = async () => {
    const start = startOfMonth(currentDate).toISOString()
    const end = endOfMonth(currentDate).toISOString()

    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .gte('data_agendamento', start)
      .lte('data_agendamento', end)

    if (!error && data) {
      setPosts(data)
    }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setFormRedes([])
    setFormTexto('')
    setFormHora('12:00')
    setIsModalOpen(true)
  }

  const handlePostClick = (post: SocialPost, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPost(post)
    setIsSidebarOpen(true)
  }

  const handleSavePost = async () => {
    if (formRedes.length === 0 || !formTexto) {
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
      status: 'Agendado',
    }

    const { error } = await supabase.from('social_posts').insert(newPost)

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Post agendado com sucesso!' })
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

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })

  const startDay = startOfMonth(currentDate).getDay()
  const paddingDays = Array.from({ length: startDay }).map((_, i) => subMonths(currentDate, 1))

  return (
    <div className="flex h-full w-full bg-white relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Calendário de Redes Sociais
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold w-40 text-center capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button className="ml-4" onClick={() => handleDayClick(new Date())}>
              <Plus className="w-4 h-4 mr-2" /> Novo Post
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
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
              <div key={`pad-${i}`} className="bg-white/50 h-[100px] p-2" />
            ))}

            {days.map((date) => {
              const dayPosts = posts.filter(
                (p) =>
                  format(new Date(p.data_agendamento), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'),
              )

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'bg-white h-[100px] p-1 border border-transparent hover:border-blue-300 transition-colors cursor-pointer overflow-y-auto no-scrollbar',
                    isToday(date) && 'border-2 border-blue-500 rounded-sm',
                    !isSameMonth(date, currentDate) && 'opacity-50 bg-slate-50',
                  )}
                >
                  <div className="text-right text-xs font-medium text-slate-500 mb-1">
                    {format(date, 'd')}
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={(e) => handlePostClick(post, e)}
                        className={cn(
                          'flex items-center gap-1 p-1 rounded text-xs text-white shadow-sm cursor-pointer hover:opacity-90 truncate',
                          NETWORK_COLORS[post.redes[0]] || 'bg-slate-500',
                        )}
                      >
                        {NETWORK_ICONS[post.redes[0]]}
                        <span className="truncate flex-1">{post.texto.substring(0, 15)}...</span>
                        <span className="text-[10px] opacity-80">
                          {format(new Date(post.data_agendamento), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {posts.length === 0 && (
            <div className="mt-8 text-center text-slate-500">
              Nenhum post agendado este mês. Clique em um dia para criar.
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {isSidebarOpen && selectedPost && (
        <div className="w-full md:w-[350px] border-l bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.1)] flex flex-col absolute right-0 top-0 bottom-0 z-10 animate-in slide-in-from-right">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold">Detalhes do Post</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex gap-2 mb-4">
              {selectedPost.redes.map((r) => (
                <div
                  key={r}
                  className={cn('p-2 rounded-full', NETWORK_COLORS[r] || 'bg-slate-500')}
                >
                  {NETWORK_ICONS[r]}
                </div>
              ))}
            </div>

            <div className="mb-4">
              <Label className="text-slate-500 text-xs uppercase">Data de Agendamento</Label>
              <p className="font-medium">
                {format(new Date(selectedPost.data_agendamento), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>

            <div className="mb-4">
              <Label className="text-slate-500 text-xs uppercase">Status</Label>
              <div className="mt-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                  {selectedPost.status}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <Label className="text-slate-500 text-xs uppercase">Conteúdo</Label>
              <div className="bg-slate-50 p-3 rounded-md mt-1 text-sm whitespace-pre-wrap border">
                {selectedPost.texto}
              </div>
            </div>

            {selectedPost.imagem && (
              <div className="mb-4">
                <img
                  src={selectedPost.imagem}
                  alt="Post"
                  className="rounded-md w-full object-cover max-h-48"
                />
              </div>
            )}
          </div>
          <div className="p-4 border-t flex flex-col gap-2 bg-slate-50">
            <Button variant="outline" className="w-full justify-start h-8">
              Editar Post
            </Button>
            <Button variant="outline" className="w-full justify-start h-8">
              Duplicar
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start h-8"
              onClick={() => handleDeletePost(selectedPost.id)}
            >
              Excluir Post
            </Button>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agendar Post para {format(selectedDate, 'dd/MM/yyyy')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Redes Sociais</Label>
              <div className="flex gap-2">
                {['instagram', 'facebook', 'linkedin', 'whatsapp'].map((rede) => (
                  <Button
                    key={rede}
                    type="button"
                    variant={formRedes.includes(rede) ? 'default' : 'outline'}
                    className={cn(
                      'capitalize px-3',
                      formRedes.includes(rede) && NETWORK_COLORS[rede],
                      formRedes.includes(rede) && 'text-white hover:text-white',
                    )}
                    onClick={() => {
                      if (formRedes.includes(rede))
                        setFormRedes(formRedes.filter((r) => r !== rede))
                      else setFormRedes([...formRedes, rede])
                    }}
                  >
                    {rede}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Horário</Label>
              <Input type="time" value={formHora} onChange={(e) => setFormHora(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Texto do Post</Label>
              <Textarea
                placeholder="O que você quer compartilhar?"
                value={formTexto}
                onChange={(e) => setFormTexto(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePost} disabled={loading}>
              {loading ? 'Salvando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
