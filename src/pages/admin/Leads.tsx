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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Search,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  FileText,
  Kanban,
  List,
  Trash,
  Bot,
  Car,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { KanbanBoard } from '@/components/admin/leads/KanbanBoard'
import { ConversationPanel } from '@/components/admin/leads/ConversationPanel'
import { getOriginIcon } from '@/lib/lead-origin'
import { BellRing, Activity, AlertTriangle, Zap } from 'lucide-react'

// Agrupa valores de `tipo` por significado — 'compra' (ML/site) e 'comprador'
// (Clara) representam a mesma coisa com nomes diferentes por origem (ver
// docs/leads-e-sdr.md). 'interesse' é valor legado, mesmo sentido.
const TIPO_FILTROS: Record<string, string[]> = {
  comprar: ['compra', 'comprador', 'interesse'],
  vendedor: ['vendedor'],
  troca: ['troca'],
  consignacao: ['consignacao'],
  financiamento: ['financiamento'],
  seguro_auto: ['seguro_auto'],
  consorcio: ['consorcio'],
}

export default function AdminLeads() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [loading, setLoading] = useState(true)

  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({})
  const [veiculosMap, setVeiculosMap] = useState<Record<string, any>>({})
  const [linkedVeiculo, setLinkedVeiculo] = useState<any>(null)

  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false)
  const [searchVeiculo, setSearchVeiculo] = useState('')
  const [veiculosBusca, setVeiculosBusca] = useState<any[]>([])

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [hasSimulation, setHasSimulation] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch (e) {
      console.warn('Audio play failed', e)
    }
  }

  useEffect(() => {
    loadInitialData()

    const leadsChannel = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playNotificationSound()
          toast({ title: 'Novo lead recebido!', description: payload.new.nome, variant: 'default' })
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('Novo Lead Recebido!', {
              body: `${payload.new.nome} - ${payload.new.carro_modelo || 'Contato'}`,
            })
          }
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
    if (selectedLead) {
      checkSimulation(selectedLead)
    }
    if (selectedLead?.veiculo_id) {
      const v = veiculosMap[selectedLead.veiculo_id]
      setLinkedVeiculo(v || null)
    } else {
      setLinkedVeiculo(null)
    }
  }, [selectedLead?.id, selectedLead?.veiculo_id])

  const checkSimulation = async (lead: any) => {
    if (!lead.telefone) {
      setHasSimulation(false)
      return
    }
    const cleanPhone = lead.telefone.replace(/\D/g, '')
    const { data } = await supabase
      .from('simulacoes')
      .select('id')
      .eq('cliente_telefone', cleanPhone)
      .maybeSingle()
    setHasSimulation(!!data)
  }

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

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [{ data: usersData }, { data: veicsData }] = await Promise.all([
        supabase.from('usuarios').select('id, nome'),
        supabase.from('veiculos').select('*'),
      ])

      if (usersData) {
        const uMap: Record<string, string> = {}
        usersData.forEach((u) => (uMap[u.id] = u.nome))
        setUsuariosMap(uMap)
      }

      if (veicsData) {
        const vMap: Record<string, any> = {}
        veicsData.forEach((v) => (vMap[v.id] = v))
        setVeiculosMap(vMap)
      }

      await loadLeads()
    } catch (err: any) {
      toast({ title: 'Erro ao carregar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadLeads = async () => {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (search)
      query = query.or(
        `nome.ilike.%${search}%,carro_modelo.ilike.%${search}%,telefone.ilike.%${search}%`,
      )
    if (tipoFilter !== 'todos') query = query.in('tipo', TIPO_FILTROS[tipoFilter] || [tipoFilter])
    const { data } = await query
    if (data) setLeads(data)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, tipoFilter])

  const updateLeadField = async (field: string, value: any) => {
    setSelectedLead((prev: any) => ({ ...prev, [field]: value }))
    await supabase
      .from('leads')
      .update({ [field]: value })
      .eq('id', selectedLead.id)
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

  const generateAndSendProposal = async () => {
    if (!selectedLead || !linkedVeiculo || !selectedLead.telefone) {
      toast({ title: 'Vincule um veículo e telefone para gerar proposta.', variant: 'destructive' })
      return
    }
    setIsGeneratingPdf(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-proposta', {
        body: { veiculo: linkedVeiculo, cliente: selectedLead },
      })
      if (error) throw error
      if (data?.url) {
        const cleanPhone = selectedLead.telefone.replace(/\D/g, '')
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'document',
            to: cleanPhone,
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

  const getStatusColor = (status: string) => {
    if (status === 'novo') return 'bg-blue-100 text-blue-800'
    if (status === 'em_contato') return 'bg-amber-100 text-amber-800'
    if (status === 'agendamento') return 'bg-purple-100 text-purple-800'
    if (status === 'visita') return 'bg-indigo-100 text-indigo-800'
    if (status === 'fechado') return 'bg-green-100 text-green-800'
    if (status === 'perdido') return 'bg-red-100 text-red-800'
    return 'bg-slate-100 text-slate-800'
  }

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">Carregando CRM...</div>
    )

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-white relative">
      <div className="p-3 border-b bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" /> Command Center CRM
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar lead..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="comprar">Quer comprar</SelectItem>
              <SelectItem value="vendedor">Quer vender</SelectItem>
              <SelectItem value="troca">Quer trocar</SelectItem>
              <SelectItem value="consignacao">Quer consignar</SelectItem>
              <SelectItem value="financiamento">Quer financiar</SelectItem>
              <SelectItem value="seguro_auto">Seguro auto (Gabriel)</SelectItem>
              <SelectItem value="consorcio">Consórcio (Adriana)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md p-1 bg-slate-50">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                setViewMode('kanban')
                setSelectedLead(null)
              }}
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
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative w-full">
        {viewMode === 'kanban' && !selectedLead ? (
          <KanbanBoard
            leads={leads}
            veiculosMap={veiculosMap}
            usuariosMap={usuariosMap}
            onStatusChange={async (leadId: string, status: string) => {
              setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
              await supabase.from('leads').update({ status }).eq('id', leadId)
            }}
            onSelectLead={(l: any) => {
              setSelectedLead(l)
              setViewMode('list')
            }}
            selectedLeadId={selectedLead?.id}
          />
        ) : (
          <>
            {/* COLUMN 1: Lead Inbox (20%) */}
            <div className="w-[20%] min-w-[260px] max-w-[320px] border-r flex flex-col bg-slate-50 shrink-0 h-full">
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer border transition-all',
                        selectedLead?.id === lead.id
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-white hover:border-slate-300',
                      )}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getOriginIcon(lead.origem || lead.source)}
                          <span className="font-bold text-sm truncate text-slate-800">
                            {lead.nome || 'Sem Nome'}
                          </span>
                        </div>
                        <Badge className={cn('text-[9px] px-1.5 h-4', getStatusColor(lead.status))}>
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-1 mb-1">
                        {lead.observacoes || lead.carro_modelo || 'Novo Lead'}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t pt-2">
                        <span>
                          {lead.responsavel_id ? usuariosMap[lead.responsavel_id] : 'Sem Vendedor'}
                        </span>
                        <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* COLUMN 2: Chat Timeline (50%) — extraído pra ConversationPanel (Fase 4) */}
            <div className="flex-1 min-w-[400px] border-r h-full">
              <ConversationPanel
                lead={selectedLead}
                usuariosMap={usuariosMap}
                onBack={() => {
                  setViewMode('kanban')
                  setSelectedLead(null)
                }}
              />
            </div>

            {/* COLUMN 3: Lead Management (30%) */}
            {selectedLead && (
              <div className="w-[30%] min-w-[320px] bg-slate-50 flex flex-col h-full shrink-0">
                <ScrollArea className="flex-1 p-4">
                  {/* "Cliente chegou" (12/08/2026) — mover Agendamentos ->
                      Visitas é sempre ação manual de um vendedor, o sistema
                      não tem como saber sozinho que o cliente chegou
                      fisicamente na loja (decisão da Adriana). */}
                  {selectedLead.status === 'agendamento' && (
                    <Button
                      size="sm"
                      className="w-full mb-2 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => updateLeadField('status', 'visita')}
                    >
                      <Car className="w-4 h-4 mr-1" /> Cliente chegou
                    </Button>
                  )}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                      onClick={() => updateLeadField('status', 'fechado')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Venda Fechada
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 border-red-200 flex-1"
                      onClick={() => updateLeadField('status', 'perdido')}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Perdido
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-600 hover:bg-slate-100 px-2"
                      onClick={() => handleDeleteLead(selectedLead.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        Assistente Clara (IA)
                      </span>
                    </div>
                    <Switch
                      checked={selectedLead.ai_enabled ?? true}
                      onCheckedChange={(v) => updateLeadField('ai_enabled', v)}
                    />
                  </div>

                  {/* AI Qualification Widget */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl shadow-md mb-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                      <Zap className="w-16 h-16" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" /> Esquenta Lead (IA)
                    </h4>
                    <div className="flex items-center gap-4">
                      {/* Circular Gauge */}
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-slate-700"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="175.93"
                            strokeDashoffset={
                              175.93 -
                              (175.93 *
                                (selectedLead.ai_score ||
                                  (selectedLead.temperatura === 'quente'
                                    ? 90
                                    : selectedLead.temperatura === 'morno'
                                      ? 60
                                      : 30))) /
                                100
                            }
                            className={cn(
                              'transition-all duration-1000',
                              selectedLead.temperatura === 'quente'
                                ? 'text-red-500'
                                : selectedLead.temperatura === 'morno'
                                  ? 'text-amber-500'
                                  : 'text-blue-500',
                            )}
                          />
                        </svg>
                        <span className="absolute text-sm font-bold">
                          {selectedLead.ai_score ||
                            (selectedLead.temperatura === 'quente'
                              ? 90
                              : selectedLead.temperatura === 'morno'
                                ? 60
                                : 30)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                          {selectedLead.ai_summary ||
                            'O assistente está analisando as intenções de compra do cliente em tempo real.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">
                          Veículo de Interesse
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-blue-600 px-2 hover:bg-blue-50"
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
                          <p className="text-xs text-slate-500 mb-3">
                            {linkedVeiculo.ano_fabricacao}/{linkedVeiculo.ano_modelo}
                          </p>
                          <Button
                            className="w-full bg-slate-800 hover:bg-slate-900"
                            size="sm"
                            onClick={generateAndSendProposal}
                            disabled={isGeneratingPdf}
                          >
                            <FileText className="w-4 h-4 mr-2" /> Gerar Proposta PDF Automática
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

                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                      <Label className="text-xs font-bold text-slate-500 uppercase block border-b pb-2">
                        Ficha de Negociação (Auto-fill IA)
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">
                            Carro na Troca
                          </Label>
                          <Input
                            value={selectedLead.trade_in_car || ''}
                            onChange={(e) => updateLeadField('trade_in_car', e.target.value)}
                            placeholder="Ex: Honda Civic 2020"
                            className="h-8 text-sm bg-slate-50 focus-visible:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">
                            Valor de Entrada
                          </Label>
                          <Input
                            value={selectedLead.faixa_preco || ''}
                            onChange={(e) => updateLeadField('faixa_preco', e.target.value)}
                            placeholder="Ex: R$ 20.000"
                            className="h-8 text-sm bg-slate-50 focus-visible:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">
                            Forma de Pagamento
                          </Label>
                          <Input
                            value={selectedLead.payment_method || ''}
                            onChange={(e) => updateLeadField('payment_method', e.target.value)}
                            placeholder="Ex: Financiamento Banco X"
                            className="h-8 text-sm bg-slate-50 focus-visible:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'p-4 rounded-xl border transition-colors',
                        selectedLead.payment_method?.toLowerCase().includes('financiamento') &&
                          !hasSimulation
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-100',
                      )}
                    >
                      <h4
                        className={cn(
                          'font-bold text-sm mb-2 flex items-center gap-2',
                          selectedLead.payment_method?.toLowerCase().includes('financiamento') &&
                            !hasSimulation
                            ? 'text-red-800 animate-pulse'
                            : 'text-blue-800',
                        )}
                      >
                        {selectedLead.payment_method?.toLowerCase().includes('financiamento') &&
                          !hasSimulation && <AlertTriangle className="w-4 h-4 shrink-0" />}
                        Simulador de Financiamento
                      </h4>
                      {selectedLead.payment_method?.toLowerCase().includes('financiamento') &&
                        !hasSimulation && (
                          <p className="text-xs text-red-600 mb-3 font-medium">
                            Lead interessado em financiamento, mas sem simulação iniciada!
                          </p>
                        )}
                      <Button
                        className={cn(
                          'w-full',
                          selectedLead.payment_method?.toLowerCase().includes('financiamento') &&
                            !hasSimulation
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white',
                        )}
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/admin/financiamento?lead_id=${selectedLead.id}&veiculo_id=${selectedLead.veiculo_id || ''}`,
                          )
                        }
                      >
                        Abrir Simulador Completo
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </div>

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
                  onClick={() => {
                    updateLeadField('veiculo_id', v.id)
                    setIsVeiculoModalOpen(false)
                  }}
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

    </div>
  )
}
