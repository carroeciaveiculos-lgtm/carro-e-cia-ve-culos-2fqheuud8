import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Send,
  CheckCircle,
  Calculator,
  XCircle,
  Car,
  User,
  Clock,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export default function AdminLeads() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [leads, setLeads] = useState<any[]>([])
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [listFilter, setListFilter] = useState('todos')

  const [interacoes, setInteracoes] = useState<any[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [isNotaInterna, setIsNotaInterna] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadLeads = async () => {
    let query = supabase
      .from('leads')
      .select('*, veiculos(*)')
      .order('created_at', { ascending: false })
    if (search) query = query.ilike('nome', `%${search}%`)

    const { data } = await query
    if (data) {
      let filtered = data
      if (listFilter === 'pendentes')
        filtered = data.filter((l) => ['novo', 'pendente', 'Pendente'].includes(l.status))
      if (listFilter === 'andamento')
        filtered = data.filter((l) => ['em_contato', 'negociando'].includes(l.status))
      if (listFilter === 'agendados') filtered = data.filter((l) => l.status === 'agendado')
      setLeads(filtered)
    }
  }

  const loadInteracoes = async (leadId: string) => {
    const { data } = await supabase
      .from('interacoes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (data) setInteracoes(data)
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 100)
  }

  useEffect(() => {
    loadLeads()
  }, [listFilter, search])

  useEffect(() => {
    if (activeLeadId) loadInteracoes(activeLeadId)
  }, [activeLeadId])

  const activeLead = leads.find((l) => l.id === activeLeadId)

  const updateLeadStatus = async (status: string) => {
    if (!activeLeadId) return
    await supabase.from('leads').update({ status }).eq('id', activeLeadId)
    toast({ title: 'Status atualizado' })
    loadLeads()
  }

  const updateLeadTemp = async (temperatura: string) => {
    if (!activeLeadId) return
    await supabase.from('leads').update({ temperatura }).eq('id', activeLeadId)
    toast({ title: 'Temperatura atualizada' })
    loadLeads()
  }

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !activeLeadId) return

    await supabase.from('interacoes').insert({
      lead_id: activeLeadId,
      usuario_id: user?.id,
      tipo: isNotaInterna ? 'nota_interna' : 'mensagem_enviada',
      descricao: novaMensagem.trim(),
      canal: 'sistema',
    })

    setNovaMensagem('')
    loadInteracoes(activeLeadId)
    toast({ title: isNotaInterna ? 'Nota salva' : 'Mensagem registrada' })
  }

  const isSlaViolated = (createdAt: string, status: string) => {
    if (!['novo', 'Pendente', 'pendente'].includes(status)) return false
    return (new Date().getTime() - new Date(createdAt).getTime()) / 60000 > 15
  }

  return (
    <div className="flex-1 flex bg-[#F4F6F8] -m-4 md:-m-8 h-[calc(100vh-100px)] overflow-hidden">
      {/* COLUNA ESQUERDA: LISTA DE LEADS */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r flex flex-col z-10 shadow-sm shrink-0">
        <div className="p-4 border-b space-y-3 bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Gestão de Leads
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {['todos', 'pendentes', 'andamento', 'agendados'].map((f) => (
              <Button
                key={f}
                variant={listFilter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setListFilter(f)}
                className={cn(
                  'capitalize text-xs h-7 px-3 rounded-full',
                  listFilter === f ? 'bg-blue-600' : 'bg-white text-slate-600',
                )}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {leads.map((lead) => {
              const sla = isSlaViolated(lead.created_at, lead.status)
              const v = lead.veiculos || null

              return (
                <button
                  key={lead.id}
                  onClick={() => setActiveLeadId(lead.id)}
                  className={cn(
                    'p-4 text-left border-b hover:bg-blue-50/50 transition-colors relative flex flex-col gap-2',
                    activeLeadId === lead.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : 'border-l-4 border-l-transparent',
                  )}
                >
                  {sla && (
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full bg-red-500 animate-pulse"
                      title="SLA Estourado"
                    />
                  )}

                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-sm text-slate-800 truncate pr-2 flex items-center gap-1.5">
                      {lead.nome}{' '}
                      {lead.temperatura === 'quente' && (
                        <span className="text-red-500 text-xs">🔥</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600"
                    >
                      {lead.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 h-4 truncate max-w-[100px] border-slate-200 text-slate-500"
                    >
                      {lead.origem}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-1">
                    <Car className="w-3.5 h-3.5" />
                    {v
                      ? `${v.marca} ${v.modelo}`
                      : lead.carro_modelo || lead.veiculo_interesse || 'Sem veículo especificado'}
                  </p>
                </button>
              )
            })}
            {leads.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">Nenhum lead encontrado.</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* COLUNA CENTRAL: NEGOCIAÇÃO */}
      {activeLead ? (
        <div className="flex-1 flex flex-col relative min-w-0 bg-[#F4F6F8]">
          {/* Header do Lead / Veículo */}
          <div className="bg-white border-b p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm z-10">
            <div className="flex items-center gap-4 w-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-lg flex items-center justify-center border shrink-0 overflow-hidden">
                {activeLead.veiculos?.fotos?.[0] ? (
                  <img src={activeLead.veiculos.fotos[0]} className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-slate-800 truncate">
                  {activeLead.veiculos
                    ? `${activeLead.veiculos.marca} ${activeLead.veiculos.modelo}`
                    : activeLead.carro_modelo || 'Veículo não vinculado'}
                </h3>
                <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {activeLead.origem}
                  </Badge>
                  {activeLead.veiculos?.placa && <span>Placa: {activeLead.veiculos.placa}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <a
                href={`https://wa.me/${activeLead.telefone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none"
              >
                <Button size="sm" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
              </a>
              <a href={`tel:${activeLead.telefone}`} className="flex-1 sm:flex-none">
                <Button size="sm" variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" /> Ligar
                </Button>
              </a>
            </div>
          </div>

          {/* Timeline de Conversa */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" ref={scrollRef}>
            <div className="text-center">
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                Início do Atendimento: {new Date(activeLead.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Mensagem Inicial do Sistema */}
            <div className="flex flex-col max-w-[85%] sm:max-w-[75%] rounded-xl p-3 sm:p-4 text-sm bg-white border border-slate-200 text-slate-700 self-start shadow-sm relative">
              <div className="font-bold text-[10px] mb-2 text-slate-400 uppercase flex items-center gap-1.5">
                <User className="w-3 h-3" /> Cliente (Via {activeLead.origem})
              </div>
              <p className="whitespace-pre-wrap">
                {activeLead.observacoes ||
                  activeLead.veiculo_interesse ||
                  'Lead cadastrado sem mensagem.'}
              </p>
              <span className="text-[9px] text-slate-400 mt-2 block text-right">
                {new Date(activeLead.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Interações */}
            {interacoes.map((i) => (
              <div
                key={i.id}
                className={cn(
                  'flex flex-col max-w-[85%] sm:max-w-[75%] rounded-xl p-3 sm:p-4 text-sm shadow-sm relative',
                  i.tipo === 'nota_interna'
                    ? 'mx-auto bg-[#FFF9C4] text-[#827717] border border-[#FFF59D]'
                    : 'ml-auto bg-[#E3F2FD] border border-[#BBDEFB] text-[#0D47A1]',
                )}
              >
                <div className="font-bold text-[10px] mb-2 opacity-60 uppercase flex items-center gap-1.5">
                  {i.tipo === 'nota_interna' ? (
                    <>
                      <Clock className="w-3 h-3" /> Nota Interna
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" /> Vendedor
                    </>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{i.descricao}</p>
                <span className="text-[9px] opacity-60 mt-2 block text-right">
                  {new Date(i.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>

          {/* Área de Input */}
          <div className="bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border">
                <Switch
                  checked={isNotaInterna}
                  onCheckedChange={setIsNotaInterna}
                  id="nota"
                  className="scale-75"
                />
                <Label
                  htmlFor="nota"
                  className={cn(
                    'text-xs cursor-pointer font-medium',
                    isNotaInterna ? 'text-amber-600' : 'text-slate-500',
                  )}
                >
                  {isNotaInterna ? 'Modo: Nota Interna' : 'Modo: Registro de Mensagem'}
                </Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder={
                  isNotaInterna
                    ? 'Digite uma observação apenas para a equipe...'
                    : 'Registre a mensagem enviada ao cliente...'
                }
                className={cn(
                  'resize-none min-h-[60px]',
                  isNotaInterna ? 'bg-amber-50 focus-visible:ring-amber-400' : 'bg-white',
                )}
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviarMensagem()
                  }
                }}
              />
              <Button
                onClick={enviarMensagem}
                className={cn(
                  'h-auto px-6',
                  isNotaInterna
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700',
                )}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-[#F4F6F8]">
          <Target className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Selecione um lead para iniciar a negociação</p>
        </div>
      )}

      {/* COLUNA DIREITA: PERFIL E AÇÕES */}
      {activeLead && (
        <div className="hidden lg:flex w-80 bg-white border-l flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.03)] shrink-0 overflow-y-auto">
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5" /> Perfil do Cliente
            </h2>

            <div className="space-y-5">
              <div>
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Nome Completo
                </Label>
                <p className="font-medium text-slate-800 mt-1">{activeLead.nome}</p>
              </div>

              <div>
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Contato
                </Label>
                <p className="font-medium text-slate-800 mt-1">{activeLead.telefone}</p>
                {activeLead.email && (
                  <p className="text-sm text-slate-600 mt-0.5 break-all">{activeLead.email}</p>
                )}
              </div>

              {activeLead.carro_modelo && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Veículo na Troca
                  </Label>
                  <p className="font-medium text-slate-800 mt-1">
                    {activeLead.carro_modelo} {activeLead.carro_ano}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Placa: {activeLead.carro_placa} • {activeLead.carro_km} km
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-b bg-slate-50 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              Gestão do Lead
            </h3>

            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Temperatura</Label>
              <Select value={activeLead.temperatura || 'frio'} onValueChange={updateLeadTemp}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frio">❄️ Frio</SelectItem>
                  <SelectItem value="morno">🔥 Morno</SelectItem>
                  <SelectItem value="quente">🚨 Quente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Status no Funil</Label>
              <Select value={activeLead.status} onValueChange={updateLeadStatus}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo / Pendente</SelectItem>
                  <SelectItem value="em_contato">Em Contato</SelectItem>
                  <SelectItem value="negociando">Em Negociação</SelectItem>
                  <SelectItem value="agendado">Visita Agendada</SelectItem>
                  <SelectItem value="fechado">Venda Fechada (Ganho)</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 space-y-3 mt-auto">
            <Button variant="outline" className="w-full justify-start text-slate-700 bg-white">
              <Calculator className="w-4 h-4 mr-3 text-blue-600" /> Simulador Financiamento
            </Button>
            <Button
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
              onClick={() => updateLeadStatus('fechado')}
            >
              <CheckCircle className="w-4 h-4 mr-3" /> Marcar como Vendido
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => updateLeadStatus('perdido')}
            >
              <XCircle className="w-4 h-4 mr-3" /> Arquivar / Perdido
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
