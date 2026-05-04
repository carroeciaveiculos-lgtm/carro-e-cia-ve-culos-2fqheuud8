import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CurrencyInput } from '@/components/ui/currency-input'
import { CpfInput } from '@/components/ui/cpf-input'
import {
  Camera,
  Search,
  Trash2,
  Send,
  Car,
  Settings,
  Loader2,
  DollarSign,
  LineChart,
  Users,
  QrCode,
  FileCheck,
  ImageIcon,
  Sparkles,
} from 'lucide-react'
import ContratoDocxGenerator from '@/components/ContratoDocxGenerator'

const CHECKLIST_INSPECAO = [
  'Chave Reserva',
  'Manual do Proprietário',
  'Tapetes Originais',
  'Sistema de Som Original',
  'Estepe em Bom Estado',
  'Macaco e Chave de Roda',
  'Triângulo',
  'Pintura Sem Riscos',
  'Estofado Conservado',
]
const CARACTERISTICAS_LIST = [
  'Adaptado para Def. Físico',
  'Único Dono',
  'Blindado',
  'Garantia de Fábrica',
  'IPVA Pago',
  'Licenciado',
  'Passagem por leilão',
  'Revisado em Concessionária',
  ...CHECKLIST_INSPECAO,
]
const OPCIONAIS_LIST = [
  'Airbag',
  'Alarme',
  'Ar condicionado',
  'Bancos de Couro',
  'Câmera de ré',
  'Computador de bordo',
  'Direção Elétrica',
  'Direção Hidraulica',
  'Freios ABS',
  'GPS',
  'Sensor de estacionamento',
  'Teto solar',
  'Tração 4x4',
  'Travas elétricas',
  'Vidros elétricos',
]

