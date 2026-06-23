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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'

const COLUMNS = [
  { id: 'novo', title: 'Novos', color: 'border-blue-200 bg-blue-50 text-blue-800' },
  { id: 'em_contato', title: 'Em Contato', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  { id: 'negociando', title: 'Propostas', color: 'border-purple-200 bg-purple-50 text-purple-800' },
  { id: 'fechado', title: 'Vendido', color: 'border-green-200 bg-green-50 text-green-800' },
  { id: 'perdido', title: 'Perdido', color: 'border-red-200 bg-red-50 text-red-800' },
]

export function KanbanBoard({
  leads,
  onStatusChange,
  onSelectLead,
  usuariosMap,
  selectedLeadId,
}: any) {
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

  const formatCurrency = (val: any) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0)

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
        const totalValue = colLeads.reduce(
          (acc: number, l: any) => acc + (Number(l.valor_veiculo) || 0),
          0,
        )

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
                  const respName = lead.responsavel_id
                    ? usuariosMap[lead.responsavel_id]
                    : lead.status === 'novo'
                      ? 'LUIZ (IA)'
                      : 'Sem Atendente'
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
                        'bg-white p-3 rounded-lg shadow-sm border-y border-r border-l-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md group',
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
                      <div className="flex justify-between items-start mb-2 gap-2">
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

                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-2">
                        <User className="w-3 h-3" /> {respName}
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

                        {lead.telefone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(
                                getWhatsAppLink(
                                  `Olá ${lead.nome}, recebemos seu interesse no ${lead.carro_modelo || 'veículo'}. Como posso ajudar?`,
                                  lead.telefone,
                                ),
                                '_blank',
                              )
                            }}
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
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
