import { cn } from '@/lib/utils'
import { Car, User, MessageCircle, Instagram, Facebook, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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
            className="flex flex-col min-w-[280px] max-w-[280px] bg-slate-100 rounded-xl border shadow-sm h-full overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const leadId = e.dataTransfer.getData('leadId')
              if (leadId) onStatusChange(leadId, col.id)
            }}
          >
            <div className={cn('p-3 border-b flex flex-col gap-1', col.color)}>
              <div className="flex justify-between items-center font-bold text-sm">
                <span>{col.title}</span>
                <Badge variant="secondary" className="bg-white/50 text-inherit">
                  {colLeads.length}
                </Badge>
              </div>
              <span className="text-[10px] font-semibold opacity-70">
                Potencial: {formatCurrency(totalValue)}
              </span>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
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
                      onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                      onClick={() => onSelectLead(lead)}
                      className={cn(
                        'bg-white p-3 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
                        selectedLeadId === lead.id
                          ? 'ring-2 ring-blue-500 border-transparent'
                          : 'hover:border-blue-300',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          {getOriginIcon(lead.origem || lead.source)}
                          <span className="font-bold text-sm text-slate-800 truncate">
                            {lead.nome || 'Sem Nome'}
                          </span>
                        </div>
                        {lead.temperatura && (
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0 shadow-sm',
                              lead.temperatura === 'quente'
                                ? 'bg-red-500'
                                : lead.temperatura === 'morno'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500',
                            )}
                            title={`Temperatura: ${lead.temperatura}`}
                          />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" /> {respName}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-2 mt-2 bg-slate-50 -mx-3 -mb-3 px-3 pb-2 rounded-b-lg">
                        <span className="flex items-center gap-1 text-slate-500 truncate">
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
