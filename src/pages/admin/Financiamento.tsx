import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Calculator, Save, FileText, Car } from 'lucide-react'

export default function Financiamento() {
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get('lead_id')
  const veiculoId = searchParams.get('veiculo_id')
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [lead, setLead] = useState<any>(null)
  const [veiculo, setVeiculo] = useState<any>(null)

  const [valorCarro, setValorCarro] = useState<number>(0)
  const [entrada, setEntrada] = useState<number>(0)
  const [prazo, setPrazo] = useState<string>('48')
  const [taxaMensal, setTaxaMensal] = useState<number>(1.5)
  const [prestacao, setPrestacao] = useState<number>(0)

  useEffect(() => {
    if (leadId) fetchLead(leadId)
    if (veiculoId) fetchVeiculo(veiculoId)
  }, [leadId, veiculoId])

  const fetchLead = async (id: string) => {
    const { data } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
    if (data) setLead(data)
  }

  const fetchVeiculo = async (id: string) => {
    const { data } = await supabase.from('veiculos').select('*').eq('id', id).maybeSingle()
    if (data) {
      setVeiculo(data)
      // Inventory Sync: update value
      const price = Number(data.preco_venda || data.preco_classificados || 0)
      setValorCarro(price)

      // Auto calc entry if lead had some text about it
      if (lead?.faixa_preco) {
        const val = Number(lead.faixa_preco.replace(/\D/g, ''))
        if (val > 0) setEntrada(val)
      } else {
        setEntrada(price * 0.3) // 30% default entry
      }
    }
  }

  const calcular = () => {
    const financiado = valorCarro - entrada
    if (financiado <= 0) {
      setPrestacao(0)
      return
    }
    const meses = Number(prazo)
    const taxaDecimal = taxaMensal / 100
    // PMT formula: P = (Pv * r) / (1 - (1 + r)^-n)
    const pmt = (financiado * taxaDecimal) / (1 - Math.pow(1 + taxaDecimal, -meses))
    setPrestacao(pmt)
  }

  const salvarSimulacao = async () => {
    if (!lead) {
      toast({ title: 'Nenhum lead selecionado', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await supabase.from('simulacoes').insert({
        cliente_nome: lead.nome,
        cliente_telefone: lead.telefone,
        cliente_cpf: lead.cpf,
        valor_carro: valorCarro,
        entrada_percentual: (entrada / valorCarro) * 100,
        prazo_meses: Number(prazo),
        taxa_juros: taxaMensal,
        prestacao_mensal: prestacao,
        status: 'Pendente',
        veiculo_id: veiculo?.id,
      })

      // Update lead if it was just financing and now we did it
      if (lead.payment_method?.toLowerCase().includes('financiamento')) {
        await supabase.from('leads').update({ status: 'em_contato' }).eq('id', lead.id)
      }

      toast({ title: 'Simulação salva com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" /> Simulador Integrado
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Simulação</CardTitle>
            <CardDescription>
              {veiculo
                ? `Sincronizado com o estoque: ${veiculo.marca} ${veiculo.modelo}`
                : 'Informe os valores para calcular'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Valor do Veículo (R$)</Label>
              <Input
                type="number"
                value={valorCarro}
                onChange={(e) => setValorCarro(Number(e.target.value))}
                className="bg-slate-50 font-bold"
              />
            </div>
            <div>
              <Label>Valor de Entrada (R$)</Label>
              <Input
                type="number"
                value={entrada}
                onChange={(e) => setEntrada(Number(e.target.value))}
                className="bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prazo (Meses)</Label>
                <Select value={prazo} onValueChange={setPrazo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12x</SelectItem>
                    <SelectItem value="24">24x</SelectItem>
                    <SelectItem value="36">36x</SelectItem>
                    <SelectItem value="48">48x</SelectItem>
                    <SelectItem value="60">60x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taxa Mensal (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxaMensal}
                  onChange={(e) => setTaxaMensal(Number(e.target.value))}
                  className="bg-slate-50"
                />
              </div>
            </div>
            <Button onClick={calcular} className="w-full bg-blue-600 hover:bg-blue-700">
              Calcular Parcela
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white border-none shadow-lg">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-blue-200 font-medium">Resultado da Simulação</h3>
              <div>
                <p className="text-5xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    prestacao,
                  )}
                </p>
                <p className="text-blue-200 mt-2">em {prazo}x</p>
              </div>
              <div className="w-full bg-blue-800/50 rounded-lg p-4 mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-300">Financiado</p>
                  <p className="font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      valorCarro - entrada,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-blue-300">Taxa</p>
                  <p className="font-bold">{taxaMensal}% a.m.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {lead && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Vincular Simulação a:</p>
                  <p className="font-bold text-slate-800">{lead.nome}</p>
                  <p className="text-xs text-slate-500">{lead.telefone}</p>
                </div>
                <Button
                  onClick={salvarSimulacao}
                  disabled={loading || prestacao === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar no CRM
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
