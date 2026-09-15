import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { normalizeValue } from '@/lib/ml-normalize'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  CheckCircle2,
  XCircle,
  Trash,
  Car,
  Bot,
  Activity,
  Zap,
  AlertTriangle,
  FileText,
  Search,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Painel "Gestão do Lead" — extraído da COLUMN 3 de Leads.tsx (15/09/2026)
// pra ficar disponível também no Conversador (Conversas.tsx), que não tinha
// nada disso. Motivo: Adriana reportou "não encontrei a opção de editar
// lead" porque essa tela é a que ela mais usa no dia a dia e não tinha o
// painel. Ver docs/leads-e-sdr.md.
//
// "Perdido" não muda o status direto — chama onPerdido() pra quem estiver
// usando o componente abrir o MotivoPerdaModal antes (mesmo fluxo do
// drag-and-drop no Kanban). Antes esse botão pulava o motivo.
interface LeadManagementPanelProps {
  lead: any
  veiculosMap: Record<string, any>
  onFieldUpdate: (field: string, value: any) => void
  onPerdido: () => void
  onDelete: () => void
}

export function LeadManagementPanel({
  lead,
  veiculosMap,
  onFieldUpdate,
  onPerdido,
  onDelete,
}: LeadManagementPanelProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false)
  const [searchVeiculo, setSearchVeiculo] = useState('')
  const [veiculosBusca, setVeiculosBusca] = useState<any[]>([])
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [hasSimulation, setHasSimulation] = useState(false)

  const linkedVeiculo = lead?.veiculo_id ? veiculosMap[lead.veiculo_id] : null

  useEffect(() => {
    const checkSimulation = async () => {
      if (!lead?.telefone) {
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
    checkSimulation()
  }, [lead?.id, lead?.telefone])

  useEffect(() => {
    if (!isVeiculoModalOpen) return
    const fetchVeiculos = async () => {
      let q = supabase.from('veiculos').select('*').eq('status', 'disponivel')
      if (searchVeiculo)
        q = q.ilike('busca_normalizada', `%${normalizeValue(searchVeiculo) || ''}%`)
      const { data } = await q.limit(20)
      if (data) setVeiculosBusca(data)
    }
    fetchVeiculos()
  }, [isVeiculoModalOpen, searchVeiculo])

  const generateAndSendProposal = async () => {
    if (!lead || !linkedVeiculo || !lead.telefone) {
      toast({ title: 'Vincule um veículo e telefone para gerar proposta.', variant: 'destructive' })
      return
    }
    setIsGeneratingPdf(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-proposta', {
        body: { veiculo: linkedVeiculo, cliente: lead },
      })
      if (error) throw error
      if (data?.url) {
        const cleanPhone = lead.telefone.replace(/\D/g, '')
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'document',
            to: cleanPhone,
            documentUrl: data.url,
            filename: `Proposta_${linkedVeiculo.modelo.replace(/\s+/g, '_')}.pdf`,
            text: `Olá ${lead.nome}, segue a proposta do ${linkedVeiculo.modelo}!`,
            leadId: lead.id,
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

  if (!lead) return null

  return (
    <div className="w-[30%] min-w-[320px] bg-slate-50 flex flex-col h-full shrink-0">
      <ScrollArea className="flex-1 p-4">
        {lead.status === 'agendamento' && (
          <Button
            size="sm"
            className="w-full mb-2 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onFieldUpdate('status', 'visita')}
          >
            <Car className="w-4 h-4 mr-1" /> Cliente chegou
          </Button>
        )}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
            onClick={() => onFieldUpdate('status', 'fechado')}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Venda Fechada
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 border-red-200 flex-1"
            onClick={onPerdido}
          >
            <XCircle className="w-4 h-4 mr-1" /> Perdido
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-slate-600 hover:bg-slate-100 px-2"
            onClick={onDelete}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">Assistente Clara (IA)</span>
          </div>
          <Switch
            checked={lead.ai_enabled ?? true}
            onCheckedChange={(v) => onFieldUpdate('ai_enabled', v)}
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
                      (lead.ai_score ||
                        (lead.temperatura === 'quente'
                          ? 90
                          : lead.temperatura === 'morno'
                            ? 60
                            : 30))) /
                      100
                  }
                  className={cn(
                    'transition-all duration-1000',
                    lead.temperatura === 'quente'
                      ? 'text-red-500'
                      : lead.temperatura === 'morno'
                        ? 'text-amber-500'
                        : 'text-blue-500',
                  )}
                />
              </svg>
              <span className="absolute text-sm font-bold">
                {lead.ai_score ||
                  (lead.temperatura === 'quente' ? 90 : lead.temperatura === 'morno' ? 60 : 30)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                {lead.ai_summary ||
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
                {lead.carro_modelo || lead.veiculo_interesse || 'Não especificado'}
              </p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
            <Label className="text-xs font-bold text-slate-500 uppercase block border-b pb-2">
              Ficha de Negociação (Auto-fill IA)
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Carro na Troca</Label>
                <Input
                  value={lead.trade_in_car || ''}
                  onChange={(e) => onFieldUpdate('trade_in_car', e.target.value)}
                  placeholder="Ex: Honda Civic 2020"
                  className="h-8 text-sm bg-slate-50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Valor de Entrada</Label>
                <Input
                  value={lead.faixa_preco || ''}
                  onChange={(e) => onFieldUpdate('faixa_preco', e.target.value)}
                  placeholder="Ex: R$ 20.000"
                  className="h-8 text-sm bg-slate-50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Forma de Pagamento</Label>
                <Input
                  value={lead.payment_method || ''}
                  onChange={(e) => onFieldUpdate('payment_method', e.target.value)}
                  placeholder="Ex: Financiamento Banco X"
                  className="h-8 text-sm bg-slate-50 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div
            className={cn(
              'p-4 rounded-xl border transition-colors',
              lead.payment_method?.toLowerCase().includes('financiamento') && !hasSimulation
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-100',
            )}
          >
            <h4
              className={cn(
                'font-bold text-sm mb-2 flex items-center gap-2',
                lead.payment_method?.toLowerCase().includes('financiamento') && !hasSimulation
                  ? 'text-red-800 animate-pulse'
                  : 'text-blue-800',
              )}
            >
              {lead.payment_method?.toLowerCase().includes('financiamento') && !hasSimulation && (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              Simulador de Financiamento
            </h4>
            {lead.payment_method?.toLowerCase().includes('financiamento') && !hasSimulation && (
              <p className="text-xs text-red-600 mb-3 font-medium">
                Lead interessado em financiamento, mas sem simulação iniciada!
              </p>
            )}
            <Button
              className={cn(
                'w-full',
                lead.payment_method?.toLowerCase().includes('financiamento') && !hasSimulation
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
              )}
              size="sm"
              onClick={() =>
                navigate(
                  `/admin/financiamento?lead_id=${lead.id}&veiculo_id=${lead.veiculo_id || ''}`,
                )
              }
            >
              Abrir Simulador Completo
            </Button>
          </div>
        </div>
      </ScrollArea>

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
                    onFieldUpdate('veiculo_id', v.id)
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
