import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Phone, MessageSquare, Car, Calendar, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { getLeads, updateLeadStatus, Lead } from '@/services/leads'
import { Skeleton } from '@/components/ui/skeleton'

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getLeads().then(({ data }) => {
      if (data) {
        setLeads(data)
        if (data.length > 0) setSelectedLead(data[0])
      }
      setLoading(false)
    })
  }, [])

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

  const filtered = leads.filter((l) => l.nome.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 max-w-[1600px] mx-auto">
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
          {loading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum lead encontrado.</div>
          ) : (
            filtered.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${selectedLead?.id === lead.id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{lead.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(lead.created_at || '').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {lead.veiculo_interesse && (
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                    <Car className="w-3 h-3" /> {lead.veiculo_interesse}
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={statusColors[lead.status || 'novo'] || statusColors.novo}
                >
                  {statusLabels[lead.status || 'novo'] || 'Novo'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedLead ? (
        <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b shrink-0 bg-muted/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedLead.nome}</h2>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {selectedLead.telefone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />{' '}
                    {new Date(selectedLead.created_at || '').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              {selectedLead.telefone && (
                <Button
                  onClick={() =>
                    window.open(
                      `https://wa.me/${selectedLead.telefone!.replace(/\D/g, '')}`,
                      '_blank',
                    )
                  }
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Chamar no WhatsApp
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background p-3 rounded border">
                <span className="text-xs text-muted-foreground uppercase font-bold">
                  Origem / Tipo
                </span>
                <p className="font-medium mt-1">
                  {selectedLead.origem} - {selectedLead.tipo}
                </p>
              </div>
              <div className="bg-background p-3 rounded border">
                <span className="text-xs text-muted-foreground uppercase font-bold">
                  Veículo Interesse
                </span>
                <p className="font-medium mt-1">
                  {selectedLead.veiculo_interesse || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-bold mb-4">Mensagem do Cliente</h3>
            <div className="bg-muted p-4 rounded-lg text-sm mb-8">
              <p>{selectedLead.observacoes || 'Nenhuma mensagem adicional.'}</p>
            </div>

            <h3 className="font-bold mb-4">Anotações Internas (CRM)</h3>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground italic">
                Em breve: histórico de interações.
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
      ) : (
        <div className="flex-1 flex items-center justify-center bg-card border rounded-xl text-muted-foreground">
          Selecione um lead para ver os detalhes
        </div>
      )}
    </div>
  )
}

export default AdminLeads