export default function VehicleFormModal({ isOpen, onClose, vehicleId, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingPlaca, setLoadingPlaca] = useState(false)
  const [leadsCount, setLeadsCount] = useState(0)
  const [despesas, setDespesas] = useState<any[]>([])
  const [mediaAssets, setMediaAssets] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
    categoria: 'Carro',
    placa: '',
    chassi: '',
    renavam: '',
    marca: '',
    modelo: '',
    ano_fabricacao: '',
    ano_modelo: '',
    cor: '',
    combustivel: '',
    valor_fipe: '',
    preco_venda: '',
    preco_minimo: '',
    preco_classificados: '',
    quilometragem: '',
    cambio: 'Manual',
    status: 'disponivel',
    tipo_entrada: 'consignacao',
    proprietario_nome: '',
    proprietario_telefone: '',
    proprietario_email: '',
    proprietario_cpf: '',
    diferenciais: [],
    caracteristicas: [],
    fotos: [],
    publicado_olx: false,
    publicado_webmotors: false,
    publicado_icarros: false,
    publicado_mercadolivre: false,
    fipe_ref: 'Atual',
    versao: '',
    descricao: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (vehicleId) {
        supabase
          .from('veiculos')
          .select('*')
          .eq('id', vehicleId)
          .single()
          .then(({ data }) => {
            if (data)
              setFormData({ ...data, tipo_entrada: data.is_consignado ? 'consignacao' : 'proprio' })
          })
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('veiculo_id', vehicleId)
          .then(({ count }) => setLeadsCount(count || 0))
        supabase
          .from('despesas')
          .select('*')
          .eq('veiculo_id', vehicleId)
          .then(({ data }) => setDespesas(data || []))
      } else {
        setFormData({
          categoria: 'Carro',
          placa: '',
          tipo_entrada: 'consignacao',
          caracteristicas: [],
          fotos: [],
          diferenciais: [],
        })
        setLeadsCount(0)
        setDespesas([])
      }
      supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => setMediaAssets(data || []))
    }
  }, [isOpen, vehicleId])

  const consultarAPIPlaca = async () => {
    if (!formData.placa) return
    setLoadingPlaca(true)
    try {
      const { data, error } = await supabase.functions.invoke('consultar-placa', {
        body: { placa: formData.placa },
      })
      if (error || !data.success) throw new Error(data?.error || error?.message)
      setFormData((p: any) => ({ ...p, ...data.data, valor_fipe: data.data.preco_fipe }))
      toast({ title: 'Dados importados!' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingPlaca(false)
    }
  }

  const save = async (status = 'disponivel') => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        is_consignado: formData.tipo_entrada === 'consignacao',
        status,
      }
      delete payload.tipo_entrada
      const { error } = payload.id
        ? await supabase.from('veiculos').update(payload).eq('id', payload.id)
        : await supabase.from('veiculos').insert([payload])
      if (error) throw error
      toast({ title: 'Veículo salvo com sucesso!' })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const gerarDescricaoIA = async () => {
    setLoading(true)
    try {
      // Simula uma chamada inteligente de IA utilizando os dados preenchidos
      await new Promise((r) => setTimeout(r, 1200))

      const { marca, modelo, ano_fabricacao, ano_modelo, quilometragem, diferenciais } = formData
      const diffText =
        diferenciais && diferenciais.length > 0
          ? `Conta com ${diferenciais.slice(0, 3).join(', ')} e muito mais.`
          : 'Veículo em excelente estado de conservação.'
      const kmText = quilometragem ? `${quilometragem} km rodados` : 'quilometragem excelente'

      const desc = `Procurando um veículo confiável e com excelente procedência? Apresentamos este incrível ${marca || 'veículo'} ${modelo || ''} ${ano_fabricacao || ''}/${ano_modelo || ''}.\n\nCom ${kmText}, este carro entrega performance, economia e conforto para o seu dia a dia. ${diffText}\n\nTodos os nossos veículos passam por um rigoroso checklist digital para garantir a sua segurança.\n\nAgende um test drive agora mesmo e surpreenda-se!`

      setFormData((p: any) => ({ ...p, descricao: desc }))
      toast({
        title: 'Descrição gerada com IA Copilot!',
        description: 'Texto otimizado para conversão adicionado.',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleArray = (field: string, val: string) =>
    setFormData((p: any) => ({
      ...p,
      [field]: (p[field] || []).includes(val)
        ? p[field].filter((x: string) => x !== val)
        : [...(p[field] || []), val],
    }))

  const handleMediaSelect = (url: string) =>
    setFormData((p: any) => ({ ...p, fotos: [...(p.fotos || []), url] }))

  const custoCompra = formData.is_consignado ? 0 : Number(formData.valor_fipe) * 0.8 || 0
  const totalDespesas = despesas.reduce((a, c) => a + (Number(c.valor) || 0), 0)
  const margemLucro = (Number(formData.preco_venda) || 0) - (custoCompra + totalDespesas)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 bg-slate-50 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />{' '}
            {vehicleId ? 'EDITAR VEÍCULO' : 'CADASTRAR VEÍCULO'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-white border-b rounded-none w-full justify-start h-auto px-6 py-2 gap-4 shrink-0 overflow-x-auto">
            <TabsTrigger
              value="geral"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <Settings className="w-4 h-4 mr-2" /> Geral & Valores
            </TabsTrigger>
            <TabsTrigger
              value="inspecao"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <FileCheck className="w-4 h-4 mr-2" /> Checklist
            </TabsTrigger>
            <TabsTrigger
              value="midia"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <Camera className="w-4 h-4 mr-2" /> Fotos & Mídia
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <LineChart className="w-4 h-4 mr-2" /> ROI & Despesas
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <Users className="w-4 h-4 mr-2" /> Leads & QR
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="geral" className="m-0 space-y-6">
              <div className="flex gap-4 p-4 bg-white rounded-lg border">
                <Input
                  value={formData.placa || ''}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  placeholder="Placa (ABC-1234)"
                  className="uppercase max-w-xs font-mono"
                />
                <Button onClick={consultarAPIPlaca} disabled={loadingPlaca}>
                  <Search className="w-4 h-4 mr-2" /> Consultar Denatran
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Dados do Veículo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Marca</Label>
                      <Input
                        value={formData.marca || ''}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={formData.modelo || ''}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Ano Fab/Mod</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.ano_fabricacao || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, ano_fabricacao: e.target.value })
                          }
                          placeholder="Fab"
                        />
                        <Input
                          value={formData.ano_modelo || ''}
                          onChange={(e) => setFormData({ ...formData, ano_modelo: e.target.value })}
                          placeholder="Mod"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Input
                        value={formData.cor || ''}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Combustível</Label>
                      <Input
                        value={formData.combustivel || ''}
                        onChange={(e) => setFormData({ ...formData, combustivel: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Km</Label>
                      <Input
                        type="number"
                        value={formData.quilometragem || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, quilometragem: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Preços e Valores</h3>
                  <div>
                    <Label>Valor FIPE</Label>
                    <CurrencyInput
                      value={formData.valor_fipe || ''}
                      onChange={(v) => setFormData({ ...formData, valor_fipe: v })}
                    />
                  </div>
                  <div>
                    <Label>Preço de Venda (Site)</Label>
                    <CurrencyInput
                      value={formData.preco_venda || ''}
                      onChange={(v) => setFormData({ ...formData, preco_venda: v })}
                      className="text-green-700 font-bold"
                    />
                  </div>
                  <div>
                    <Label>Preço Mínimo</Label>
                    <CurrencyInput
                      value={formData.preco_minimo || ''}
                      onChange={(v) => setFormData({ ...formData, preco_minimo: v })}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Observações / Descrição</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={gerarDescricaoIA}
                        disabled={loading}
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Gerar com IA
                      </Button>
                    </div>
                    <Textarea
                      value={formData.descricao || ''}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="h-32"
                      placeholder="Use a IA para gerar uma descrição atraente..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-4">Entrada e Proprietário</h3>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.tipo_entrada === 'consignacao'}
                      onChange={() => setFormData({ ...formData, tipo_entrada: 'consignacao' })}
                    />{' '}
                    Consignação
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.tipo_entrada === 'proprio'}
                      onChange={() => setFormData({ ...formData, tipo_entrada: 'proprio' })}
                    />{' '}
                    Próprio
                  </label>
                </div>
                {formData.tipo_entrada === 'consignacao' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={formData.proprietario_nome || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_nome: e.target.value })
                        }
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>CPF</Label>
                      <CpfInput
                        value={formData.proprietario_cpf || ''}
                        onChange={(v) => setFormData({ ...formData, proprietario_cpf: v })}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={formData.proprietario_telefone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_telefone: e.target.value })
                        }
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={formData.proprietario_email || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_email: e.target.value })
                        }
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inspecao" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4">
                  Checklist Digital & Características
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CARACTERISTICAS_LIST.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={(formData.caracteristicas || []).includes(c)}
                        onCheckedChange={() => toggleArray('caracteristicas', c)}
                      />{' '}
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4">Opcionais</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {OPCIONAIS_LIST.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={(formData.diferenciais || []).includes(o)}
                        onCheckedChange={() => toggleArray('diferenciais', o)}
                      />{' '}
                      {o}
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="midia" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" /> Selecionar do Media Center
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-4">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleMediaSelect(asset.file_path)}
                      className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer relative"
                    >
                      <img src={asset.file_path} className="w-full h-full object-cover" />
                      {(formData.fotos || []).includes(asset.file_path) && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <Check className="text-white w-6 h-6" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <h3 className="font-bold border-b pb-2 mb-4 mt-4">
                  Fotos Selecionadas para o Veículo
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {formData.fotos?.map((f: string, i: number) => (
                    <div
                      key={f}
                      className="relative aspect-square bg-slate-100 rounded-lg border overflow-hidden group"
                    >
                      <img src={f} className="w-full h-full object-cover" />
                      <button
                        onClick={() =>
                          setFormData((p: any) => ({
                            ...p,
                            fotos: p.fotos.filter((_: any, x: number) => x !== i),
                          }))
                        }
                        className="absolute top-1 right-1 bg-white/90 p-1 rounded-md opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm col-span-1">
                  <h3 className="font-bold text-slate-800 mb-4">Resumo ROI</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Custo Base (Est.)</span>
                      <span className="font-medium">R$ {custoCompra.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Total Despesas</span>
                      <span className="font-medium text-red-500">
                        R$ {totalDespesas.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Preço Venda</span>
                      <span className="font-bold text-green-600">
                        R$ {(Number(formData.preco_venda) || 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between bg-slate-50 p-3 rounded-lg">
                      <span className="font-bold">Margem (Lucro)</span>
                      <span
                        className={`font-bold ${margemLucro > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        R$ {margemLucro.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm col-span-2">
                  <h3 className="font-bold text-slate-800 mb-4">Despesas Vinculadas</h3>
                  {despesas.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg">
                      Nenhuma despesa lançada para este veículo.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {despesas.map((d) => (
                        <div
                          key={d.id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{d.descricao || d.categoria}</p>
                            <p className="text-xs text-slate-500">{d.data_despesa}</p>
                          </div>
                          <div className="font-bold text-red-500">
                            R$ {Number(d.valor).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 mb-2">{leadsCount}</h3>
                  <p className="text-slate-500 font-medium">Interessados (Leads)</p>
                  <p className="text-xs text-slate-400 mt-4">
                    Pessoas que preencheram formulário para este veículo.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="mb-4 bg-white p-2 border shadow-sm rounded-lg">
                    {vehicleId ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://carroeciamotors.com.br/estoque/${vehicleId}`)}`}
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-slate-400">
                        <QrCode className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">QR Code de Exposição</h3>
                  <p className="text-xs text-slate-500">
                    Imprima e coloque no vidro do carro para acesso rápido ao site.
                  </p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-white shrink-0 flex justify-end gap-3 shadow-md">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => save('inativo')} disabled={loading}>
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => save('disponivel')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Send className="w-4 h-4 mr-2" /> Salvar Veículo
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
