import { useState, useEffect } from 'react'
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
import { Search, Phone, Mail, MessageCircle, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([])
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const { toast } = useToast()

  const loadLeads = async () => {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (filterType !== 'todos') {
      query = query.eq('tipo', filterType)
    }
    if (search) {
      query = query.ilike('nome', `%${search}%`)
    }
    const { data } = await query
    if (data) setLeads(data)
  }

  useEffect(() => {
    loadLeads()
  }, [filterType, search])

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

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col -m-8">
      <div className="p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background">
        <h1 className="text-2xl font-display font-bold">CRM - Gestão de Leads</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="compra">Compradores</SelectItem>
              <SelectItem value="consignacao">Consignação</SelectItem>
              <SelectItem value="contato">Contato Geral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* COLUNA ESQUERDA: Lista */}
        <div className="w-80 border-r bg-muted/10 overflow-y-auto flex flex-col">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setActiveLeadId(lead.id)}
              className={`p-4 text-left border-b hover:bg-muted/50 transition-colors ${activeLeadId === lead.id ? 'bg-card border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm truncate pr-2">{lead.nome}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex gap-1 mb-2">
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  {lead.tipo}
                </Badge>
                {lead.temperatura === 'quente' && (
                  <Badge className="text-[10px] py-0 h-4 bg-red-500 hover:bg-red-600 border-none">
                    Quente
                  </Badge>
                )}
                {lead.temperatura === 'morno' && (
                  <Badge className="text-[10px] py-0 h-4 bg-amber-500 hover:bg-amber-600 border-none">
                    Morno
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {lead.veiculo_interesse || lead.observacoes || 'Sem detalhes'}
              </p>
            </button>
          ))}
        </div>

        {/* COLUNA CENTRAL: Detalhes */}
        <div className="flex-1 bg-background flex flex-col">
          {activeLead ? (
            <>
              <div className="p-6 border-b">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display">{activeLead.nome}</h2>
                    <p className="text-muted-foreground mt-1">
                      Origem: {activeLead.origem} • Tipo:{' '}
                      <span className="capitalize">{activeLead.tipo}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={activeLead.status} onValueChange={updateLeadStatus}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_contato">Em Contato</SelectItem>
                        <SelectItem value="negociando">Negociando</SelectItem>
                        <SelectItem value="fechado">Fechado (Ganho)</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <a
                    href={`tel:${activeLead.telefone}`}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-colors"
                  >
                    <Phone className="w-5 h-5 mb-2 text-primary" />
                    <span className="text-sm font-medium">{activeLead.telefone}</span>
                  </a>
                  <a
                    href={`https://wa.me/${activeLead.telefone?.replace(/\D/g, '')}`}
                    target="_blank"
                    className="flex flex-col items-center justify-center p-3 rounded-lg border bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mb-2" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </a>
                  <a
                    href={`mailto:${activeLead.email}`}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-colors"
                  >
                    <Mail className="w-5 h-5 mb-2 text-primary" />
                    <span className="text-sm font-medium">E-mail</span>
                  </a>
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30">
                    <Calendar className="w-5 h-5 mb-2 text-primary" />
                    <span className="text-sm font-medium">Agendar</span>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-xl">
                  <h4 className="font-bold mb-2 text-sm uppercase text-muted-foreground">
                    Interesse / Observações
                  </h4>
                  <p className="whitespace-pre-wrap">{activeLead.veiculo_interesse}</p>
                  <p className="whitespace-pre-wrap mt-2">{activeLead.observacoes}</p>
                  {activeLead.faixa_preco && (
                    <p className="mt-2 font-bold text-primary">
                      Valor/Faixa: R$ {activeLead.faixa_preco}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="font-bold mb-4">Anotações Internas</h3>
                <div className="border rounded-xl p-4 bg-card text-center text-muted-foreground my-8">
                  Integração de histórico de conversas e anotações em breve.
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="Adicionar nota ao histórico..." className="resize-none" />
                  <Button className="h-auto">Salvar Nota</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-xl">Selecione um lead na lista para ver os detalhes</p>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: Info do lead (só visível se tiver ativo) */}
        {activeLead && (
          <div className="w-72 border-l bg-card overflow-y-auto p-6 hidden xl:block">
            <h3 className="font-bold mb-6">Informações do Cliente</h3>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-muted-foreground font-bold uppercase">
                  Temperatura do Lead
                </label>
                <Select value={activeLead.temperatura || 'frio'} onValueChange={updateLeadTemp}>
                  <SelectTrigger className="mt-1 h-8">
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
                <label className="text-xs text-muted-foreground font-bold uppercase">Nome</label>
                <p className="font-medium">{activeLead.nome}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-bold uppercase">
                  Telefone
                </label>
                <p className="font-medium">{activeLead.telefone}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-bold uppercase">E-mail</label>
                <p className="font-medium break-all">{activeLead.email || '-'}</p>
              </div>

              <div className="pt-6 border-t">
                <Button className="w-full mb-2 bg-[#C0392B] hover:bg-[#a12f23]">
                  Finalizar Negociação
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
