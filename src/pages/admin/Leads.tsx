import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { useNavigate } from 'react-router-dom'

export default function AdminLeads() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('todos')
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data) {
        setLeads(data)
        if (data.length > 0 && !selectedLead) {
          setSelectedLead(data[0])
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro ao carregar leads', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedLead) {
      loadConversation(selectedLead.id)
    }
  }, [selectedLead])

  const loadConversation = async (leadId: string) => {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (!error && data) {
      setConversation(data)
    }
  }

  const handleTemperatureChange = async (newTemp: string) => {
    if (!selectedLead) return
    try {
      const { error } = await supabase
        .from('leads')
        .update({ temperatura: newTemp })
        .eq('id', selectedLead.id)
      if (error) throw error
      toast({ title: 'Temperatura atualizada com sucesso' })
      setSelectedLead({ ...selectedLead, temperatura: newTemp })
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, temperatura: newTemp } : l)),
      )
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLead) return
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', selectedLead.id)
      if (error) throw error
      toast({ title: 'Status atualizado com sucesso' })
      setSelectedLead({ ...selectedLead, status: newStatus })
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus } : l)),
      )
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedLead) return
    const newMsg = {
      lead_id: selectedLead.id,
      sender: 'human',
      message_text: message,
    }
    try {
      const { error } = await supabase.from('conversation_history').insert([newMsg])
      if (error) throw error
      setConversation([...conversation, { ...newMsg, created_at: new Date().toISOString() }])
      setMessage('')
      toast({ title: 'Mensagem enviada com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    }
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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        Carregando CRM...
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-white border rounded-xl shadow-sm mx-4 my-4 max-w-[1600px] xl:mx-auto">
      {/* COLUNA ESQUERDA: LISTA DE LEADS */}
      <div className="w-1/4 min-w-[300px] border-r flex flex-col bg-slate-50/50">
        <div className="p-4 border-b bg-white">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" /> Caixa de Entrada
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar lead ou veículo..."
              className="pl-9 bg-slate-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            <Badge
              variant={filterStatus === 'todos' ? 'secondary' : 'outline'}
              className={cn('cursor-pointer', filterStatus === 'todos' ? 'bg-slate-200' : '')}
              onClick={() => setFilterStatus('todos')}
            >
              Todos
            </Badge>
            <Badge
              variant={filterStatus === 'novos' ? 'secondary' : 'outline'}
              className={cn('cursor-pointer', filterStatus === 'novos' ? 'bg-slate-200' : '')}
              onClick={() => setFilterStatus('novos')}
            >
              Novos
            </Badge>
            <Badge
              variant={filterStatus === 'pendentes' ? 'secondary' : 'outline'}
              className={cn('cursor-pointer', filterStatus === 'pendentes' ? 'bg-slate-200' : '')}
              onClick={() => setFilterStatus('pendentes')}
            >
              Pendentes
            </Badge>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-colors border',
                  selectedLead?.id === lead.id
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-white border-transparent hover:border-slate-200',
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-slate-800 truncate">
                    {lead.nome || 'Sem Nome'}
                  </span>
                  <Badge
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-4 font-semibold',
                      getStatusColor(lead.status),
                    )}
                  >
                    {lead.status === 'novo' ? 'NOVO' : lead.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 truncate mb-2">
                  Interesse: {lead.carro_modelo || lead.veiculo_interesse || 'Não especificado'}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Hoje
                  </span>
                  <span className="truncate max-w-[100px]">{lead.origem || 'Site'}</span>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && (
              <div className="text-center p-4 text-sm text-slate-500">Nenhum lead encontrado.</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* COLUNA CENTRAL: CONVERSA E DASHBOARD */}
      <div className="flex-1 flex flex-col min-w-[400px]">
        {selectedLead ? (
          <>
            {/* Header do Lead */}
            <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                    {selectedLead.nome?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {selectedLead.nome || 'Lead Sem Nome'}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedLead.telefone || 'Sem telefone'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {selectedLead.email || 'Sem email'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                  onClick={() =>
                    selectedLead.telefone &&
                    window.open(getWhatsAppLink('Olá!', selectedLead.telefone), '_blank')
                  }
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Chamar no WhatsApp
                </Button>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Timeline / Chat */}
            <ScrollArea className="flex-1 bg-[#E5DDD5]/20 p-4">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* System Message - Veículo de Interesse */}
                <div className="flex justify-center">
                  <div className="bg-slate-100 border text-slate-600 text-xs px-4 py-2 rounded-full font-medium shadow-sm">
                    Lead originado via {selectedLead.origem || 'Site'}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Card do Veículo */}
                  <div className="self-start max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200">
                    <p className="text-xs text-blue-600 font-bold mb-2">Interesse do Cliente:</p>
                    <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl">
                      <div className="w-16 h-12 bg-slate-200 rounded flex items-center justify-center">
                        <Car className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 leading-tight">
                          {selectedLead.carro_marca}{' '}
                          {selectedLead.carro_modelo || selectedLead.veiculo_interesse}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedLead.carro_ano} • {selectedLead.carro_placa}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens da Conversa */}
                  {conversation.length === 0 ? (
                    <div className="self-start max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200">
                      <p className="text-sm text-slate-700">
                        Nenhuma mensagem ainda. Inicie o contato via Pedro (IA).
                      </p>
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
                          <p className="text-[10px] text-blue-600 font-bold mb-1">
                            🤖 Pedro (IA SDR)
                          </p>
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
              </div>
            </ScrollArea>
            {/* Input Area */}
            <div className="bg-white border-t flex flex-col">
              <div className="flex gap-2 p-2 px-4 border-b bg-slate-50 overflow-x-auto text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={async () => {
                    toast({ title: 'Enviando proposta por e-mail...' })
                    await supabase.functions.invoke('send-lead-email', {
                      body: {
                        nome: selectedLead.nome,
                        email: selectedLead.email,
                        telefone: selectedLead.telefone,
                        mensagem: 'Proposta gerada automaticamente pelo sistema',
                        veiculo: selectedLead.carro_modelo || selectedLead.veiculo_interesse,
                      },
                    })
                    toast({ title: 'Proposta enviada ao e-mail do cliente!' })
                  }}
                >
                  <Mail className="w-3 h-3 mr-1" /> Enviar Proposta E-mail
                </Button>
              </div>
              <div className="p-4 flex gap-2 items-center">
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite uma mensagem para o cliente..."
                  className="flex-1 bg-slate-50 border-slate-200"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                {message ? (
                  <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>{' '}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-4">
            <Target className="w-12 h-12 opacity-20" />
            <p>Selecione um lead para iniciar a negociação</p>
          </div>
        )}
      </div>

      {/* COLUNA DIREITA: PERFIL E AÇÕES */}
      {selectedLead && (
        <div className="w-1/4 min-w-[300px] border-l bg-slate-50 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Gestão do Lead</h3>

            <div className="space-y-6">
              {/* Temperatura */}
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

              {/* Ações de Fechamento */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  Finalizar Negociação
                </label>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStatusChange('fechado')}
                    className="w-full bg-green-600 hover:bg-green-700 justify-start"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Venda Realizada
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('perdido')}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 justify-start"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Negócio Perdido
                  </Button>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase block border-b pb-2">
                  Dados do Cliente
                </label>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nome</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLead.nome}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Telefone</p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedLead.telefone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">E-mail</p>
                  <p className="text-sm font-medium text-slate-800 break-all">
                    {selectedLead.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Origem</p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedLead.source || selectedLead.origem || 'Site'}
                  </p>
                </div>
                {selectedLead.trade_in_car && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Carro na Troca</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedLead.trade_in_car}
                    </p>
                  </div>
                )}
                {selectedLead.payment_method && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Forma Pagamento
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedLead.payment_method}
                    </p>
                  </div>
                )}
              </div>

              {/* Simulador */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 text-sm mb-2">Simulador de Financiamento</h4>
                <p className="text-xs text-blue-600 mb-3">
                  Gere uma simulação rápida para este lead baseado no valor do veículo.
                </p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
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
      )}
    </div>
  )
}
