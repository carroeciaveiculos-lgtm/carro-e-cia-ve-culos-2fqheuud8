import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  User,
  Car,
  Clock,
  Send,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Paperclip,
  Mic,
  Thermometer,
  Target,
  Instagram,
  Facebook,
  Globe,
  AlertTriangle,
  Lock,
  Plus,
  FileText,
  Kanban,
  List,
  Trash,
  Edit,
  Bot,
  StickyNote,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

const COLUMNS = [
  { id: 'novo', title: 'Novos', border: 'border-blue-200' },
  { id: 'em_contato', title: 'Em Contato', border: 'border-amber-200' },
  { id: 'negociando', title: 'Negociando', border: 'border-purple-200' },
  { id: 'fechado', title: 'Vendido', border: 'border-green-200' },
  { id: 'perdido', title: 'Perdido', border: 'border-red-200' },
]

export default function AdminLeads() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<any[]>([])
  const [internalNotes, setInternalNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')

  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({})
  const [linkedVeiculo, setLinkedVeiculo] = useState<any>(null)

  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false)
  const [searchVeiculo, setSearchVeiculo] = useState('')
  const [veiculosBusca, setVeiculosBusca] = useState<any[]>([])

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [leadForm, setLeadForm] = useState<any>({})

  useEffect(() => {
    loadInitialData()

    const leadsChannel = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads((prev) => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLeads((prev) => prev.map((l) => (l.id === payload.new.id ? payload.new : l)))
          setSelectedLead((curr) => (curr?.id === payload.new.id ? payload.new : curr))
        } else if (payload.eventType === 'DELETE') {
          setLeads((prev) => prev.filter((l) => l.id !== payload.old.id))
          setSelectedLead((curr) => (curr?.id === payload.old.id ? null : curr))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(leadsChannel)
    }
  }, [])

  useEffect(() => {
    if (!selectedLead) return

    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_history',
          filter: `lead_id=eq.${selectedLead.id}`,
        },
        (payload) =>
          setConversation((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new],
          ),
      )
      .subscribe()

    const notesChannel = supabase
      .channel('notes_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_notes',
          filter: `lead_id=eq.${selectedLead.id}`,
        },
        () => loadInternalNotes(selectedLead.id),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(notesChannel)
    }
  }, [selectedLead?.id])

  useEffect(() => {
    if (selectedLead) {
      loadConversation(selectedLead.id)
      loadInternalNotes(selectedLead.id)
    }
    if (selectedLead?.veiculo_id) {
      supabase
        .from('veiculos')
        .select('*')
        .eq('id', selectedLead.veiculo_id)
        .single()
        .then(({ data }) => setLinkedVeiculo(data))
    } else {
      setLinkedVeiculo(null)
    }
  }, [selectedLead?.id, selectedLead?.veiculo_id])

  useEffect(() => {
    if (isVeiculoModalOpen) {
      const fetchVeiculos = async () => {
        let q = supabase.from('veiculos').select('*').eq('status', 'disponivel')
        if (searchVeiculo) q = q.ilike('modelo', `%${searchVeiculo}%`)
        const { data } = await q.limit(20)
        if (data) setVeiculosBusca(data)
      }
      fetchVeiculos()
    }
  }, [isVeiculoModalOpen, searchVeiculo])

  useEffect(() => {
    if (isTemplateModalOpen) {
      supabase
        .from('whatsapp_templates')
        .select('*')
        .then(({ data }) => {
          if (data) setTemplates(data)
        })
    }
  }, [isTemplateModalOpen])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [leadsRes, usersRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('usuarios').select('id, nome'),
      ])
      if (usersRes.data) {
        const uMap: Record<string, string> = {}
        usersRes.data.forEach((u) => (uMap[u.id] = u.nome))
        setUsuariosMap(uMap)
      }
      if (leadsRes.data) {
        setLeads(leadsRes.data)
      }
    } catch (err: any) {
      toast({ title: 'Erro ao carregar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (leadId: string) => {
    const { data } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (data) setConversation(data)
  }

  const loadInternalNotes = async (leadId: string) => {
    const { data } = await supabase
      .from('internal_notes')
      .select('*, author:usuarios(nome)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (data) setInternalNotes(data)
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
  }

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
      await supabase.from('leads').update({ status }).eq('id', leadId)
    }
  }

  const saveInternalNote = async () => {
    if (!newNote.trim() || !selectedLead) return
    try {
      await supabase.from('internal_notes').insert({
        lead_id: selectedLead.id,
        author_id: user?.id,
        content: newNote,
      })
      setNewNote('')
    } catch (err: any) {
      toast({ title: 'Erro ao salvar nota', description: err.message, variant: 'destructive' })
    }
  }

  const toggleAI = async (checked: boolean) => {
    if (!selectedLead) return
    setSelectedLead((prev: any) => ({ ...prev, ai_enabled: checked }))
    await supabase.from('leads').update({ ai_enabled: checked }).eq('id', selectedLead.id)
    toast({ title: checked ? 'Assistente IA Ativado' : 'Assistente IA Desativado' })
  }

  const handleSaveLead = async () => {
    try {
      if (leadForm.id) {
        await supabase.from('leads').update(leadForm).eq('id', leadForm.id)
        toast({ title: 'Lead atualizado com sucesso' })
      } else {
        const { id, ...data } = leadForm
        await supabase.from('leads').insert([data])
        toast({ title: 'Lead criado com sucesso' })
      }
      setIsLeadModalOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead permanentemente?')) return
    try {
      await supabase.from('leads').delete().eq('id', id)
      toast({ title: 'Lead excluído' })
      if (selectedLead?.id === id) setSelectedLead(null)
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const handleLinkVeiculo = async (veiculo: any) => {
    if (!selectedLead) return
    try {
      await supabase
        .from('leads')
        .update({ veiculo_id: veiculo.id, veiculo_interesse: veiculo.modelo })
        .eq('id', selectedLead.id)
      setIsVeiculoModalOpen(false)
      toast({ title: 'Veículo vinculado com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro ao vincular', description: err.message, variant: 'destructive' })
    }
  }

  const handleTemperatureChange = async (newTemp: string) => {
    if (!selectedLead) return
    await supabase.from('leads').update({ temperatura: newTemp }).eq('id', selectedLead.id)
    toast({ title: 'Temperatura atualizada' })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLead) return
    await supabase.from('leads').update({ status: newStatus }).eq('id', selectedLead.id)
    toast({ title: 'Status atualizado com sucesso' })
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedLead) return
    try {
      if (selectedLead.telefone) {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'text',
            to: selectedLead.telefone,
            text: message,
            leadId: selectedLead.id,
          },
        })
      } else {
        await supabase
          .from('conversation_history')
          .insert([{ lead_id: selectedLead.id, sender: 'human', message_text: message }])
      }
      setMessage('')
      toast({ title: 'Mensagem enviada com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    }
  }

  const sendTemplate = async (templateName: string) => {
    if (!selectedLead?.telefone) return
    try {
      await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'template',
          to: selectedLead.telefone,
          templateName,
          leadId: selectedLead.id,
        },
      })
      setIsTemplateModalOpen(false)
      toast({ title: 'Template enviado com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar template', description: err.message, variant: 'destructive' })
    }
  }

  const generateAndSendProposal = async () => {
    if (!selectedLead || !linkedVeiculo || !selectedLead.telefone) {
      toast({
        title: 'Vincule um veículo e garanta que o lead tem telefone',
        variant: 'destructive',
      })
      return
    }
    setIsGeneratingPdf(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-proposta', {
        body: { veiculo: linkedVeiculo, cliente: selectedLead },
      })
      if (error) throw error
      if (data?.url) {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'document',
            to: selectedLead.telefone,
            documentUrl: data.url,
            filename: `Proposta_${linkedVeiculo.modelo.replace(/\s+/g, '_')}.pdf`,
            text: `Olá ${selectedLead.nome}, segue a proposta do ${linkedVeiculo.modelo}!`,
            leadId: selectedLead.id,
          },
        })
        toast({ title: 'Proposta enviada por WhatsApp!' })
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar proposta', description: err.message, variant: 'destructive' })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const getOriginIcon = (origem?: string) => {
    const o = origem?.toLowerCase() || ''
    if (o.includes('whatsapp') || o.includes('wpp'))
      return <MessageCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
    if (o.includes('instagram') || o.includes('ig'))
      return <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
    if (o.includes('facebook') || o.includes('fb'))
      return <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
    return <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
  }

  const getTemperatureColor = (temp?: string) => {
    switch (temp) {
      case 'quente':
        return 'bg-red-100 text-red-800'
      case 'morno':
        return 'bg-amber-100 text-amber-800'
      case 'frio':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo':
        return 'bg-blue-100 text-blue-800'
      case 'em_contato':
        return 'bg-amber-100 text-amber-800'
      case 'negociando':
        return 'bg-purple-100 text-purple-800'
      case 'fechado':
        return 'bg-green-100 text-green-800'
      case 'perdido':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getSessionInfo = (conv: any[]) => {
    const lastClientMsg = [...conv].reverse().find((m) => m.sender === 'client')
    if (!lastClientMsg) return { active: false, hoursLeft: 0 }
    const diffMs = new Date().getTime() - new Date(lastClientMsg.created_at).getTime()
    const hoursLeft = 24 - diffMs / (1000 * 60 * 60)
    return { active: hoursLeft > 0, hoursLeft: Math.max(0, hoursLeft) }
  }

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.nome?.toLowerCase().includes(search.toLowerCase()) ||
      l.carro_modelo?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filterStatus === 'todos'
        ? true
        : filterStatus === 'novos'
          ? l.status === 'novo'
          : filterStatus === 'pendentes'
            ? ['em_contato', 'negociando'].includes(l.status)
            : true
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        Carregando CRM...
      </div>
    )
  }

  const sessionInfo = getSessionInfo(conversation)

  const LeadDetailPanel = () => (
    <div className="flex-1 flex w-full h-full flex-col md:flex-row bg-white">
      {/* CENTRAL: CONVERSA E NOTAS */}
      <div className="flex-1 flex flex-col min-w-[300px] border-r">
        {/* Header do Lead */}
        <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                {selectedLead.nome?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {selectedLead.nome || 'Lead Sem Nome'}
                <Badge
                  className={cn('text-[10px] px-1', getTemperatureColor(selectedLead.temperatura))}
                >
                  {selectedLead.temperatura || 'frio'}
                </Badge>
              </h3>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {selectedLead.telefone || 'Sem telefone'}
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hidden sm:flex"
            onClick={() =>
              selectedLead.telefone &&
              window.open(getWhatsAppLink('Olá!', selectedLead.telefone), '_blank')
            }
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>

        {/* TABS: Chat vs Internal Notes */}
        <Tabs
          defaultValue="chat"
          className="flex-1 flex flex-col h-full bg-[#E5DDD5]/20 overflow-hidden"
        >
          <div className="px-4 py-2 border-b bg-white flex items-center justify-between shrink-0">
            <TabsList>
              <TabsTrigger value="chat" className="text-xs">
                <MessageCircle className="w-3 h-3 mr-1" /> Conversa (Cliente)
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">
                <StickyNote className="w-3 h-3 mr-1" /> Notas Internas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="chat"
            className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col"
          >
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {conversation.length === 0 ? (
                  <div className="self-start max-w-[80%] bg-white p-3 rounded-2xl shadow-sm border text-sm text-slate-700">
                    Nenhuma mensagem ainda. Inicie o contato.
                  </div>
                ) : (
                  conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'max-w-[80%] p-3 shadow-sm border border-slate-200',
                        msg.sender === 'bot'
                          ? 'self-start bg-blue-50 rounded-2xl rounded-tl-none border-blue-200'
                          : msg.sender === 'client'
                            ? 'self-start bg-white rounded-2xl rounded-tl-none'
                            : 'self-end bg-green-50 rounded-2xl rounded-tr-none border-green-200',
                      )}
                    >
                      {msg.sender === 'bot' && (
                        <p className="text-[10px] text-blue-600 font-bold mb-1">🤖 Luiz (IA)</p>
                      )}
                      {msg.sender === 'human' && (
                        <p className="text-[10px] text-green-600 font-bold mb-1">👤 Você</p>
                      )}
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {msg.message_text}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="bg-white border-t flex flex-col shrink-0">
              {sessionInfo.active ? (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] text-blue-700">
                    Sessão ativa: {sessionInfo.hoursLeft.toFixed(1)}h restantes.
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] text-amber-700">
                    Sessão expirada. Envio livre bloqueado.
                  </span>
                </div>
              )}
              <div className="p-3 flex gap-2 items-center">
                {sessionInfo.active ? (
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-slate-50"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                ) : (
                  <Button
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setIsTemplateModalOpen(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Selecionar Template Meta
                  </Button>
                )}
                {message && sessionInfo.active && (
                  <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="notes"
            className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col bg-slate-50"
          >
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg shadow-sm"
                  >
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                      <span className="font-bold">{note.author?.nome || 'Sistema'}</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {internalNotes.length === 0 && (
                  <p className="text-center text-slate-400 text-sm mt-10">Nenhuma nota interna.</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 bg-white border-t flex gap-2 shrink-0">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Adicionar nota para a equipe..."
                onKeyDown={(e) => e.key === 'Enter' && saveInternalNote()}
              />
              <Button
                onClick={saveInternalNote}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Salvar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIREITA: PERFIL, GESTÃO E VEÍCULO */}
      <div className="w-full md:w-[320px] bg-slate-50 flex flex-col shrink-0">
        <ScrollArea className="flex-1 p-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setLeadForm({ ...selectedLead })
                setIsLeadModalOpen(true)
              }}
            >
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 flex-1"
              onClick={() => handleDeleteLead(selectedLead.id)}
            >
              <Trash className="w-4 h-4 mr-1" /> Excluir
            </Button>
          </div>

          <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">Assistente IA (Luiz)</span>
            </div>
            <Switch checked={selectedLead.ai_enabled ?? true} onCheckedChange={toggleAI} />
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Thermometer className="w-4 h-4" /> Temperatura
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    'h-8 text-xs',
                    selectedLead.temperatura === 'quente' &&
                      'bg-red-50 border-red-300 text-red-700',
                  )}
                  onClick={() => handleTemperatureChange('quente')}
                >
                  Quente
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    'h-8 text-xs',
                    selectedLead.temperatura === 'morno' &&
                      'bg-amber-50 border-amber-300 text-amber-700',
                  )}
                  onClick={() => handleTemperatureChange('morno')}
                >
                  Morno
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    'h-8 text-xs',
                    selectedLead.temperatura === 'frio' &&
                      'bg-blue-50 border-blue-300 text-blue-700',
                  )}
                  onClick={() => handleTemperatureChange('frio')}
                >
                  Frio
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Status (Pipeline)
              </label>
              <div className="grid gap-2">
                <Button
                  onClick={() => handleStatusChange('fechado')}
                  className="w-full bg-green-600 hover:bg-green-700 justify-start h-8 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Venda Realizada
                </Button>
                <Button
                  onClick={() => handleStatusChange('perdido')}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 justify-start h-8 text-xs"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Negócio Perdido
                </Button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Veículo de Interesse
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-blue-600 px-2"
                  onClick={() => setIsVeiculoModalOpen(true)}
                >
                  <Search className="w-3 h-3" />
                </Button>
              </div>
              {linkedVeiculo ? (
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {linkedVeiculo.marca} {linkedVeiculo.modelo}
                  </p>
                  <p className="text-xs text-slate-500">
                    {linkedVeiculo.ano_fabricacao}/{linkedVeiculo.ano_modelo}
                  </p>
                  <Button
                    className="w-full mt-2"
                    size="sm"
                    onClick={generateAndSendProposal}
                    disabled={isGeneratingPdf}
                  >
                    <FileText className="w-4 h-4 mr-2" /> Gerar Proposta PDF
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-800">
                  {selectedLead.carro_modelo ||
                    selectedLead.veiculo_interesse ||
                    'Não especificado'}
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase block border-b pb-2">
                Dados do Cliente
              </label>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Nome</p>
                <p className="text-sm font-medium">{selectedLead.nome}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Telefone</p>
                <p className="text-sm font-medium">{selectedLead.telefone || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">E-mail</p>
                <p className="text-sm font-medium break-all">{selectedLead.email || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Origem</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  {getOriginIcon(selectedLead.origem || selectedLead.source)}{' '}
                  {selectedLead.source || selectedLead.origem || 'Site'}
                </p>
              </div>
              {selectedLead.trade_in_car && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Carro na Troca</p>
                  <p className="text-sm font-medium">{selectedLead.trade_in_car}</p>
                </div>
              )}
              {selectedLead.payment_method && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Forma de Pagamento
                  </p>
                  <p className="text-sm font-medium">{selectedLead.payment_method}</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-800 text-sm mb-2">Simulador de Financiamento</h4>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
                onClick={() =>
                  navigate(
                    `/admin/financiamento?lead_id=${selectedLead.id}&veiculo_id=${selectedLead.veiculo_id || ''}`,
                  )
                }
              >
                Abrir Simulador
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  const KanbanBoard = () => (
    <div className="flex-1 flex overflow-x-auto gap-4 p-4 items-start bg-slate-50">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className={cn(
            'min-w-[300px] w-[300px] bg-white rounded-xl flex flex-col h-[calc(100vh-180px)] border-t-4 shadow-sm',
            col.border,
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="p-3 border-b flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-700 text-sm">
              {col.title} ({filteredLeads.filter((l) => l.status === col.id).length})
            </h3>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-3 min-h-[100px] pb-4">
              {filteredLeads
                .filter((l) => l.status === col.id)
                .map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => setSelectedLead(lead)}
                    className={cn(
                      'bg-white p-3 rounded-lg border-y border-r border-l-4 shadow-sm cursor-pointer transition-colors',
                      lead.temperatura === 'quente'
                        ? 'border-l-red-500'
                        : lead.temperatura === 'morno'
                          ? 'border-l-amber-500'
                          : 'border-l-blue-500',
                      selectedLead?.id === lead.id
                        ? 'ring-2 ring-blue-500'
                        : 'hover:border-slate-300',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-sm truncate text-slate-800">{lead.nome}</span>
                      <Badge
                        className={cn(
                          'text-[10px] px-1 h-4',
                          getTemperatureColor(lead.temperatura),
                        )}
                      >
                        {lead.temperatura || 'frio'}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                      <Car className="w-3 h-3" />{' '}
                      <span className="truncate">
                        {lead.carro_modelo || lead.veiculo_interesse || 'Não especificado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />{' '}
                        <span className="truncate max-w-[80px]">
                          {usuariosMap[lead.responsavel_id] || 'Sem Atendente'}
                        </span>
                      </span>
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-white border rounded-xl shadow-sm mx-4 my-4 max-w-[1600px] xl:mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" /> CRM Pipeline
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar lead..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-md p-1 bg-slate-50">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setLeadForm({ status: 'novo', temperatura: 'frio' })
              setIsLeadModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex relative">
        {viewMode === 'list' ? (
          <>
            <div className="w-[300px] border-r flex flex-col bg-slate-50 shrink-0">
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer border',
                        selectedLead?.id === lead.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white hover:border-slate-300',
                      )}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-bold text-sm truncate">
                          {lead.nome || 'Sem Nome'}
                        </span>
                        <Badge
                          className={cn('text-[10px] px-1.5 h-4', getStatusColor(lead.status))}
                        >
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                        <span>
                          <Car className="w-3 h-3 inline mr-1" />
                          {lead.veiculo_interesse || 'Nenhum'}
                        </span>
                        <Badge
                          className={cn(
                            'text-[9px] px-1 h-3',
                            getTemperatureColor(lead.temperatura),
                          )}
                        >
                          {lead.temperatura}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {selectedLead ? (
              <LeadDetailPanel />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <Target className="w-12 h-12 opacity-20 mr-2" /> Selecione um lead
              </div>
            )}
          </>
        ) : (
          <KanbanBoard />
        )}
      </div>

      {/* Kanban Sheet Details */}
      <Sheet
        open={viewMode === 'kanban' && !!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      >
        <SheetContent side="right" className="w-[90vw] sm:max-w-5xl p-0 flex flex-col">
          {selectedLead && <LeadDetailPanel />}
        </SheetContent>
      </Sheet>

      {/* Manual Lead Create/Edit Modal */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{leadForm.id ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={leadForm.nome || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={leadForm.telefone || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={leadForm.email || ''}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Veículo de Interesse</Label>
                <Input
                  value={leadForm.veiculo_interesse || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, veiculo_interesse: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Input
                  value={leadForm.origem || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, origem: e.target.value })}
                  placeholder="Ex: Site, WhatsApp, Indicação"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Carro na Troca</Label>
                <Input
                  value={leadForm.trade_in_car || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, trade_in_car: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Input
                  value={leadForm.payment_method || ''}
                  onChange={(e) => setLeadForm({ ...leadForm, payment_method: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveLead}>Salvar Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals Extras (Veículo e Template) */}
      <Dialog open={isVeiculoModalOpen} onOpenChange={setIsVeiculoModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pesquisar no Estoque</DialogTitle>
          </DialogHeader>
          <div className="p-2 pb-0">
            <Input
              placeholder="Buscar por modelo ou marca..."
              value={searchVeiculo}
              onChange={(e) => setSearchVeiculo(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1 mt-2">
            <div className="grid grid-cols-2 gap-3 p-2">
              {veiculosBusca.map((v) => (
                <div
                  key={v.id}
                  className="border rounded-lg p-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleLinkVeiculo(v)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {v.marca} {v.modelo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.ano_fabricacao}/{v.ano_modelo} - {v.placa}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selecionar Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {templates.map((t) => (
              <div
                key={t.id}
                className="border p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => sendTemplate(t.nome)}
              >
                <p className="font-bold text-sm">{t.nome}</p>
                <p className="text-xs text-slate-500 mt-1">{t.corpo}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
