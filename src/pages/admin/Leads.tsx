import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Target, Kanban, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { KanbanBoard } from '@/components/admin/leads/KanbanBoard'
import { ConversationPanel } from '@/components/admin/leads/ConversationPanel'
import { MotivoPerdaModal } from '@/components/admin/leads/MotivoPerdaModal'
import { LeadManagementPanel } from '@/components/admin/leads/LeadManagementPanel'
import { getOriginIcon } from '@/lib/lead-origin'

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
  const [agendamentosMap, setAgendamentosMap] = useState<Record<string, any>>({})

  const [leadIdPendenteMotivo, setLeadIdPendenteMotivo] = useState<string | null>(null)

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

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [{ data: usersData }, { data: veicsData }, { data: agsData }] = await Promise.all([
        supabase.from('usuarios').select('id, nome'),
        supabase.from('veiculos').select('*'),
        // Pra badge de "Agendamento" + "Atrasado" no card do Kanban — pega
        // todos e mantém só o mais recente por lead no map abaixo (a lista
        // já vem ordenada, então o último visto por lead_id vence).
        supabase
          .from('agendamentos_visita')
          .select('lead_id, data_hora, status')
          .order('data_hora', { ascending: true }),
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

      if (agsData) {
        const aMap: Record<string, any> = {}
        agsData.forEach((a) => {
          aMap[a.lead_id] = a
        })
        setAgendamentosMap(aMap)
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

      <MotivoPerdaModal
        open={!!leadIdPendenteMotivo}
        onCancel={() => setLeadIdPendenteMotivo(null)}
        onConfirm={async (motivo) => {
          const leadId = leadIdPendenteMotivo
          if (!leadId) return
          setLeads((prev) =>
            prev.map((l) =>
              l.id === leadId ? { ...l, status: 'perdido', motivo_perda: motivo } : l,
            ),
          )
          await supabase
            .from('leads')
            .update({ status: 'perdido', motivo_perda: motivo })
            .eq('id', leadId)
          setLeadIdPendenteMotivo(null)
        }}
      />

      <div className="flex-1 overflow-hidden flex relative w-full">
        {viewMode === 'kanban' && !selectedLead ? (
          <KanbanBoard
            leads={leads}
            veiculosMap={veiculosMap}
            usuariosMap={usuariosMap}
            agendamentosMap={agendamentosMap}
            onStatusChange={async (leadId: string, status: string) => {
              // "Perdido" pede o motivo antes de aplicar (pedido da Adriana,
              // 15/09/2026) -- ver MotivoPerdaModal. Cancelar não move o card.
              if (status === 'perdido') {
                setLeadIdPendenteMotivo(leadId)
                return
              }
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
                        <span>
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}{' '}
                          {new Date(lead.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
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
                onBack={() => {
                  setViewMode('kanban')
                  setSelectedLead(null)
                }}
                onLeadUpdated={loadLeads}
              />
            </div>

            {/* COLUMN 3: Lead Management (30%) — extraído pra LeadManagementPanel
                (15/09/2026) pra reaproveitar também no Conversador. */}
            {selectedLead && (
              <LeadManagementPanel
                lead={selectedLead}
                veiculosMap={veiculosMap}
                onFieldUpdate={updateLeadField}
                onPerdido={() => setLeadIdPendenteMotivo(selectedLead.id)}
                onDelete={() => handleDeleteLead(selectedLead.id)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
