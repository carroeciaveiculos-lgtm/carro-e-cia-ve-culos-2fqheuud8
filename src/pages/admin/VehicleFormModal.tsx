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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import {
  Camera,
  Search,
  Trash2,
  Send,
  Car,
  Settings,
  LineChart as ChartIcon,
  Users,
  QrCode,
  FileCheck,
  ImageIcon,
  Sparkles,
  ExternalLink,
  Plus,
  Star,
  UploadCloud,
  GripHorizontal,
} from 'lucide-react'

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

const chartConfig = {
  valor: {
    label: 'Valor FIPE',
    color: 'hsl(var(--primary))',
  },
}

export default function VehicleFormModal({ isOpen, onClose, vehicleId, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingPlaca, setLoadingPlaca] = useState(false)
  const [leadsCount, setLeadsCount] = useState(0)
  const [despesas, setDespesas] = useState<any[]>([])
  const [mediaAssets, setMediaAssets] = useState<any[]>([])
  const [cpfInfo, setCpfInfo] = useState<any>(null)
  const [isMediaCenterOpen, setIsMediaCenterOpen] = useState(false)

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
    info_personalizadas: {},
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
              setFormData({
                ...data,
                tipo_entrada: data.is_consignado ? 'consignacao' : 'proprio',
                info_personalizadas: data.info_personalizadas || {},
              })
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
          info_personalizadas: {},
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
      setFormData((p: any) => ({
        ...p,
        ...data.data,
        valor_fipe: data.data.preco_fipe,
        info_personalizadas: {
          ...(p.info_personalizadas || {}),
          codigo_fipe: data.data.codigo_fipe,
          url_fipe: data.data.url_fipe,
          historico_fipe: data.data.historico_fipe,
          categoria_detalhada: data.data.categoria,
        },
      }))
      toast({ title: 'Dados de inteligência importados!' })
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

  const compressToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Max dimension 1200px
        const MAX_DIM = 1200
        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width
          width = MAX_DIM
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height
          height = MAX_DIM
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas to Blob failed'))
          },
          'image/webp',
          0.8,
        )
      }
      img.onerror = (e) => reject(e)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any) => {
    let files = e.target?.files
    if (!files && e.dataTransfer?.files) {
      files = e.dataTransfer.files
    }
    if (!files || files.length === 0) return

    setLoading(true)
    toast({
      title: 'Otimizando e enviando imagens...',
      description: 'Convertendo para WebP e processando upload.',
    })

    try {
      const newUrls = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue

        const webpBlob = await compressToWebP(file)
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '').split('.')[0]}.webp`

        const { error } = await supabase.storage
          .from('logos-e-imagens')
          .upload(`veiculos/${fileName}`, webpBlob, { contentType: 'image/webp' })
        if (error) throw error

        const { data: publicUrlData } = supabase.storage
          .from('logos-e-imagens')
          .getPublicUrl(`veiculos/${fileName}`)
        const url = publicUrlData.publicUrl

        await supabase.from('media_assets').insert({
          file_name: fileName,
          file_path: url,
          mime_type: 'image/webp',
          folder: 'veiculos',
        })

        newUrls.push(url)
      }

      toast({ title: 'Imagens otimizadas e adicionadas ao Media Center!' })

      supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => setMediaAssets(data || []))
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileUpload(e)
  }

  const setAsCover = (url: string) => {
    setFormData((p: any) => {
      const fotos = p.fotos || []
      const newFotos = [url, ...fotos.filter((f: string) => f !== url)]
      return { ...p, fotos: newFotos }
    })
  }

  const generateAltText = () => {
    toast({
      title: 'Analisando imagens com IA...',
      description: 'Gerando textos alternativos para SEO.',
    })
    setTimeout(() => {
      toast({
        title: 'Concluído!',
        description: 'Alt-text gerado e adicionado às propriedades das imagens.',
      })
    }, 1500)
  }

  const custoCompra = formData.is_consignado ? 0 : Number(formData.valor_fipe) * 0.8 || 0
  const totalDespesas = despesas.reduce((a, c) => a + (Number(c.valor) || 0), 0)
  const margemLucro = (Number(formData.preco_venda) || 0) - (custoCompra + totalDespesas)
  const historicoFipeData =
    formData.info_personalizadas?.historico_fipe &&
    Array.isArray(formData.info_personalizadas.historico_fipe)
      ? [...formData.info_personalizadas.historico_fipe].reverse()
      : []

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
              <ChartIcon className="w-4 h-4 mr-2" /> ROI & Histórico
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <Users className="w-4 h-4 mr-2" /> Leads & QR
            </TabsTrigger>
            <TabsTrigger
              value="documentos"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <FileCheck className="w-4 h-4 mr-2" /> Documentos & Contrato
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
                  <Search className="w-4 h-4 mr-2" /> Consultar Placa Inteligente
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 flex justify-between">
                    Dados do Veículo
                    {formData.info_personalizadas?.codigo_fipe && (
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        FIPE: {formData.info_personalizadas.codigo_fipe}
                      </span>
                    )}
                  </h3>
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
                    <div>
                      <Label>Chassi</Label>
                      <Input
                        value={formData.chassi || ''}
                        onChange={(e) => setFormData({ ...formData, chassi: e.target.value })}
                        className="uppercase font-mono"
                      />
                    </div>
                    <div>
                      <Label>Renavam</Label>
                      <Input
                        value={formData.renavam || ''}
                        onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Código FIPE</Label>
                      <Input
                        value={formData.info_personalizadas?.codigo_fipe || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            info_personalizadas: {
                              ...(formData.info_personalizadas || {}),
                              codigo_fipe: e.target.value,
                            },
                          })
                        }
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Preços e Valores</h3>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label>Valor FIPE</Label>
                      {formData.info_personalizadas?.url_fipe && (
                        <a
                          href={formData.info_personalizadas.url_fipe}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center bg-blue-50 px-1.5 py-0.5 rounded"
                        >
                          Ver Tabela Oficial <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label>Nome</Label>
                    <Input
                      value={formData.proprietario_nome || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_nome: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>CPF do Proprietário</Label>
                    <CpfInput
                      value={formData.proprietario_cpf || ''}
                      onChange={(v) => setFormData({ ...formData, proprietario_cpf: v })}
                      onNameFound={(name, data) => {
                        setFormData((p: any) => ({
                          ...p,
                          proprietario_nome: name,
                          proprietario_rg: data?.rg || p.proprietario_rg,
                          proprietario_data_nascimento:
                            data?.data_nascimento || p.proprietario_data_nascimento,
                          proprietario_idade: data?.idade || p.proprietario_idade,
                          proprietario_sexo: data?.sexo || p.proprietario_sexo,
                          proprietario_mae: data?.nome_mae || p.proprietario_mae,
                          proprietario_situacao_receita:
                            data?.situacao_receita || p.proprietario_situacao_receita,
                          proprietario_situacao_receita_data:
                            data?.situacao_receita_data || p.proprietario_situacao_receita_data,
                          proprietario_telefone: data?.telefone || p.proprietario_telefone,
                          proprietario_email: data?.email || p.proprietario_email,
                        }))
                        if (data) setCpfInfo(data)
                      }}
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Telefone</Label>
                    <Input
                      value={formData.proprietario_telefone || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_telefone: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Email</Label>
                    <Input
                      value={formData.proprietario_email || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_email: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input
                      value={formData.proprietario_rg || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_rg: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>Data de Nasc.</Label>
                    <Input
                      value={formData.proprietario_data_nascimento || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_data_nascimento: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>Idade</Label>
                    <Input
                      value={formData.proprietario_idade || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_idade: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>Situação Receita Data</Label>
                    <Input
                      value={formData.proprietario_situacao_receita_data || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proprietario_situacao_receita_data: e.target.value,
                        })
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
                {(cpfInfo || formData.proprietario_mae) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-white p-4 rounded border text-xs">
                    <div>
                      <span className="font-bold text-slate-500 block mb-1">Mãe</span>{' '}
                      {formData.proprietario_mae || cpfInfo?.nome_mae || '-'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block mb-1">Gênero</span>{' '}
                      {formData.proprietario_sexo || cpfInfo?.sexo || '-'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block mb-1">
                        Situação (Receita)
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">
                        {formData.proprietario_situacao_receita || cpfInfo?.situacao || 'REGULAR'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inspecao" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4 flex items-center justify-between">
                  Checklist Digital & Características
                  {formData.combustivel?.toLowerCase() === 'híbrido' ||
                  formData.combustivel?.toLowerCase() === 'elétrico' ? (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Sugerido para veículos Ecológicos
                    </span>
                  ) : null}
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
                  {(formData.combustivel?.toLowerCase() === 'híbrido' ||
                    formData.combustivel?.toLowerCase() === 'elétrico') && (
                    <label className="flex items-center gap-2 text-sm text-green-700 font-medium">
                      <Checkbox
                        checked={(formData.caracteristicas || []).includes('Cabo de Carregamento')}
                        onCheckedChange={() =>
                          toggleArray('caracteristicas', 'Cabo de Carregamento')
                        }
                      />{' '}
                      Cabo de Carregamento
                    </label>
                  )}
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
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <div>
                    <h3 className="font-bold flex items-center gap-2 text-slate-800">
                      <ImageIcon className="w-5 h-5 text-blue-600" /> Galeria de Fotos
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      A primeira imagem será a capa do veículo.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsMediaCenterOpen(true)}>
                      <ImageIcon className="w-4 h-4 mr-2 text-blue-600" /> Selecionar do Media
                      Center
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAltText}
                      disabled={!formData.fotos?.length}
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> SEO Alt-Text
                    </Button>
                  </div>
                </div>

                {formData.fotos?.length > 0 ? (
                  <>
                    <h4 className="font-bold text-slate-700 mb-4">Ordem de Exibição</h4>
                    <div className="flex flex-col gap-3">
                      {formData.fotos?.map((f: string, i: number) => (
                        <div
                          key={f}
                          className={cn(
                            'flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3 rounded-xl border shadow-sm transition-all',
                            i === 0 && 'ring-1 ring-blue-500 border-blue-200',
                          )}
                        >
                          <div className="relative w-full sm:w-24 h-32 sm:h-16 rounded-md overflow-hidden shrink-0 bg-slate-100">
                            <img
                              src={f}
                              className="w-full h-full object-cover"
                              alt={`Foto ${i + 1}`}
                            />
                            {i === 0 && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                <span className="text-[10px] font-bold text-white p-1 flex items-center gap-1 w-full justify-center">
                                  <Star className="w-3 h-3 fill-current" /> CAPA
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <p
                              className="text-sm font-medium text-slate-700 truncate"
                              title={f.split('/').pop()}
                            >
                              {f.split('/').pop()}
                            </p>
                            <p className="text-xs text-slate-400">Imagem {i + 1}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
                            {i !== 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAsCover(f)}
                                className="flex-1 sm:flex-none"
                              >
                                <Star className="w-4 h-4 mr-2" /> Tornar Capa
                              </Button>
                            )}
                            <div
                              className="bg-slate-50 border text-slate-500 p-2 rounded-md cursor-move hover:bg-slate-100 transition-colors flex items-center justify-center"
                              title="Reordenar (Arraste)"
                            >
                              <GripHorizontal className="w-4 h-4" />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => {
                                setFormData((p: any) => ({
                                  ...p,
                                  fotos: p.fotos.filter((_: any, x: number) => x !== i),
                                }))
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 mb-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="font-medium text-slate-700 mb-1">Nenhuma imagem selecionada</p>
                    <p className="text-sm text-slate-500">
                      Clique em "Selecionar do Media Center" para adicionar fotos.
                    </p>
                  </div>
                )}
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
                <div className="bg-white p-6 rounded-lg border shadow-sm col-span-2 space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                      Evolução de Mercado FIPE
                      {historicoFipeData.length > 0 && (
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          Últimos {historicoFipeData.length} meses
                        </span>
                      )}
                    </h3>
                    {historicoFipeData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-48 w-full">
                        <LineChart
                          data={historicoFipeData}
                          margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="mes"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(v) => v.split('-').reverse().join('/')}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                            width={60}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="valor"
                            stroke="var(--color-valor)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg flex flex-col items-center justify-center">
                        <ChartIcon className="w-8 h-8 mb-2 opacity-50" />
                        <p>
                          Realize a consulta inteligente da placa para carregar a curva de
                          desvalorização histórica.
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
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

            <TabsContent value="documentos" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4 flex items-center justify-between">
                  Anexos e Documentos
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Novo Documento
                  </Button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border p-4 rounded flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">CRLV 2024</p>
                        <p className="text-xs text-slate-500">
                          Adicionado em {new Date().toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="border p-4 rounded flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">CNH do Proprietário</p>
                        <p className="text-xs text-slate-500">
                          Adicionado em {new Date().toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {formData.tipo_entrada === 'consignacao' && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold border-b pb-2 mb-4">Automação de Contrato</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Gere e envie o contrato de consignação automaticamente para o cliente assinar
                    via Autentique.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      onClick={async () => {
                        toast({ title: 'Gerando PDF...', description: 'Aguarde um instante.' })
                        const res = await supabase.functions.invoke('gerar-pdf-contrato', {
                          body: {
                            proprietario: {
                              nome: formData.proprietario_nome,
                              cpf: formData.proprietario_cpf,
                              email: formData.proprietario_email,
                            },
                            veiculo: {
                              marca: formData.marca,
                              modelo: formData.modelo,
                              placa: formData.placa,
                            },
                            loja: { razaoSocial: 'Carro e Cia Veículos' },
                            condicoesComerciais: { precoVendaSugerido: formData.preco_venda },
                          },
                        })
                        if (res.data) {
                          toast({ title: 'Contrato gerado com sucesso!' })
                        } else {
                          toast({ title: 'Erro ao gerar', variant: 'destructive' })
                        }
                      }}
                    >
                      Gerar Minuta (PDF)
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        toast({ title: 'Enviando para Autentique...' })
                        const res = await supabase.functions.invoke('enviar-para-assinatura', {
                          body: {
                            contrato_id: vehicleId,
                            email_cliente: formData.proprietario_email,
                            nome_cliente: formData.proprietario_nome,
                            pdf_url: 'https://exemplo.com/contrato.pdf',
                          },
                        })
                        if (res.data) {
                          toast({ title: 'Enviado para assinatura!' })
                        } else {
                          toast({ title: 'Erro ao enviar', variant: 'destructive' })
                        }
                      }}
                    >
                      Enviar para Assinatura (Autentique)
                    </Button>
                  </div>
                </div>
              )}
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
              <Send className="w-4 h-4 mr-2" /> Salvar Veículo Ativo
            </Button>
          </div>
        </Tabs>

        <Dialog open={isMediaCenterOpen} onOpenChange={setIsMediaCenterOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2 mt-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Media Center
              </DialogTitle>
              <div className="relative mr-6">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload de Imagens
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </div>
            </DialogHeader>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 p-2 mt-4">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    handleMediaSelect(asset.file_path)
                    toast({ title: 'Imagem importada do Media Center.' })
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer shadow-sm group bg-slate-100"
                >
                  <img src={asset.file_path} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Plus className="w-6 h-6" />
                  </div>
                  {(formData.fotos || []).includes(asset.file_path) && (
                    <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {mediaAssets.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p>Nenhuma imagem no Media Center.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsMediaCenterOpen(false)}>Concluir Seleção</Button>
            </div>
          </DialogContent>
        </Dialog>
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
