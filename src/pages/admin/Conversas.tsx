import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Bot, Headphones, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOriginIcon } from '@/lib/lead-origin'
import { ConversationPanel } from '@/components/admin/leads/ConversationPanel'

// Fase 4 do plano "Clara ponta a ponta" — tela dedicada às conversas,
// separada do Kanban de leads (docs/leads-e-sdr.md). Reaproveita o
// ConversationPanel extraído de Leads.tsx. Referência visual: capturas do
// Venda.IA (13/08/2026) — abas "Atendendo" x "IA", lista à esquerda + chat.
export default function Conversas() {
  const [tab, setTab] = useState<'ia' | 'humano'>('ia')
  const [leads, setLeads] = useState<any[]>([])
  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({})
  const [ultimaMsgPorLead, setUltimaMsgPorLead] = useState<
    Record<string, { texto: string; em: string; sender: string }>
  >({})
  const [search, setSearch] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()

    const leadsChannel = supabase
      .channel('conversas-leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads((prev) => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLeads((prev) => prev.map((l) => (l.id === payload.new.id ? payload.new : l)))
        } else if (payload.eventType === 'DELETE') {
          setLeads((prev) => prev.filter((l) => l.id !== payload.old.id))
        }
      })
      .subscribe()

    const messagesChannel = supabase
      .channel('conversas-messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_history' },
        (payload) => {
          const msg = payload.new as any
          if (msg.sender === 'internal_note') return
          setUltimaMsgPorLead((prev) => ({
            ...prev,
            [msg.lead_id]: { texto: msg.message_text, em: msg.created_at, sender: msg.sender },
          }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    const [{ data: leadsData }, { data: usersData }, { data: mensagensData }] = await Promise.all([
      supabase.from('leads').select('*').order('updated_at', { ascending: false }),
      supabase.from('usuarios').select('id, nome'),
      supabase
        .from('conversation_history')
        .select('lead_id, message_text, sender, created_at')
        .neq('sender', 'internal_note')
        .order('created_at', { ascending: false })
        .limit(1000),
    ])

    if (leadsData) setLeads(leadsData)
    if (usersData) {
      const uMap: Record<string, string> = {}
      usersData.forEach((u) => (uMap[u.id] = u.nome))
      setUsuariosMap(uMap)
    }
    if (mensagensData) {
      const map: Record<string, { texto: string; em: string; sender: string }> = {}
      // Vem ordenado do mais recente pro mais antigo — a primeira ocorrência
      // de cada lead_id já é a última mensagem dele.
      for (const m of mensagensData) {
        if (!map[m.lead_id]) {
          map[m.lead_id] = { texto: m.message_text, em: m.created_at, sender: m.sender }
        }
      }
      setUltimaMsgPorLead(map)
    }
    setLoading(false)
  }

  const leadsComAtividade = useMemo(() => {
    return leads
      .filter((l) => ultimaMsgPorLead[l.id]) // só quem já trocou mensagem
      .map((l) => ({ ...l, _ultimaMsg: ultimaMsgPorLead[l.id] }))
      .sort(
        (a, b) => new Date(b._ultimaMsg.em).getTime() - new Date(a._ultimaMsg.em).getTime(),
      )
  }, [leads, ultimaMsgPorLead])

  const filtrados = useMemo(() => {
    let list = leadsComAtividade.filter((l) =>
      tab === 'humano' ? l.ai_enabled === false : l.ai_enabled !== false,
    )
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.nome?.toLowerCase().includes(q) ||
          l.telefone?.includes(q) ||
          l.carro_modelo?.toLowerCase().includes(q) ||
          l.veiculo_interesse?.toLowerCase().includes(q),
      )
    }
    return list
  }, [leadsComAtividade, tab, search])

  const countHumano = leadsComAtividade.filter((l) => l.ai_enabled === false).length
  const countIa = leadsComAtividade.filter((l) => l.ai_enabled !== false).length

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null

  const naoLida = (lead: any) => {
    const ultima = ultimaMsgPorLead[lead.id]
    if (!ultima || ultima.sender === 'human' || ultima.sender === 'bot') return false
    if (!lead.ultima_leitura_humana) return true
    return new Date(ultima.em) > new Date(lead.ultima_leitura_humana)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        Carregando conversas...
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
      {/* Lista de conversas */}
      <div className="w-[320px] min-w-[280px] border-r flex flex-col bg-slate-50 shrink-0 h-full">
        <div className="p-3 border-b bg-white shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" /> Conversador
          </h2>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome, telefone ou veículo"
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-md p-1 bg-slate-100">
            <button
              onClick={() => setTab('humano')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition-colors',
                tab === 'humano' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500',
              )}
            >
              <Headphones className="w-3.5 h-3.5" /> Atendendo
              {countHumano > 0 && (
                <Badge className="h-4 px-1.5 text-[10px] bg-slate-700">{countHumano}</Badge>
              )}
            </button>
            <button
              onClick={() => setTab('ia')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition-colors',
                tab === 'ia' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500',
              )}
            >
              <Bot className="w-3.5 h-3.5" /> Clara (IA)
              {countIa > 0 && (
                <Badge className="h-4 px-1.5 text-[10px] bg-blue-600">{countIa}</Badge>
              )}
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1.5">
            {filtrados.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma conversa aqui.</p>
            )}
            {filtrados.map((lead) => {
              const unread = naoLida(lead)
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={cn(
                    'p-2.5 rounded-lg cursor-pointer border transition-all flex gap-2.5 items-start',
                    selectedLeadId === lead.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white hover:border-slate-300',
                  )}
                >
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                      {lead.nome?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <span
                        className={cn(
                          'text-sm truncate',
                          unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700',
                        )}
                      >
                        {lead.nome || 'Sem Nome'}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(lead._ultimaMsg.em).toLocaleString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getOriginIcon(lead.origem || lead.source)}
                      <p
                        className={cn(
                          'text-xs truncate',
                          unread ? 'text-slate-700 font-medium' : 'text-slate-400',
                        )}
                      >
                        {lead._ultimaMsg.texto}
                      </p>
                    </div>
                  </div>
                  {unread && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Painel de chat */}
      <ConversationPanel lead={selectedLead} usuariosMap={usuariosMap} />
    </div>
  )
}
