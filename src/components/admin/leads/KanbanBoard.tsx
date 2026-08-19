import { cn } from '@/lib/utils'
import {
  Car,
  User,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Flame,
  ThermometerSnowflake,
  ThermometerSun,
  Clock,
  Store,
  Target,
  Phone,
  Bot,
  CalendarClock,
  DollarSign,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Pipeline nova (12/08/2026, pedido da Adriana): "Negociando/Propostas"
// removida (sem lead nenhum lá no dia da mudança, sem backfill necessário);
// "Agendamentos" e "Visitas" são novas — ver docs/leads-e-sdr.md.
const COLUMNS = [
  { id: 'novo', title: 'Lead', color: 'border-blue-200 bg-blue-50 text-blue-800' },
  { id: 'em_contato', title: 'Em Contato', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  { id: 'agendamento', title: 'Agendamentos', color: 'border-purple-200 bg-purple-50 text-purple-800' },
  { id: 'visita', title: 'Visitas', color: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
  { id: 'fechado', title: 'Vendas', color: 'border-green-200 bg-green-50 text-green-800' },
  { id: 'perdido', title: 'Perdido', color: 'border-red-200 bg-red-50 text-red-800' },
]

export function KanbanBoard({
  leads,
  onStatusChange,
  onSelectLead,
  usuariosMap,
  selectedLeadId,
  veiculosMap = {},
  agendamentosMap = {},
}: any) {
  const getOriginIcon = (origem?: string) => {
    const o = origem?.toLowerCase() || ''
    if (o.includes('whatsapp') || o.includes('wpp'))
      return <MessageCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
    if (o.includes('instagram') || o.includes('ig'))
      return <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
    if (o.includes('facebook') || o.includes('fb'))
      return <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
    if (o.includes('icarros')) return <Car className="w-3.5 h-3.5 text-orange-500 shrink-0" />
    if (o.includes('mercado livre') || o.includes('mercadolivre') || o.includes('ml'))
      return <Store className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
    if (o.includes('webmotors')) return <Target className="w-3.5 h-3.5 text-red-600 shrink-0" />
    return <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
  }

  // Badge de canal explícito (pedido da Adriana, 17/08/2026 — comparando
  // com o Venda.iA, que mostra "WhatsApp"/"META ADS"/"Mercado Livre" em
  // texto, não só um ícone pequeno).
  const getChannelBadge = (origem?: string, source?: string) => {
    const o = (origem || source || '').toLowerCase()
    if (o.includes('whatsapp') || o.includes('wpp'))
      return { label: 'WhatsApp', className: 'bg-green-100 text-green-700' }
    if (o.includes('facebook_ads') || o.includes('instagram_ads'))
      return { label: 'Meta Ads', className: 'bg-indigo-100 text-indigo-700' }
    if (o.includes('instagram')) return { label: 'Instagram', className: 'bg-pink-100 text-pink-700' }
    if (o.includes('facebook')) return { label: 'Facebook', className: 'bg-blue-100 text-blue-700' }
    if (o.includes('mercado livre') || o.includes('mercadolivre'))
      return { label: 'Mercado Livre', className: 'bg-yellow-100 text-yellow-700' }
    if (o.includes('webmotors')) return { label: 'Webmotors', className: 'bg-red-100 text-red-700' }
    if (o.includes('icarros')) return { label: 'iCarros', className: 'bg-orange-100 text-orange-700' }
    if (o.includes('meta_lead_ads')) return { label: 'Meta Lead Ads', className: 'bg-indigo-100 text-indigo-700' }
    if (o.includes('google_ads')) return { label: 'Google Ads', className: 'bg-blue-100 text-blue-700' }
    if (o.includes('manual')) return { label: 'Manual', className: 'bg-slate-100 text-slate-600' }
    if (o.includes('site') || !o || o === '/' || o.startsWith('/'))
      return { label: 'Site', className: 'bg-slate-100 text-slate-600' }
    return { label: origem || source || 'Outro', className: 'bg-slate-100 text-slate-600' }
  }

  const formatDateCurta = (dateString?: string) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return (
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' às ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  }

  const formatCurrency = (val: any) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0)

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return (
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
      ' - ' +
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    )
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-slate-200')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-slate-200')
  }

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-slate-200')
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) onStatusChange(leadId, colId)
  }

  const getTemperatureBadge = (temp: string) => {
    if (temp === 'quente')
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 text-[9px] px-1 h-4 flex gap-1">
          <Flame className="w-2.5 h-2.5" /> Quente
        </Badge>
      )
    if (temp === 'morno')
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-[9px] px-1 h-4 flex gap-1">
          <ThermometerSun className="w-2.5 h-2.5" /> Morno
        </Badge>
      )
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-[9px] px-1 h-4 flex gap-1">
        <ThermometerSnowflake className="w-2.5 h-2.5" /> Frio
      </Badge>
    )
  }

  return (
    <div className="flex h-full gap-4 p-4 overflow-x-auto bg-slate-50 w-full animate-fade-in">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l: any) => l.status === col.id)
        const totalValue = colLeads.reduce((acc: number, l: any) => {
          const veic = veiculosMap[l.veiculo_id]
          return acc + (Number(veic?.preco_venda) || Number(l.valor_veiculo) || 0)
        }, 0)

        return (
          <div
            key={col.id}
            className="flex flex-col min-w-[280px] max-w-[280px] bg-slate-100 rounded-xl border shadow-sm h-full overflow-hidden transition-colors"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={cn('p-3 border-b flex flex-col gap-1', col.color)}>
              <div className="flex justify-between items-center font-bold text-sm">
                <span>
                  {col.title} ({colLeads.length})
                </span>
              </div>
              <span className="text-[10px] font-semibold opacity-70">
                Potencial: {formatCurrency(totalValue)}
              </span>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2 pb-4 min-h-[50px]">
                {colLeads.map((lead: any) => {
                  // Corrigido em 12/08/2026: usava lead.status === 'novo' como
                  // proxy (e ainda dizia "LUIZ"). Agora reflete
                  // leads.ai_enabled de verdade — o mesmo campo que separa as
                  // duas colunas da tela "Conversador" (Fase 4).
                  const respName = lead.responsavel_id
                    ? usuariosMap[lead.responsavel_id]
                    : lead.ai_enabled !== false
                      ? 'Clara (IA)'
                      : 'Sem Atendente'
                  const veic = veiculosMap[lead.veiculo_id]
                  const thumb = veic?.fotos?.[0]
                  const valorLead = Number(veic?.preco_venda) || Number(lead.valor_veiculo) || 0
                  const canal = getChannelBadge(lead.origem, lead.source)
                  const agendamento = agendamentosMap[lead.id]
                  const agendamentoAtrasado =
                    agendamento?.status === 'agendado' && new Date(agendamento.data_hora) < new Date()

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('leadId', lead.id)
                        e.currentTarget.style.opacity = '0.5'
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onClick={() => onSelectLead(lead)}
                      className={cn(
                        'bg-white p-3 rounded-lg shadow-sm border-y border-r border-l-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md group flex flex-col',
                        lead.temperatura === 'quente'
                          ? 'border-l-red-500'
                          : lead.temperatura === 'morno'
                            ? 'border-l-amber-500'
                            : 'border-l-blue-500',
                        selectedLeadId === lead.id
                          ? 'ring-2 ring-blue-500'
                          : 'hover:border-slate-300',
                      )}
                    >
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          {getOriginIcon(lead.origem || lead.source)}
                          <span
                            className="font-bold text-sm text-slate-800 truncate"
                            title={lead.nome}
                          >
                            {lead.nome || 'Sem Nome'}
                          </span>
                        </div>
                        {getTemperatureBadge(lead.temperatura)}
                      </div>

                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        <Badge className={cn('text-[9px] px-1.5 h-4 font-medium', canal.className)}>
                          {canal.label}
                        </Badge>
                        {lead.ai_enabled !== false && (
                          <Badge className="text-[9px] px-1.5 h-4 font-medium bg-teal-100 text-teal-700 flex gap-1">
                            <Bot className="w-2.5 h-2.5" /> IA Ativa
                          </Badge>
                        )}
                      </div>

                      {thumb && (
                        <div className="w-full h-24 mb-2 bg-slate-100 rounded overflow-hidden">
                          <img src={thumb} alt="Veículo" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {lead.telefone && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span className="truncate">{lead.telefone}</span>
                        </div>
                      )}

                      {valorLead > 0 && (
                        <div className="text-[10px] text-green-700 font-semibold flex items-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 shrink-0" />
                          {formatCurrency(valorLead)}
                        </div>
                      )}

                      {agendamento && (
                        <div
                          className={cn(
                            'text-[10px] flex items-center gap-1 mb-1',
                            agendamentoAtrasado ? 'text-red-600 font-semibold' : 'text-purple-600',
                          )}
                        >
                          <CalendarClock className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            Agendamento: {formatDateCurta(agendamento.data_hora)}
                          </span>
                          {agendamentoAtrasado && (
                            <Badge className="text-[8px] px-1 h-3.5 bg-red-100 text-red-700 shrink-0">
                              Atrasado
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 flex items-center justify-between gap-1 mb-2 mt-auto">
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0" />{' '}
                          <span className="truncate">{respName}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0 font-medium bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(lead.created_at)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-2 mt-2 bg-slate-50 -mx-3 -mb-3 px-3 pb-2 rounded-b-lg">
                        <span
                          className="flex items-center gap-1 text-slate-500 truncate"
                          title={lead.carro_modelo || lead.veiculo_interesse}
                        >
                          <Car className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {lead.carro_modelo || lead.veiculo_interesse || 'Não especificado'}
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
