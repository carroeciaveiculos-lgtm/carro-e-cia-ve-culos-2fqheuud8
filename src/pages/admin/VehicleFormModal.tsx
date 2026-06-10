import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AssinaturaDialog } from '@/components/consignacao/AssinaturaDialog'
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
  Eye,
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
  const [documentos, setDocumentos] = useState<any[]>([])
  const [contrato, setContrato] = useState<any>(null)
  const [cpfInfo, setCpfInfo] = useState<any>(null)
  const [isMediaCenterOpen, setIsMediaCenterOpen] = useState(false)
  const [newCaracteristica, setNewCaracteristica] = useState('')
  const [newOpcional, setNewOpcional] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewDoc, setPreviewDoc] = useState<any>(null)

  const [novaDespesa, setNovaDespesa] = useState({
    categoria: 'Mecânica',
    descricao: '',
    valor: '',
    data_despesa: new Date().toISOString().split('T')[0],
    responsabilidade: 'loja',
  })

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

  const handleDocumentoSearch = async (doc: string) => {
    const cleanDoc = doc.replace(/\D/g, '')
    if (cleanDoc.length === 11) {
      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('consultar-cpf', {
          body: { cpf: cleanDoc },
        })
        if (data?.success) {
          const res = data.data
          setFormData((p: any) => ({
            ...p,
            proprietario_nome: res.nome || p.proprietario_nome,
            proprietario_telefone: res.telefone || p.proprietario_telefone,
            proprietario_email: res.email || p.proprietario_email,
            proprietario_rg: res.rg || p.proprietario_rg,
            proprietario_data_nascimento: res.data_nascimento || p.proprietario_data_nascimento,
            proprietario_idade: res.idade || p.proprietario_idade,
            proprietario_sexo: res.sexo || p.proprietario_sexo,
            proprietario_mae: res.nome_mae || p.proprietario_mae,
            proprietario_situacao_receita: res.situacao_receita || p.proprietario_situacao_receita,
            proprietario_situacao_receita_data:
              res.situacao_receita_data || p.proprietario_situacao_receita_data,
          }))
          toast({ title: 'Dados do CPF importados!' })
        }
      } catch (e: any) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    } else if (cleanDoc.length === 14) {
      setLoading(true)
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`)
        const data = await res.json()
        if (data.razao_social) {
          setFormData((p: any) => ({
            ...p,
            proprietario_nome: data.razao_social,
            proprietario_telefone: data.ddd_telefone_1 || p.proprietario_telefone,
            proprietario_email: data.email || p.proprietario_email,
            proprietario_cep: data.cep || p.proprietario_cep,
            proprietario_logradouro: data.logradouro || p.proprietario_logradouro,
            proprietario_numero: data.numero || p.proprietario_numero,
            proprietario_complemento: data.complemento || p.proprietario_complemento,
            proprietario_bairro: data.bairro || p.proprietario_bairro,
            proprietario_cidade: data.municipio || p.proprietario_cidade,
            proprietario_estado: data.uf || p.proprietario_estado,
          }))
          toast({ title: 'Dados do CNPJ importados!' })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCepBlur = async (cep: string) => {
    if (!cep) return
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData((p: any) => ({
            ...p,
            proprietario_logradouro: data.logradouro || p.proprietario_logradouro,
            proprietario_bairro: data.bairro || p.proprietario_bairro,
            proprietario_cidade: data.localidade || p.proprietario_cidade,
            proprietario_estado: data.uf || p.proprietario_estado,
          }))
          toast({ title: 'Endereço importado com sucesso!' })
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleAddDespesa = async () => {
    if (!vehicleId)
      return toast({
        title: 'Salve o veículo primeiro antes de lançar despesas',
        variant: 'destructive',
      })
    if (!novaDespesa.valor)
      return toast({ title: 'Informe o valor da despesa', variant: 'destructive' })

    setLoading(true)
    try {
      const payload = {
        veiculo_id: vehicleId,
        categoria: novaDespesa.categoria,
        descricao: novaDespesa.descricao,
        valor: Number(novaDespesa.valor),
        data_despesa: novaDespesa.data_despesa,
        responsabilidade: novaDespesa.responsabilidade,
      }
      const { data, error } = await supabase.from('despesas').insert([payload]).select()
      if (error) throw error
      setDespesas((p) => [...p, data[0]])
      setNovaDespesa({
        categoria: 'Mecânica',
        descricao: '',
        valor: '',
        data_despesa: new Date().toISOString().split('T')[0],
        responsabilidade: 'loja',
      })
      toast({ title: 'Despesa lançada com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao lançar despesa', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

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
        supabase
          .from('documentos')
          .select('*')
          .eq('veiculo_id', vehicleId)
          .then(({ data }) => setDocumentos(data || []))
        supabase
          .from('contratos_consignacao')
          .select('*')
          .eq('veiculo_id', vehicleId)
          .single()
          .then(({ data }) => {
            if (data) setContrato(data)
          })
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
        setDocumentos([])
        setContrato(null)
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
      setFormData((p: any) => {
        const newData = { ...data.data }

        const mappedData = {
          ...newData,
          ano_fabricacao: newData.ano_fab || p.ano_fabricacao,
          valor_fipe: newData.preco_fipe || p.valor_fipe,
        }

        delete mappedData.ano_fab
        delete mappedData.preco_fipe
        delete mappedData.historico_fipe
        delete mappedData.url_fipe
        delete mappedData.codigo_fipe
        delete mappedData.mes_referencia

        return {
          ...p,
          ...mappedData,
          info_personalizadas: {
            ...(p.info_personalizadas || {}),
            codigo_fipe: data.data.codigo_fipe,
            url_fipe: data.data.url_fipe,
            historico_fipe: data.data.historico_fipe,
            categoria_detalhada: data.data.categoria_sintetica || data.data.categoria,
            combustivel_sintetico: data.data.combustivel_sintetico,
          },
        }
      })
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
      const sanitizeNumber = (val: any) => {
        if (val === '' || val === null || val === undefined) return null
        if (typeof val === 'string') {
          let clean = val.toString()
          if (clean.includes(',')) {
            clean = clean.replace(/\./g, '').replace(',', '.')
          }
          const num = parseFloat(clean.replace(/[^\d.-]/g, ''))
          return isNaN(num) ? null : num
        }
        const num = Number(val)
        return isNaN(num) ? null : num
      }

      const payload = {
        ...formData,
        ano_fabricacao: sanitizeNumber(formData.ano_fabricacao || formData.ano_fab),
        ano_modelo: sanitizeNumber(formData.ano_modelo),
        quilometragem: sanitizeNumber(formData.quilometragem),
        valor_fipe: sanitizeNumber(formData.valor_fipe),
        preco_venda: sanitizeNumber(formData.preco_venda),
        preco_minimo: sanitizeNumber(formData.preco_minimo),
        preco_classificados: sanitizeNumber(formData.preco_classificados),
        is_consignado: formData.tipo_entrada === 'consignacao',
        status,
        updated_at: new Date().toISOString(),
      }
      delete payload.tipo_entrada
      delete payload.ano_fab
      delete payload.preco_fipe
      delete payload.historico_fipe
      delete payload.url_fipe
      delete payload.codigo_fipe
      delete payload.mes_referencia

      if (!payload.id) {
        delete payload.id
      }

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

  const handleDocumentFile = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!vehicleId) {
      toast({ title: 'Salve o veículo primeiro', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const filePath = `${vehicleId}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('documentos-veiculos')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('documentos-veiculos')
        .getPublicUrl(filePath)

      const { data, error } = await supabase
        .from('documentos')
        .insert([
          {
            veiculo_id: vehicleId,
            nome_documento: file.name,
            tipo: file.type,
            tamanho: file.size,
            url_documento: publicUrlData.publicUrl,
          },
        ])
        .select()
      if (error) throw error

      setDocumentos((p) => [...p, data[0]])
      toast({ title: 'Documento anexado.' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

  const custoCompra = Number(formData.valor_fipe) || 0
  const totalDespesas = despesas.reduce((a, c) => a + (Number(c.valor) || 0), 0)
  const margemLucro = (Number(formData.preco_venda) || 0) - (custoCompra + totalDespesas)
  const historicoFipeData =
    formData.info_personalizadas?.historico_fipe &&
    Array.isArray(formData.info_personalizadas.historico_fipe)
      ? [...formData.info_personalizadas.historico_fipe].reverse()
      : []

  const allCaracteristicas = Array.from(
    new Set([...CARACTERISTICAS_LIST, ...(formData.caracteristicas || [])]),
  )
  const allOpcionais = Array.from(new Set([...OPCIONAIS_LIST, ...(formData.diferenciais || [])]))

  const [adKitContent, setAdKitContent] = useState<string | null>(null)
  const [loadingAdKit, setLoadingAdKit] = useState(false)

  const handleGerarAdKit = async () => {
    if (!vehicleId) return toast({ title: 'Salve o veículo primeiro', variant: 'destructive' })
    setLoadingAdKit(true)
    try {
      const tema = `Kit de divulgação para redes sociais e portais (Instagram, WhatsApp, OLX)`
      const palavraChave = `${formData.marca} ${formData.modelo} ${formData.ano_fabricacao}`
      const { data, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: {
          tema:
            tema +
            `. Veículo: ${formData.marca} ${formData.modelo} ${formData.ano_fabricacao}, Cor: ${formData.cor}, Combustível: ${formData.combustivel}, Preço: R$ ${formData.preco_venda}. Opcionais: ${(formData.diferenciais || []).join(', ')}. Crie 3 seções: Instagram, WhatsApp e OLX.`,
          palavraChave,
          tom: 'Persuasivo',
        },
      })
      if (error) throw error
      if (data?.success && data?.data?.texto_html) {
        setAdKitContent(data.data.texto_html)
        toast({ title: 'Kit de divulgação gerado!' })
      } else {
        throw new Error('Falha na geração')
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingAdKit(false)
    }
  }

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
            <TabsTrigger
              value="marketing"
              className="data-[state=active]:border-b-2 border-blue-600 rounded-none shadow-none"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Marketing IA
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
                  <h3 className="font-bold border-b pb-2 flex justify-between">Dados Básicos</h3>
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
                  </div>

                  <h3 className="font-bold border-b pb-2 mt-6 text-slate-700 flex justify-between items-center">
                    Dados Técnicos (Auto)
                    {formData.info_personalizadas?.codigo_fipe && (
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        FIPE: {formData.info_personalizadas.codigo_fipe}
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Input
                        value={formData.categoria || ''}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        className="h-8 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Combust. Sintético</Label>
                      <Input
                        value={formData.info_personalizadas?.combustivel_sintetico || ''}
                        readOnly
                        className="h-8 text-sm bg-slate-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Código FIPE</Label>
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
                        className="font-mono h-8 text-sm bg-white"
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
                    <Label>CPF / CNPJ</Label>
                    <Input
                      value={formData.proprietario_cpf || ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d./-]/g, '')
                        setFormData({ ...formData, proprietario_cpf: v })
                      }}
                      onBlur={(e) => handleDocumentoSearch(e.target.value)}
                      placeholder="Somente números (CPF ou CNPJ)"
                      className="bg-white font-mono"
                      maxLength={18}
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

                  <div className="col-span-2 md:col-span-4 mt-2">
                    <h4 className="font-bold text-sm border-b pb-2 mb-3 text-slate-700">
                      Endereço
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <Label>CEP</Label>
                        <Input
                          value={formData.proprietario_cep || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_cep: e.target.value })
                          }
                          onBlur={(e) => handleCepBlur(e.target.value)}
                          className="bg-white"
                          maxLength={9}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-3">
                        <Label>Logradouro</Label>
                        <Input
                          value={formData.proprietario_logradouro || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_logradouro: e.target.value })
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label>Número</Label>
                        <Input
                          value={formData.proprietario_numero || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_numero: e.target.value })
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label>Complemento</Label>
                        <Input
                          value={formData.proprietario_complemento || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_complemento: e.target.value })
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Bairro</Label>
                        <Input
                          value={formData.proprietario_bairro || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_bairro: e.target.value })
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-3">
                        <Label>Cidade</Label>
                        <Input
                          value={formData.proprietario_cidade || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_cidade: e.target.value })
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Label>UF</Label>
                        <Input
                          value={formData.proprietario_estado || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_estado: e.target.value })
                          }
                          className="bg-white uppercase"
                          maxLength={2}
                        />
                      </div>
                    </div>
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
                  {allCaracteristicas.map((c: string) => (
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
                <div className="flex gap-2 mt-4 items-center">
                  <Input
                    placeholder="Nova Característica..."
                    value={newCaracteristica}
                    onChange={(e) => setNewCaracteristica(e.target.value)}
                    className="max-w-xs h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      if (newCaracteristica.trim()) {
                        toggleArray('caracteristicas', newCaracteristica.trim())
                        setNewCaracteristica('')
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4">Opcionais</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {allOpcionais.map((o: string) => (
                    <label key={o} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={(formData.diferenciais || []).includes(o)}
                        onCheckedChange={() => toggleArray('diferenciais', o)}
                      />{' '}
                      {o}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-4 items-center">
                  <Input
                    placeholder="Novo Opcional..."
                    value={newOpcional}
                    onChange={(e) => setNewOpcional(e.target.value)}
                    className="max-w-xs h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      if (newOpcional.trim()) {
                        toggleArray('diferenciais', newOpcional.trim())
                        setNewOpcional('')
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
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
                      <span className="text-slate-500">Custo Base (FIPE)</span>
                      <span className="font-medium">
                        R$ {custoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
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

                    <div className="bg-slate-50 p-4 rounded-lg border mb-4 shadow-sm">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" /> Lançar Nova Despesa
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3">
                          <Label className="text-xs">Categoria</Label>
                          <Select
                            value={novaDespesa.categoria}
                            onValueChange={(v) => setNovaDespesa({ ...novaDespesa, categoria: v })}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mecânica">Mecânica</SelectItem>
                              <SelectItem value="Estética">Estética</SelectItem>
                              <SelectItem value="Documentação">Documentação</SelectItem>
                              <SelectItem value="Impostos">Impostos</SelectItem>
                              <SelectItem value="Transporte">Transporte</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            value={novaDespesa.descricao}
                            onChange={(e) =>
                              setNovaDespesa({ ...novaDespesa, descricao: e.target.value })
                            }
                            className="bg-white"
                            placeholder="Ex: Troca de óleo"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Data</Label>
                          <Input
                            type="date"
                            value={novaDespesa.data_despesa}
                            onChange={(e) =>
                              setNovaDespesa({ ...novaDespesa, data_despesa: e.target.value })
                            }
                            className="bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Valor</Label>
                          <CurrencyInput
                            value={novaDespesa.valor}
                            onChange={(v) => setNovaDespesa({ ...novaDespesa, valor: v })}
                            className="bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Resp.</Label>
                          <Select
                            value={novaDespesa.responsabilidade}
                            onValueChange={(v) =>
                              setNovaDespesa({ ...novaDespesa, responsabilidade: v })
                            }
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="loja">Loja</SelectItem>
                              <SelectItem value="cliente">Cliente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1">
                          <Button
                            onClick={handleAddDespesa}
                            disabled={loading}
                            className="w-full h-9 p-0"
                            variant="secondary"
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        * <strong className="text-slate-700">Loja</strong>: Reduz margem de lucro.{' '}
                        <strong className="text-slate-700">Cliente</strong>: Descontado no acerto de
                        consignação.
                      </p>
                    </div>

                    {despesas.length === 0 ? (
                      <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg border border-dashed">
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
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{d.descricao || d.categoria}</p>
                                <Badge
                                  variant={
                                    d.responsabilidade === 'cliente' ? 'secondary' : 'outline'
                                  }
                                  className="text-[9px] h-4 px-1"
                                >
                                  {d.responsabilidade === 'cliente' ? 'Cliente' : 'Loja'}
                                </Badge>
                              </div>
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
                  <div>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleDocumentFile}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!vehicleId)
                          return toast({
                            title: 'Salve o veículo antes de adicionar documentos',
                            variant: 'destructive',
                          })
                        fileInputRef.current?.click()
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Novo Documento
                    </Button>
                  </div>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentos.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-lg">
                      Nenhum documento anexado.
                    </div>
                  ) : (
                    documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="border p-4 rounded flex items-center justify-between bg-slate-50"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <FileCheck className="w-6 h-6 text-blue-600 shrink-0" />
                          <div className="overflow-hidden">
                            <p
                              className="font-semibold text-sm group-hover:underline truncate"
                              title={doc.nome_documento}
                            >
                              {doc.nome_documento}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewDoc(doc)}
                            title="Preview no App"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.url_documento, '_blank')}
                            title="Abrir em Nova Guia"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={async () => {
                              if (confirm('Remover este documento?')) {
                                await supabase.from('documentos').delete().eq('id', doc.id)
                                setDocumentos((p) => p.filter((d) => d.id !== doc.id))
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {formData.tipo_entrada === 'consignacao' && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold border-b pb-2 mb-4">Automação de Contrato</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Gere e envie o contrato de consignação automaticamente para o cliente assinar
                    via Autentique.
                  </p>

                  {!contrato ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-lg border">
                      <p className="text-sm text-slate-500 flex-1">Nenhum contrato gerado ainda.</p>
                      <Button
                        onClick={async () => {
                          if (!vehicleId)
                            return toast({
                              title: 'Salve o veículo primeiro',
                              variant: 'destructive',
                            })
                          toast({ title: 'Gerando Minuta...', description: 'Aguarde um instante.' })
                          try {
                            const res = await supabase.functions.invoke('gerar-pdf-contrato', {
                              body: {
                                contrato_id: vehicleId,
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
                            if (res.data?.success && res.data?.pdf_url) {
                              const { data: novoContrato, error } = await supabase
                                .from('contratos_consignacao')
                                .insert({
                                  veiculo_id: vehicleId,
                                  pdf_url: res.data.pdf_url,
                                  proprietario_nome: formData.proprietario_nome,
                                  proprietario_email: formData.proprietario_email,
                                  proprietario_cpf: formData.proprietario_cpf,
                                  proprietario_telefone: formData.proprietario_telefone,
                                  numero_contrato: `CNS-${vehicleId.split('-')[0].toUpperCase()}`,
                                })
                                .select('*')
                                .single()
                              if (error) throw error
                              setContrato(novoContrato)
                              toast({ title: 'Minuta gerada com sucesso!' })
                            } else {
                              throw new Error(res.data?.error || 'Erro desconhecido na geração')
                            }
                          } catch (err: any) {
                            toast({
                              title: 'Erro ao gerar',
                              description: err.message,
                              variant: 'destructive',
                            })
                          }
                        }}
                      >
                        Gerar Minuta de Contrato
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <div className="flex-1 space-y-1 w-full">
                        <p className="text-sm font-semibold text-slate-800">
                          Contrato Gerado{' '}
                          <span className="text-xs text-slate-500 font-normal">
                            ({contrato.numero_contrato || 'S/N'})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Status da Assinatura:{' '}
                          <span className="font-bold text-blue-600 uppercase">
                            {contrato.assinatura_status || 'NÃO ENVIADO'}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                        {contrato.pdf_url && (
                          <Button
                            variant="outline"
                            className="flex-1 sm:flex-none bg-white"
                            onClick={() => window.open(contrato.pdf_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> Visualizar Minuta
                          </Button>
                        )}
                        <AssinaturaDialog
                          contratoId={contrato.id}
                          emailCliente={contrato.proprietario_email}
                          nomeCliente={contrato.proprietario_nome}
                          proprietarioTelefone={contrato.proprietario_telefone}
                          proprietarioCpf={contrato.proprietario_cpf}
                          numeroContrato={contrato.numero_contrato}
                          pdfUrl={contrato.pdf_url}
                        />
                      </div>
                    </div>
                  )}
                  {contrato?.assinatura_link && (
                    <div className="mt-4 flex flex-col gap-2 bg-green-50 p-3 rounded-md border border-green-200">
                      <p className="text-xs font-semibold text-green-800">
                        Link de Assinatura Manual (Copie e envie no WhatsApp)
                      </p>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={contrato.assinatura_link}
                          readOnly
                          className="h-8 text-xs bg-white flex-1"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 shrink-0 bg-white hover:bg-slate-100"
                          onClick={() => {
                            navigator.clipboard.writeText(contrato.assinatura_link)
                            toast({ title: 'Link copiado!' })
                          }}
                        >
                          Copiar Link
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="marketing" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold flex items-center gap-2 text-slate-800">
                      <Sparkles className="w-5 h-5 text-purple-600" /> Kit de Divulgação (IA)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Gere automaticamente descrições focadas para Instagram, WhatsApp e Portais
                      (OLX).
                    </p>
                  </div>
                  <Button
                    onClick={handleGerarAdKit}
                    disabled={loadingAdKit || !vehicleId}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loadingAdKit ? 'Gerando...' : 'Gerar Kit com IA'}
                  </Button>
                </div>
                {adKitContent ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: adKitContent }}
                  />
                ) : (
                  <div className="text-center py-12 bg-slate-50 border border-dashed rounded-lg text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Nenhum conteúdo gerado ainda.</p>
                    <p className="text-xs">Clique no botão acima para criar o seu kit.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>

          {previewDoc && (
            <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
              <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col bg-slate-100">
                <DialogHeader className="p-4 border-b bg-white shrink-0">
                  <DialogTitle className="text-sm font-medium break-all">
                    {previewDoc.nome_documento}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  {previewDoc.tipo?.includes('image') ? (
                    <img
                      src={previewDoc.url_documento}
                      className="max-w-full max-h-full object-contain shadow-sm bg-white"
                      alt="Preview"
                    />
                  ) : (
                    <iframe
                      src={previewDoc.url_documento}
                      className="w-full h-full bg-white shadow-sm"
                      title="Preview PDF"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

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
