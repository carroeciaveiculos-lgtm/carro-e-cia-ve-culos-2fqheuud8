import { useState } from 'react'
import { mockLeads } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Phone, MessageSquare, Car, Calendar, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

const AdminLeads = () => {
  const [selectedLead, setSelectedLead] = useState(mockLeads[0])
  const [search, setSearch] = useState('')

  const statusColors: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-800 border-blue-200',
    em_atendimento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    negociacao: 'bg-orange-100 text-orange-800 border-orange-200',
    vendido: 'bg-green-100 text-green-800 border-green-200',
  }

  const statusLabels: Record<string, string> = {
    novo: 'Novo',
    em_atendimento: 'Em Atendimento',
    negociacao: 'Negociação',
    vendido: 'Vendido',
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 max-w-[1600px] mx-auto">
      {/* Left Column: List */}
      <div className="w-1/3 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b space-y-4 shrink-0">
          <h2 className="font-bold text-lg">Leads (CRM)</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mockLeads
            .filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
            .map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${selectedLead.id === lead.id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{lead.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(lead.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                  <Car className="w-3 h-3" /> {lead.interest}
                </div>
                <Badge variant="outline" className={statusColors[lead.status]}>
                  {statusLabels[lead.status]}
                </Badge>
              </div>
            ))}
        </div>
      </div>

      {/* Right Column: Details & Actions */}
      {selectedLead && (
        <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b shrink-0 bg-muted/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedLead.name}</h2>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {selectedLead.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />{' '}
                    {new Date(selectedLead.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <Button
                onClick={() =>
                  window.open(`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`, '_blank')
                }
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Chamar no WhatsApp
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background p-3 rounded border">
                <span className="text-xs text-muted-foreground uppercase font-bold">Interesse</span>
                <p className="font-medium mt-1">{selectedLead.interest}</p>
              </div>
              <div className="bg-background p-3 rounded border">
                <span className="text-xs text-muted-foreground uppercase font-bold">
                  Status Atual
                </span>
                <p className="font-medium mt-1">{statusLabels[selectedLead.status]}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-bold mb-4">Anotações Internas</h3>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-semibold text-xs text-muted-foreground mb-1">
                  Sistema - {new Date(selectedLead.date).toLocaleDateString('pt-BR')}
                </p>
                <p>Lead gerado através do formulário do site.</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t shrink-0 bg-background">
            <div className="flex gap-2">
              <Textarea
                placeholder="Adicionar nota interna sobre a negociação..."
                className="min-h-[80px] resize-none"
              />
              <Button className="h-auto shrink-0 px-8 gap-2">
                <Send className="w-4 h-4" /> Salvar Nota
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLeads
