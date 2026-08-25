import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { cn, sanitizePhone, extractFinalPlaca } from '@/lib/utils'
import { resizeImages } from '@/lib/image-resize'
import { uploadToR2 } from '@/lib/r2-upload'
import { BatchPhotoUploader } from '@/components/admin/BatchPhotoUploader'
import { ImageEditorModal } from '@/components/admin/ImageEditorModal'
import { DocumentPreviewDialog } from '@/components/admin/DocumentPreviewDialog'
import { getFipeHistoryFromDB } from '@/services/fipe'
import { montarTituloMLPreview } from '@/lib/ml-title'
import {
  checkDiamondQuota,
  saveListingPreference,
  mlListingTypeToPreference,
} from '@/services/listing-preferences'
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
  Wand2,
  CheckCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  X,
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

// Roteiro Padrão de Fotografia de Veículos — Carro&Cia (08/2026), 20 fotos por carro.
// A ordem aqui é a ordem final publicada no site quando o operador salva o roteiro.
const PHOTO_ROTEIRO = [
  'Capa principal (frente 3/4)',
  'Frente em ângulo',
  'Traseira em ângulo',
  'Lateral esquerda inteira',
  'Lateral direita inteira',
  'Frente reta',
  'Traseira reta',
  'Painel e volante',
  'Bancos dianteiros',
  'Bancos traseiros',
  'Quilometragem no painel',
  'Central multimídia',
  'Rodas e pneus',
  'Porta-malas',
  'Motor',
  'Painel aceso',
  'Detalhe acabamento porta dianteira',
  'Detalhe pneu traseiro',
  'Teto solar / detalhe exclusivo',
  'Manual e cópia de chave',
]

// Reconhece o prefixo numérico do roteiro (01_capa.jpg, 02_frente_angulo.jpg...)
// no nome do arquivo. Retorna o índice do slot (0-based) ou null se não reconhecer.
function extractRoteiroSlot(url: string): number | null {
  const fileName = url.split('/').pop() || ''
  const match = fileName.match(/^0*(\d{1,2})[_-]/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return n >= 1 && n <= PHOTO_ROTEIRO.length ? n - 1 : null
}

function sanitizeFolderName(str: string): string {
  if (!str) return 'desconhecido'
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase()
}

const chartConfig = { valor: { label: 'Valor (R$)', color: 'hsl(var(--primary))' } }

export default function VehicleFormModal({ isOpen, onClose, vehicleId, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('geral')
  const [wmMapeamentoDialog, setWmMapeamentoDialog] = useState<{
    veiculoId: string
    motivo: string
    erroMsg: string | null
    candidatosModelo: { codigo_wm: string; nome_wm: string; score: number }[]
    candidatosVersao: { codigo_wm: string; nome_wm: string; score: number }[]
  } | null>(null)
  const [loadingWmMapeamento, setLoadingWmMapeamento] = useState(false)
  const [loadingPlaca, setLoadingPlaca] = useState(false)
  const [leadsCount, setLeadsCount] = useState(0)
  const [despesas, setDespesas] = useState<any[]>([])
  const [mediaAssets, setMediaAssets] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [contrato, setContrato] = useState<any>(null)
  const [cpfInfo, setCpfInfo] = useState<any>(null)
  const [isMediaCenterOpen, setIsMediaCenterOpen] = useState(false)
  const [mediaSearch, setMediaSearch] = useState('')
  const [roteiroAssign, setRoteiroAssign] = useState<(string | null)[]>(() =>
    Array(PHOTO_ROTEIRO.length).fill(null),
  )
  const [roteiroExpandedSlot, setRoteiroExpandedSlot] = useState<number | null>(null)
  const [roteiroConfirmOpen, setRoteiroConfirmOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const [newCaracteristica, setNewCaracteristica] = useState('')
  const [newOpcional, setNewOpcional] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [fipeHistory, setFipeHistory] = useState<any[]>([])
  const [isSyncingDrive, setIsSyncingDrive] = useState(false)

  const [novaDespesa, setNovaDespesa] = useState({
    categoria: 'Mecânica',
    descricao: '',
    valor: '',
    data_despesa: new Date().toISOString().split('T')[0],
    responsabilidade: 'loja',
    tipo: '',
    origem: '',
  })

  const maskPhone = (v: string) => {
    if (!v) return ''
    const r = v.replace(/\D/g, '')
    if (r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3')
    if (r.length > 5) return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3')
    if (r.length > 2) return r.replace(/^(\d\d)(\d{0,5})/, '($1) $2')
    return r.replace(/^(\d*)/, '($1')
  }

  const maskDate = (v: string) => {
    if (!v) return ''
    const r = v.replace(/\D/g, '')
    if (r.length > 4) return r.replace(/^(\d\d)(\d\d)(\d{0,4}).*/, '$1/$2/$3')
    if (r.length > 2) return r.replace(/^(\d\d)(\d{0,2}).*/, '$1/$2')
    return r
  }

  const calculateAge = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return ''
    const [d, m, y] = dateStr.split('/')
    const birthDate = new Date(`${y}-${m}-${d}`)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const mDiff = today.getMonth() - birthDate.getMonth()
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return `${age} anos`
  }

  const [formData, setFormData] = useState<any>({
    // Achado 25/08/2026 (pedido da Adriana): 'Carro' era um valor padrão
    // que parecia preenchido mas não é nenhuma categoria real aceita pelo
    // Mercado Livre — se ninguém trocasse no dropdown antes de salvar,
    // ficava gravado assim e só quebrava dias depois, na sincronização.
    // Vazio força escolha explícita (ver validatePortalFields).
    categoria: '',
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
    direcao: '',
    cilindrada: '',
    portas: '',
    ml_listing_type: 'silver',
    status: 'rascunho',
    tipo_entrada: 'consignacao',
    proprietario_nome: '',
    proprietario_telefone: '',
    proprietario_telefone_residencial: '',
    proprietario_telefone_trabalho: '',
    proprietario_email: '',
    proprietario_cpf: '',
    proprietario_estado_civil: '',
    diferenciais: [],
    caracteristicas: [],
    fotos: [],
    videos: [],
    info_personalizadas: {},
    publicado_olx: false,
    fipe_ref: 'Atual',
    versao: '',
    descricao: '',
    em_preparacao: false,
    garantia: false,
    laudo_cautelar: false,
    tag_promocional: '',
    notas_internas: '',
    requires_review: false,
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
            proprietario_estado_civil: res.estado_civil || p.proprietario_estado_civil,
          }))
          toast({ title: 'Dados do CPF importados!' })
        }
      } catch {
        /* intentionally ignored */
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
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const handleAddDespesa = async () => {
    if (!formData.id) return toast({ title: 'Salve o veículo primeiro', variant: 'destructive' })
    if (!novaDespesa.valor) return toast({ title: 'Informe o valor', variant: 'destructive' })
    setLoading(true)
    try {
      const payload = { veiculo_id: formData.id, ...novaDespesa, valor: Number(novaDespesa.valor) }
      const { data, error } = await supabase.from('despesas').insert([payload]).select()
      if (error) throw error
      setDespesas((p) => [...p, data[0]])
      setNovaDespesa({
        categoria: 'Mecânica',
        descricao: '',
        valor: '',
        data_despesa: new Date().toISOString().split('T')[0],
        responsabilidade: 'loja',
        tipo: '',
        origem: '',
      })
      toast({ title: 'Despesa lançada' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
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
          .maybeSingle()
          .then(({ data }) => {
            if (data) setContrato(data)
          })
      } else {
        setFormData({
          categoria: '',
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
          direcao: '',
          cilindrada: '',
          portas: '',
          ml_listing_type: 'silver',
          status: 'rascunho',
          tipo_entrada: 'consignacao',
          proprietario_nome: '',
          proprietario_telefone: '',
          proprietario_telefone_residencial: '',
          proprietario_telefone_trabalho: '',
          proprietario_email: '',
          proprietario_cpf: '',
          proprietario_estado_civil: '',
          diferenciais: [],
          caracteristicas: [],
          fotos: [],
    videos: [],
          info_personalizadas: {},
          publicado_olx: false,
          fipe_ref: 'Atual',
          versao: '',
          descricao: '',
          em_preparacao: false,
          notas_internas: '',
          requires_review: false,
        })
        setValidationErrors({})
      }
      loadMediaAssets()
    }
  }, [isOpen, vehicleId])

  const loadMediaAssets = () => {
    supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setMediaAssets(data || []))
  }

  // Recalcula os slots do roteiro sempre que a lista de fotos muda (upload manual,
  // sync do Drive, etc.) — preserva referências manuais já feitas e reconhece
  // automaticamente pelo prefixo numérico do arquivo o que ainda estiver livre.
  useEffect(() => {
    const fotos: string[] = Array.isArray(formData.fotos) ? formData.fotos : []
    setRoteiroAssign((prev) => {
      const next: (string | null)[] = Array(PHOTO_ROTEIRO.length).fill(null)
      prev.forEach((url, i) => {
        if (url && fotos.includes(url)) next[i] = url
      })
      fotos.forEach((url) => {
        if (next.includes(url)) return
        const slot = extractRoteiroSlot(url)
        if (slot !== null && next[slot] === null) next[slot] = url
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fotos])

  const handleSyncGoogleDrive = async () => {
    if (!formData.id) {
      toast({
        title: 'Por favor, salve o veículo primeiro antes de utilizar esta ferramenta.',
        variant: 'destructive',
      })
      return
    }
    if (!formData.placa) {
      toast({ title: 'Informe a placa do veículo primeiro', variant: 'destructive' })
      return
    }
    setIsSyncingDrive(true)
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-drive', {
        body: { placa: formData.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') },
      })
      if (error) throw error
      if (data?.success !== false) {
        const synced = data?.totalPhotosSynced || 0
        if (synced > 0 && formData.id) {
          const { data: updated } = await supabase
            .from('veiculos')
            .select('fotos')
            .eq('id', formData.id)
            .single()
          if (updated?.fotos) {
            setFormData((p: any) => ({ ...p, fotos: updated.fotos }))
          }
        }
        toast({
          title:
            synced > 0
              ? `Sincronização concluída: ${synced} fotos`
              : 'Nenhuma foto nova encontrada',
        })
      } else {
        throw new Error(data?.error || 'Falha na sincronização')
      }
    } catch (err: any) {
      toast({ title: 'Erro na sincronização', description: err.message, variant: 'destructive' })
    } finally {
      setIsSyncingDrive(false)
    }
  }

  useEffect(() => {
    const historico = formData.info_personalizadas?.historico_fipe
    if (Array.isArray(historico) && historico.length > 0) {
      const formatted = historico
        .map((item: any) => ({
          mes: item.mes_referencia || item.mes || item.reference || '',
          valor: Number(item.valor_fipe || item.valor || item.preco_fipe || item.price || 0),
        }))
        .filter((item: any) => item.mes && item.valor > 0)
        .reverse()
      setFipeHistory(formatted)
    } else if (formData.info_personalizadas?.codigo_fipe) {
      getFipeHistoryFromDB(formData.info_personalizadas.codigo_fipe).then(({ data }) => {
        if (data && data.length > 0) {
          setFipeHistory(
            data
              .map((item: any) => ({
                mes: item.mes_referencia || '',
                valor: Number(item.valor_fipe || 0),
              }))
              .filter((item: any) => item.mes && item.valor > 0),
          )
        } else {
          setFipeHistory([])
        }
      })
    } else {
      setFipeHistory([])
    }
  }, [formData.info_personalizadas])

  const consultarAPIPlaca = async () => {
    if (!formData.placa) return
    setLoadingPlaca(true)
    try {
      const { data, error } = await supabase.functions.invoke('consultar-placa', {
        body: { placa: formData.placa },
      })
      if (error || !data.success) throw new Error()
      setFormData((p: any) => ({
        ...p,
        ...data.data,
        ano_fabricacao: data.data.ano_fab || p.ano_fabricacao,
        valor_fipe: data.data.preco_fipe || p.valor_fipe,
        info_personalizadas: {
          ...(p.info_personalizadas || {}),
          codigo_fipe: data.data.codigo_fipe,
          url_fipe: data.data.url_fipe,
          historico_fipe: data.data.historico_fipe,
        },
      }))
      toast({ title: 'Dados importados!' })
    } catch (err: any) {
      toast({ title: 'Erro na consulta', variant: 'destructive' })
    } finally {
      setLoadingPlaca(false)
    }
  }

  const validateNumericField = (
    field: string,
    value: string,
    opts: { min?: number; max?: number; integer?: boolean },
  ) => {
    if (value === '' || value === undefined || value === null) {
      setValidationErrors((p) => {
        const n = { ...p }
        delete n[field]
        return n
      })
      return
    }
    const num = Number(value)
    if (isNaN(num)) {
      setValidationErrors((p) => ({ ...p, [field]: 'Valor inválido' }))
      return
    }
    if (opts.integer && !Number.isInteger(num)) {
      setValidationErrors((p) => ({ ...p, [field]: 'Apenas números inteiros' }))
      return
    }
    if (opts.min !== undefined && num < opts.min) {
      setValidationErrors((p) => ({ ...p, [field]: `Valor mínimo: ${opts.min}` }))
      return
    }
    if (opts.max !== undefined && num > opts.max) {
      setValidationErrors((p) => ({ ...p, [field]: `Valor máximo: ${opts.max}` }))
      return
    }
    setValidationErrors((p) => {
      const n = { ...p }
      delete n[field]
      return n
    })
  }

  // Faixa de 65%-135% da FIPE, confirmada pelo suporte Webmotors ("aceitamos
  // percentual mínimo (35%) e máximo (35%) baseado na FIPE") — corrigida em
  // 12/08/2026 pra validar o "Por" (preco_venda), não o "De". O "De"
  // (preco_revenda) deixou de ser digitado: é sempre igual ao Valor FIPE
  // (campo travado, ver JSX). Decisão da Adriana em 12/08/2026: aceitar que o
  // "Por" fique até 135% da FIPE mesmo sabendo que isso deixa o "De" (=FIPE)
  // menor que o "Por" — o que um teste ao vivo já mostrou que bloqueia com
  // CodigoRetorno 22|78 na Honda WR-V (ver docs/webmotors-integracao.md). Não
  // reduzir essa faixa sem confirmar com ela de novo.
  const validatePrecoVendaFipe = (value: string, fipeOverride?: number) => {
    const fipe = fipeOverride ?? (Number(formData.valor_fipe) || 0)
    if (value === '' || value === undefined || value === null || fipe <= 0) {
      setValidationErrors((p) => {
        const n = { ...p }
        delete n.preco_venda_fipe
        return n
      })
      return
    }
    const num = Number(value)
    if (isNaN(num)) return
    const min = fipe * 0.65
    const max = fipe * 1.35
    if (num < min || num > max) {
      setValidationErrors((p) => ({
        ...p,
        preco_venda_fipe: `Fora da faixa aceita pela Webmotors (65%-135% da FIPE): R$ ${min.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} a R$ ${max.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      }))
      return
    }
    setValidationErrors((p) => {
      const n = { ...p }
      delete n.preco_venda_fipe
      return n
    })
  }

  // Aba onde cada campo obrigatório vive — usado pra trocar de aba automaticamente
  // e mostrar o erro onde o operador precisa corrigir, em vez de só um toast.
  const PORTAL_FIELD_TABS: Record<string, string> = {
    marca: 'geral',
    modelo: 'geral',
    categoria: 'geral',
    ano_fabricacao: 'geral',
    cor: 'geral',
    combustivel: 'geral',
    quilometragem: 'geral',
    preco_venda: 'geral',
    fotos: 'midia',
  }

  const validatePortalFields = (): { ok: boolean; firstErrorTab: string | null } => {
    const missing: { field: string; label: string }[] = []
    if (!formData.marca) missing.push({ field: 'marca', label: 'Marca' })
    if (!formData.modelo) missing.push({ field: 'modelo', label: 'Modelo' })
    // Achado 25/08/2026: categoria não era exigida aqui — o valor padrão
    // inválido 'Carro' passava direto e só quebrava na sincronização.
    if (!formData.categoria) missing.push({ field: 'categoria', label: 'Categoria' })
    if (!formData.ano_fabricacao) missing.push({ field: 'ano_fabricacao', label: 'Ano' })
    if (!formData.cor) missing.push({ field: 'cor', label: 'Cor' })
    if (!formData.combustivel) missing.push({ field: 'combustivel', label: 'Combustível' })
    if (!formData.quilometragem) missing.push({ field: 'quilometragem', label: 'KM' })
    if (!formData.preco_venda) missing.push({ field: 'preco_venda', label: 'Preço' })
    if (!formData.fotos || formData.fotos.length === 0)
      missing.push({ field: 'fotos', label: 'Fotos (mínimo 1)' })
    if (missing.length > 0) {
      toast({
        title: '⚠️ Campos obrigatórios ausentes',
        description: `Corrija antes de salvar, na aba indicada: ${missing.map((m) => `${m.label} (${m.field === 'fotos' ? 'Fotos & Mídia' : 'Geral & Valores'})`).join(', ')}`,
        variant: 'destructive',
      })
      return { ok: false, firstErrorTab: PORTAL_FIELD_TABS[missing[0].field] || 'geral' }
    }
    return { ok: true, firstErrorTab: null }
  }

  const save = async (
    status = 'disponivel',
    shouldClose = true,
    overrides: Record<string, any> = {},
  ): Promise<string | null> => {
    if (Object.keys(validationErrors).length > 0) {
      toast({ title: 'Corrija os erros de validação antes de salvar', variant: 'destructive' })
      return null
    }
    setLoading(true)
    if (formData.ml_listing_type === 'gold_pro') {
      const { canPromote } = await checkDiamondQuota(formData.id)
      if (!canPromote) {
        toast({
          title: 'Limite de 15 veículos Diamante atingido',
          description: 'Altere outro veículo para Prata antes de promover este.',
          variant: 'destructive',
        })
        setLoading(false)
        return null
      }
    }
    try {
      // `overrides` é aplicado explicitamente aqui, não via setFormData antes de
      // chamar save() — setFormData é assíncrono (batching do React) e o payload
      // acabava sendo montado com o formData antigo (bug do antigo botão "Aprovar
      // e Publicar", que fazia setFormData({requires_review:false}) e chamava
      // save() na sequência, sem garantia de que o novo valor já estivesse lá).
      const merged = { ...formData, ...overrides }
      const sanitizeNumber = (val: any) => {
        if (!val) return null
        const num = Number(val.toString().replace(/\./g, '').replace(',', '.'))
        return isNaN(num) ? null : num
      }
      const numericFields = [
        'ano_fabricacao',
        'ano_modelo',
        'quilometragem',
        'portas',
        'valor_fipe',
        'preco_venda',
        'preco_minimo',
        'preco_classificados',
        'cliques_whatsapp',
        'visualizacoes_site',
      ]
      const sanitizedNumeric: Record<string, number | null> = {}
      for (const field of numericFields) {
        sanitizedNumeric[field] = sanitizeNumber(merged[field])
      }
      // "De" (preco_revenda) não é mais digitado — é sempre igual ao Valor FIPE
      // (12/08/2026, pedido da Adriana). Único ponto que grava esse campo.
      sanitizedNumeric.preco_revenda = sanitizedNumeric.valor_fipe
      const payload = {
        ...merged,
        ...sanitizedNumeric,
        proprietario_telefone: sanitizePhone(merged.proprietario_telefone),
        proprietario_telefone_residencial: sanitizePhone(
          merged.proprietario_telefone_residencial,
        ),
        proprietario_telefone_trabalho: sanitizePhone(merged.proprietario_telefone_trabalho),
        final_placa: extractFinalPlaca(merged.placa),
        is_consignado: merged.tipo_entrada === 'consignacao',
        status,
        updated_at: new Date().toISOString(),
      }
      delete payload.tipo_entrada
      delete payload.ano_fab
      delete payload.preco_fipe
      delete payload.historico_fipe
      if (!payload.id) delete payload.id
      const { data, error } = payload.id
        ? await supabase.from('veiculos').update(payload).eq('id', payload.id).select()
        : await supabase.from('veiculos').insert([payload]).select()
      if (error) throw error
      const savedId = data && data[0] ? data[0].id : null
      if (savedId) {
        setFormData((p: any) => ({ ...p, ...overrides, id: savedId }))
        await saveListingPreference(
          savedId,
          'mercadolivre',
          mlListingTypeToPreference(merged.ml_listing_type || 'silver'),
        )
      }
      toast({ title: 'Veículo salvo com sucesso!' })
      onSuccess()
      if (shouldClose) onClose()
      return savedId
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao salvar o veículo',
        variant: 'destructive',
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  // Botão único "Validar e Salvar": substitui "Aprovar e Publicar" + "Salvar
  // Veículo" (12/08/2026). Valida os campos obrigatórios, salva e roda o
  // mapeamento de catálogo Webmotors (wm-mapear-veiculo) na hora, mostrando os
  // candidatos aqui mesmo quando a confiança automática não é suficiente — não
  // manda pra uma tela separada depois. Não publica em plataforma nenhuma: só
  // libera o veículo pra fila de sincronização (isso é feito pelo toggle da
  // tela Portais ou pelo "Sincronizar Agora").
  const handleValidarESalvar = async () => {
    const { ok, firstErrorTab } = validatePortalFields()
    if (!ok) {
      if (firstErrorTab) setActiveTab(firstErrorTab)
      return
    }

    let valorFipeAtual = Number(formData.valor_fipe) || 0
    const overrides: Record<string, any> = { requires_review: false }

    // Busca a FIPE automaticamente pela placa se faltar — sem FIPE não dá pra
    // validar a faixa de 65%-135% do "Por", nem preencher o "De" (que agora é
    // sempre igual ao Valor FIPE, 12/08/2026).
    if (!valorFipeAtual && formData.placa) {
      setLoadingWmMapeamento(true)
      try {
        const { data: placaData, error: placaError } = await supabase.functions.invoke(
          'consultar-placa',
          { body: { placa: formData.placa } },
        )
        if (!placaError && placaData?.success && placaData.data?.preco_fipe) {
          valorFipeAtual = Number(placaData.data.preco_fipe) || 0
          overrides.valor_fipe = placaData.data.preco_fipe
          overrides.info_personalizadas = {
            ...(formData.info_personalizadas || {}),
            codigo_fipe: placaData.data.codigo_fipe,
            url_fipe: placaData.data.url_fipe,
            historico_fipe: placaData.data.historico_fipe,
          }
        }
      } finally {
        setLoadingWmMapeamento(false)
      }
    }

    // Faixa aceita pela Webmotors: "Por" entre 65% e 135% da FIPE (12/08/2026,
    // corrigido — antes essa faixa validava o "De" por engano). Decisão da
    // Adriana: manter os 135% cheios mesmo sabendo que, acima de 100% da FIPE,
    // o "De" (=FIPE) fica menor que o "Por" — o que um teste ao vivo na Honda
    // WR-V mostrou que a Webmotors bloqueia com CodigoRetorno 22|78. Risco
    // aceito conscientemente; não é bug se isso acontecer.
    const vendaAtual = Number(formData.preco_venda) || 0
    if (vendaAtual > 0 && valorFipeAtual > 0) {
      const min = valorFipeAtual * 0.65
      const max = valorFipeAtual * 1.35
      if (vendaAtual < min || vendaAtual > max) {
        toast({
          title: 'Preço de Venda fora da faixa FIPE',
          description: `Precisa ficar entre R$ ${min.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} e R$ ${max.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (65%-135% da FIPE) para publicar na Webmotors.`,
          variant: 'destructive',
        })
        setActiveTab('geral')
        return
      }
    }

    const savedId = await save('disponivel', false, overrides)
    if (!savedId) return

    if (!valorFipeAtual) {
      toast({
        title: 'Sem Valor FIPE',
        description:
          'Preencha a placa (Consultar Placa Inteligente) ou o Valor FIPE manualmente antes de anunciar na Webmotors.',
      })
    }

    setLoadingWmMapeamento(true)
    try {
      const { data: mapData, error: mapError } = await supabase.functions.invoke(
        'wm-mapear-veiculo',
        { body: { veiculo_id: savedId } },
      )
      if (mapError) throw mapError
      if (mapData?.status === 'mapeado') {
        toast({ title: 'Veículo validado e liberado para sincronização com as plataformas!' })
        onClose()
      } else if (mapData?.status === 'revisao_necessaria') {
        const { data: mapeamento } = await supabase
          .from('wm_mapeamento_veiculos')
          .select('erro_msg, candidatos_modelo, candidatos_versao')
          .eq('veiculo_id', savedId)
          .maybeSingle()
        setWmMapeamentoDialog({
          veiculoId: savedId,
          motivo: mapData.motivo || 'desconhecido',
          erroMsg: mapeamento?.erro_msg || null,
          candidatosModelo: mapeamento?.candidatos_modelo || [],
          candidatosVersao: mapeamento?.candidatos_versao || [],
        })
      } else {
        onClose()
      }
    } catch (err: any) {
      toast({
        title: 'Veículo salvo, mas não foi possível checar o mapeamento Webmotors agora',
        description: err.message,
      })
      onClose()
    } finally {
      setLoadingWmMapeamento(false)
    }

    // Achado 25/08/2026 (pedido da Adriana, caso real: um Hilux ficou dias
    // sem publicar no NaPista porque o mapeamento de catálogo nunca foi
    // disparado — a Webmotors já roda automático aqui em cima, o NaPista
    // dependia de alguém clicar "Remapear" na tela de Pendências depois).
    // Mesmo padrão da Webmotors: roda na hora de salvar, sem esperar uma
    // tentativa de publicação falhar pra descobrir. Não bloqueia o fluxo
    // acima nem troca a tela — só avisa se precisar de revisão.
    try {
      const { data: napistaMapData } = await supabase.functions.invoke('napista-mapear-veiculo', {
        body: { veiculo_id: savedId },
      })
      if (napistaMapData?.status === 'revisao_necessaria') {
        const { data: napistaMapeamento } = await supabase
          .from('napista_mapeamento_veiculos')
          .select('erro_msg')
          .eq('veiculo_id', savedId)
          .maybeSingle()
        toast({
          title: 'Veículo precisa de revisão no catálogo NaPista',
          description:
            napistaMapeamento?.erro_msg ||
            'Confira em Portais → aba NaPista antes de tentar publicar.',
        })
      }
    } catch (napistaErr: any) {
      console.debug('Falha ao checar mapeamento NaPista (não bloqueia o salvamento):', napistaErr)
    }
  }

  const handleConfirmarMapeamento = async (codigoModeloWm?: string, codigoVersaoWm?: string) => {
    if (!wmMapeamentoDialog) return
    setLoadingWmMapeamento(true)
    try {
      const { data, error } = await supabase.functions.invoke('wm-confirmar-mapeamento', {
        body: {
          veiculo_id: wmMapeamentoDialog.veiculoId,
          codigo_modelo_wm: codigoModeloWm,
          codigo_versao_wm: codigoVersaoWm,
        },
      })
      if (error) throw error
      if (data?.status === 'revisao_necessaria') {
        toast({
          title: 'Modelo/versão confirmados, mas ainda falta cor/câmbio/combustível',
          description: data.erro_msg || 'Cadastre o valor equivalente no catálogo Webmotors.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Mapeamento confirmado! Veículo liberado para sincronização.' })
        setWmMapeamentoDialog(null)
      }
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao confirmar mapeamento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingWmMapeamento(false)
    }
  }

  const toggleArray = (field: string, val: string) =>
    setFormData((p: any) => ({
      ...p,
      [field]: (p[field] || []).includes(val)
        ? p[field].filter((x: string) => x !== val)
        : [...(p[field] || []), val],
    }))

  const handleMediaSelect = async (url: string) => {
    const isIncluded = (formData.fotos || []).includes(url)
    const newFotos = isIncluded
      ? (formData.fotos || []).filter((f: string) => f !== url)
      : [...(formData.fotos || []), url]

    setFormData((p: any) => ({ ...p, fotos: newFotos }))
    if (formData.id) {
      await supabase.from('veiculos').update({ fotos: newFotos }).eq('id', formData.id)
    }
  }

  const setAsCover = async (url: string) => {
    const newFotos = [url, ...(formData.fotos || []).filter((f: string) => f !== url)]
    setFormData((p: any) => ({ ...p, fotos: newFotos }))
    if (formData.id) {
      await supabase.from('veiculos').update({ fotos: newFotos }).eq('id', formData.id)
    }
  }

  const handlePhotoUpload = async (e: any) => {
    const files = Array.from(e.target.files || []) as File[]
    if (!files.length) return
    setIsUploadingPhotos(true)

    try {
      const resizedBlobs = await resizeImages(files)
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      const folderName = `${sanitizeFolderName(formData.modelo)}_${sanitizeFolderName(formData.placa)}`

      const newPhotos: string[] = []

      for (let i = 0; i < resizedBlobs.length; i++) {
        const blob = resizedBlobs[i]
        const file = files[i]
        const ext = blob.type.includes('png') ? 'png' : 'jpg'
        const fileName = `${folderName}/${Date.now()}_${i}.${ext}`
        const fileType = blob.type || 'image/jpeg'

        const { publicUrl } = await uploadToR2(blob, fileName, fileType, 'media')
        newPhotos.push(publicUrl)

        await supabase.from('media_assets').insert([
          {
            file_name: file.name,
            file_path: publicUrl,
            file_size: blob.size,
            mime_type: fileType,
            folder: folderName,
            uploaded_by: userId,
          },
        ])
      }

      const updatedFotos = [...(formData.fotos || []), ...newPhotos]
      setFormData((p: any) => ({
        ...p,
        fotos: updatedFotos,
      }))

      if (formData.id) {
        await supabase.from('veiculos').update({ fotos: updatedFotos }).eq('id', formData.id)
      }

      toast({ title: 'Fotos enviadas com sucesso' })
      loadMediaAssets()
    } catch (err: any) {
      toast({ title: 'Erro ao enviar fotos', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploadingPhotos(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  // Separado de handlePhotoUpload de propósito: vídeo nunca passa por resizeImages
  // (que é só pra imagem) nem recebe extensão .jpg/.png forçada — isso já causou
  // vídeo sendo salvo com nome de foto e content-type divergente. Vai direto pra
  // formData.videos, nunca pra formData.fotos.
  const handleVideoUpload = async (e: any) => {
    const files = Array.from(e.target.files || []) as File[]
    if (!files.length) return
    setIsUploadingVideo(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      const folderName = `${sanitizeFolderName(formData.modelo)}_${sanitizeFolderName(formData.placa)}`

      const newVideos: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('video/')) {
          toast({
            title: `"${file.name}" não é um vídeo`,
            description: 'Use o botão "Fotos" para imagens.',
            variant: 'destructive',
          })
          continue
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
        const fileName = `${folderName}/${Date.now()}_${i}.${ext}`
        const fileType = file.type || 'video/mp4'

        const { publicUrl } = await uploadToR2(file, fileName, fileType, 'media')
        newVideos.push(publicUrl)

        await supabase.from('media_assets').insert([
          {
            file_name: file.name,
            file_path: publicUrl,
            file_size: file.size,
            mime_type: fileType,
            folder: folderName,
            uploaded_by: userId,
          },
        ])
      }

      if (newVideos.length > 0) {
        const updatedVideos = [...(formData.videos || []), ...newVideos]
        setFormData((p: any) => ({
          ...p,
          videos: updatedVideos,
        }))

        if (formData.id) {
          await supabase.from('veiculos').update({ videos: updatedVideos }).eq('id', formData.id)
        }

        toast({ title: 'Vídeo(s) enviado(s) com sucesso' })
        loadMediaAssets()
      }
    } catch (err: any) {
      toast({ title: 'Erro ao enviar vídeo', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const handleDocumentFile = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file || !formData.id) return
    setLoading(true)
    try {
      const filePath = `${formData.id}/${Date.now()}_${file.name}`
      await supabase.storage.from('documentos-veiculos').upload(filePath, file)
      const {
        data: { publicUrl },
      } = supabase.storage.from('documentos-veiculos').getPublicUrl(filePath)
      const { data } = await supabase
        .from('documentos')
        .insert([
          {
            veiculo_id: formData.id,
            nome_documento: file.name,
            tipo: file.type,
            tamanho: file.size,
            url_documento: publicUrl,
          },
        ])
        .select()
      if (data) setDocumentos((p) => [...p, data[0]])
      toast({ title: 'Documento anexado' })
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  const [adKitContent, setAdKitContent] = useState<string | null>(null)
  const [loadingAdKit, setLoadingAdKit] = useState(false)
  const [loadingDescricao, setLoadingDescricao] = useState(false)
  const [aiTone, setAiTone] = useState('Persuasivo')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const sanitizeAiText = (raw: string): string => {
    if (!raw) return ''
    return raw
      .replace(/<[^>]*>/g, '')
      .replace(/[*#`>_~]/g, '')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const handleGerarDescricao = async () => {
    setLoadingDescricao(true)
    try {
      const primeiraFoto = (formData.fotos || [])[0] || ''
      const diferenciaisText = Array.isArray(formData.diferenciais)
        ? formData.diferenciais.join(', ')
        : ''
      const tema = `Gere uma descrição persuasiva de vendedor para o veículo: ${formData.marca} ${formData.modelo} ${formData.versao || ''} - Ano Fab: ${formData.ano_fabricacao || 'N/A'}, Ano Mod: ${formData.ano_modelo || 'N/A'}. Cor: ${formData.cor}. Quilometragem: ${formData.quilometragem} km. Combustível: ${formData.combustivel}. Câmbio: ${formData.cambio}. Portas: ${formData.portas || 'N/A'}. Preço: R$ ${formData.preco_venda || 'N/A'}. Diferenciais e opcionais: ${diferenciaisText || 'Nenhum'}. ${primeiraFoto ? `Foto de referência: ${primeiraFoto}` : ''}. REGRAS OBRIGATÓRIAS: Foque no estilo, apelo visual, diferenciais exclusivos e desempenho do veículo. NÃO mencione serviços da concessionária, garantias, financiamento, informações de contato ou frases como "nossa loja" ou "entre em contato".`
      const { data, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: {
          tema,
          palavraChave: `${formData.marca} ${formData.modelo} seminovo uberaba`,
          tom: aiTone,
        },
      })
      if (error) throw error
      if (data?.success && data?.data?.texto_html) {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = data.data.texto_html
        const plainText = tempDiv.textContent || tempDiv.innerText || ''
        const cleanedText = sanitizeAiText(plainText)
        setFormData((p: any) => ({
          ...p,
          descricao: cleanedText.substring(0, 1000),
          requires_review: true,
        }))
        toast({ title: 'Descrição gerada com IA! Marque para revisão.' })
      }
    } catch {
      toast({ title: 'Erro ao gerar descrição', variant: 'destructive' })
    } finally {
      setLoadingDescricao(false)
    }
  }

  const handleGerarAdKit = async () => {
    if (!formData.id) {
      toast({
        title: 'Por favor, salve o veículo primeiro antes de utilizar esta ferramenta.',
        variant: 'destructive',
      })
      return
    }
    setLoadingAdKit(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-social', {
        body: { veiculo_id: formData.id },
      })
      if (error) throw error
      if (data?.success && data?.data) {
        setAdKitContent(data.data)
        toast({ title: 'Kit de anúncio gerado!' })
      } else {
        throw new Error(data?.error || 'Erro desconhecido')
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar kit', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingAdKit(false)
    }
  }

  const filteredMedia = mediaAssets.filter((a) => {
    const matchSearch =
      a.file_name?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      a.folder?.toLowerCase().includes(mediaSearch.toLowerCase())
    const matchFolder = selectedFolder ? (a.folder || 'Geral') === selectedFolder : true
    return matchSearch && matchFolder
  })

  const folders = Array.from(new Set(mediaAssets.map((a) => a.folder || 'Geral'))).filter(Boolean)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 bg-slate-50 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />{' '}
            {vehicleId ? 'EDITAR VEÍCULO' : 'CADASTRAR VEÍCULO'}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="bg-white border-b rounded-none w-full justify-start px-6 py-2 gap-4 shrink-0 overflow-x-auto">
            <TabsTrigger value="geral">
              <Settings className="w-4 h-4 mr-2" /> Geral & Valores
            </TabsTrigger>
            <TabsTrigger value="inspecao">
              <FileCheck className="w-4 h-4 mr-2" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="midia">
              <Camera className="w-4 h-4 mr-2" /> Fotos & Mídia
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              <ChartIcon className="w-4 h-4 mr-2" /> ROI & Histórico
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Users className="w-4 h-4 mr-2" /> Leads
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileCheck className="w-4 h-4 mr-2" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="marketing" disabled={!formData.id}>
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

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <Label className="font-bold text-amber-900">Veículo em Preparação</Label>
                  <p className="text-xs text-amber-700 mt-1">
                    Marque enquanto o veículo está em limpeza/preparo. Exibe placeholder no site
                    público quando não há fotos.
                  </p>
                </div>
                <Switch
                  checked={formData.em_preparacao || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, em_preparacao: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-bold">Garantia</Label>
                  <Switch
                    checked={formData.garantia || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, garantia: checked })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-bold">Laudo Cautelar</Label>
                  <Switch
                    checked={formData.laudo_cautelar || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, laudo_cautelar: checked })
                    }
                  />
                </div>
                <div>
                  <Label>Etiqueta Promocional</Label>
                  <Select
                    value={formData.tag_promocional || 'nenhuma'}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        tag_promocional: v === 'nenhuma' ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                      <SelectItem value="oferta">Oferta</SelectItem>
                      <SelectItem value="novidade">Novidade</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Dados Básicos</h3>
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
                      <Select
                        value={formData.combustivel || ''}
                        onValueChange={(v) => setFormData({ ...formData, combustivel: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gasolina">Gasolina</SelectItem>
                          <SelectItem value="Álcool">Álcool</SelectItem>
                          <SelectItem value="Flex">Flex</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="GNV">GNV</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                          <SelectItem value="Elétrico">Elétrico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Km</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.quilometragem || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, quilometragem: e.target.value })
                          validateNumericField('quilometragem', e.target.value, {
                            min: 1,
                            integer: true,
                          })
                        }}
                      />
                      {validationErrors.quilometragem && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.quilometragem}
                        </p>
                      )}
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
                    <div>
                      <Label>Portas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.portas || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, portas: e.target.value })
                          validateNumericField('portas', e.target.value, {
                            min: 1,
                            max: 10,
                            integer: true,
                          })
                        }}
                        placeholder="Ex: 4"
                      />
                      {validationErrors.portas && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.portas}</p>
                      )}
                    </div>
                    <div>
                      <Label>Direção</Label>
                      <Select
                        value={formData.direcao || ''}
                        onValueChange={(v) => setFormData({ ...formData, direcao: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                          <SelectItem value="Elétrica">Elétrica</SelectItem>
                          <SelectItem value="Assistida">Assistida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cilindrada</Label>
                      <Input
                        value={formData.cilindrada || ''}
                        onChange={(e) => setFormData({ ...formData, cilindrada: e.target.value })}
                        placeholder="Ex: 1.0, 2.0, 1598"
                      />
                    </div>
                    <div>
                      <Label>Versão</Label>
                      <Input
                        value={formData.versao || ''}
                        onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                        placeholder="Ex: 1.0 Flex, LTZ, GT-Line"
                      />
                    </div>
                    <div>
                      <Label>Categoria *</Label>
                      <Select
                        value={formData.categoria || 'Carro'}
                        onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hatch">Hatch</SelectItem>
                          <SelectItem value="Sedan">Sedan</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Picape">Picape</SelectItem>
                          <SelectItem value="Esportivo">Esportivo</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Moto">Moto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Câmbio</Label>
                      <Select
                        value={formData.cambio || 'Manual'}
                        onValueChange={(v) => setFormData({ ...formData, cambio: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automático">Automático</SelectItem>
                          <SelectItem value="Semi-automático">Semi-automático</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Preços e Valores</h3>
                  <div>
                    <Label>Valor FIPE</Label>
                    <CurrencyInput
                      value={formData.valor_fipe || ''}
                      onChange={(v) => {
                        setFormData({ ...formData, valor_fipe: v })
                        validateNumericField('valor_fipe', v, { min: 0 })
                        validatePrecoVendaFipe(String(formData.preco_venda || ''), Number(v) || 0)
                      }}
                    />
                    {validationErrors.valor_fipe && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.valor_fipe}</p>
                    )}
                  </div>
                  <div>
                    <Label>Preço de Venda (Site)</Label>
                    <CurrencyInput
                      value={formData.preco_venda || ''}
                      onChange={(v) => {
                        setFormData({ ...formData, preco_venda: v })
                        validateNumericField('preco_venda', v, { min: 0 })
                        validatePrecoVendaFipe(v)
                      }}
                      className="text-green-700 font-bold"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Precisa ficar entre 65% e 135% do Valor FIPE — é a faixa que a Webmotors
                      aceita.
                    </p>
                    {validationErrors.preco_venda && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.preco_venda}</p>
                    )}
                    {validationErrors.preco_venda_fipe && (
                      <p className="text-xs text-red-500 mt-1">
                        {validationErrors.preco_venda_fipe}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Preço "De" (Webmotors)</Label>
                    <CurrencyInput value={formData.valor_fipe || ''} disabled className="bg-gray-100 text-gray-600" />
                    <p className="text-xs text-gray-500 mt-1">
                      Preço riscado de vitrine, exigido pela Webmotors — preenchido
                      automaticamente com o Valor FIPE, não é editável aqui. Pra mudar, ajuste o
                      Valor FIPE acima.
                    </p>
                  </div>
                  <div>
                    <Label>Preço Mínimo</Label>
                    <CurrencyInput
                      value={formData.preco_minimo || ''}
                      onChange={(v) => {
                        setFormData({ ...formData, preco_minimo: v })
                        validateNumericField('preco_minimo', v, { min: 0 })
                      }}
                    />
                    {validationErrors.preco_minimo && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.preco_minimo}</p>
                    )}
                  </div>
                  <div>
                    <Label>Notas / Destaques (para IA)</Label>
                    <Textarea
                      value={formData.notas_internas || ''}
                      onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
                      className="h-20"
                      placeholder="Ex: pneus novos, único dono, IPVA pago, revisões em concessionária..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Observações / Descrição</Label>
                      <div className="flex items-center gap-2">
                        <Select value={aiTone} onValueChange={setAiTone}>
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Persuasivo">Persuasivo</SelectItem>
                            <SelectItem value="Técnico">Técnico</SelectItem>
                            <SelectItem value="Emocional">Emocional</SelectItem>
                            <SelectItem value="Formal">Formal</SelectItem>
                            <SelectItem value="Descontraído">Descontraído</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                          onClick={handleGerarDescricao}
                          disabled={loadingDescricao}
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          {loadingDescricao ? 'Gerando...' : 'Gerar com IA'}
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={formData.descricao || ''}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="h-32"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const titlePreview = montarTituloMLPreview(formData)
                const fipeDiff =
                  formData.valor_fipe && formData.preco_venda
                    ? Math.abs(Number(formData.preco_venda) - Number(formData.valor_fipe)) /
                      Number(formData.valor_fipe)
                    : 0
                const showFipeWarning =
                  formData.valor_fipe && formData.preco_venda && fipeDiff > 0.3

                return (
                  <div className="space-y-4">
                    {showFipeWarning && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-yellow-800">
                            Atenção: Divergência de Preço FIPE
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            O preço de venda difere mais de 30% do valor FIPE (R${' '}
                            {Number(formData.valor_fipe).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                            ). Considere reavaliar o preço ou a classificação do anúncio.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                          <Car className="w-4 h-4 text-blue-600" /> Preview do Título Mercado Livre
                        </h3>
                        <span
                          className={cn(
                            'text-xs font-bold px-2 py-1 rounded-full',
                            titlePreview.length > 60
                              ? 'bg-red-100 text-red-700'
                              : titlePreview.truncado
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700',
                          )}
                        >
                          Título: {titlePreview.length}/60 caracteres
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border mb-2">
                        {titlePreview.titulo || '(preencha os campos para ver o título)'}
                      </p>
                      {titlePreview.truncado ? (
                        <div className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>Truncação ativa:</strong> Campos removidos:{' '}
                            {titlePreview.campos_removidos.join(', ')}. Ordem de remoção: Versão →
                            Combustível → Câmbio → corte em 60 caracteres.
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          O título é montado com: Ano Modelo + Marca + Modelo + Versão + Combustível
                          + Câmbio. Se passar de 60 caracteres, campos serão removidos
                          progressivamente.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-4">Proprietário / Entrada</h3>
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proprietario_cpf: e.target.value.replace(/[^\d]/g, ''),
                        })
                      }
                      onBlur={(e) => handleDocumentoSearch(e.target.value)}
                      className="bg-white font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Celular</Label>
                    <Input
                      value={maskPhone(formData.proprietario_telefone || '')}
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
                  <div className="col-span-1">
                    <Label>Telefone Residencial</Label>
                    <Input
                      value={maskPhone(formData.proprietario_telefone_residencial || '')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proprietario_telefone_residencial: e.target.value,
                        })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Telefone Trabalho</Label>
                    <Input
                      value={maskPhone(formData.proprietario_telefone_trabalho || '')}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_telefone_trabalho: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Data de Nascimento</Label>
                    <Input
                      value={maskDate(formData.proprietario_data_nascimento || '')}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_data_nascimento: e.target.value })
                      }
                      placeholder="DD/MM/AAAA"
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Idade</Label>
                    <Input
                      value={calculateAge(formData.proprietario_data_nascimento || '')}
                      readOnly
                      className="bg-slate-100"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Estado Civil</Label>
                    <Select
                      value={formData.proprietario_estado_civil || ''}
                      onValueChange={(v) =>
                        setFormData({ ...formData, proprietario_estado_civil: v })
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        <SelectItem value="uniao_estavel">União Estável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Label>Sexo</Label>
                    <Select
                      value={formData.proprietario_sexo || ''}
                      onValueChange={(v) => setFormData({ ...formData, proprietario_sexo: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Nome da Mãe</Label>
                    <Input
                      value={formData.proprietario_mae || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_mae: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>CEP</Label>
                    <Input
                      value={formData.proprietario_cep || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_cep: e.target.value })
                      }
                      onBlur={(e) => handleCepBlur(e.target.value)}
                      placeholder="00000-000"
                      className="bg-white font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Logradouro (Rua)</Label>
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
                  <div className="col-span-2">
                    <Label>Complemento</Label>
                    <Input
                      value={formData.proprietario_complemento || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_complemento: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Bairro</Label>
                    <Input
                      value={formData.proprietario_bairro || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_bairro: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.proprietario_cidade || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietario_cidade: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Estado (UF)</Label>
                    <Input
                      value={formData.proprietario_estado || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proprietario_estado: e.target.value.toUpperCase(),
                        })
                      }
                      maxLength={2}
                      className="bg-white uppercase"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inspecao" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold border-b pb-2 mb-4">Características</h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newCaracteristica}
                    onChange={(e) => setNewCaracteristica(e.target.value)}
                    placeholder="Adicionar característica personalizada..."
                    className="bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCaracteristica.trim()) {
                        toggleArray('caracteristicas', newCaracteristica.trim())
                        setNewCaracteristica('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from(
                    new Set([...CARACTERISTICAS_LIST, ...(formData.caracteristicas || [])]),
                  ).map((c: string) => (
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
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newOpcional}
                    onChange={(e) => setNewOpcional(e.target.value)}
                    placeholder="Adicionar opcional personalizado..."
                    className="bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newOpcional.trim()) {
                        toggleArray('diferenciais', newOpcional.trim())
                        setNewOpcional('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from(new Set([...OPCIONAIS_LIST, ...(formData.diferenciais || [])])).map(
                    (o: string) => (
                      <label key={o} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={(formData.diferenciais || []).includes(o)}
                          onCheckedChange={() => toggleArray('diferenciais', o)}
                        />{' '}
                        {o}
                      </label>
                    ),
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="midia" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-800">
                    <ImageIcon className="w-5 h-5 text-blue-600" /> Galeria de Fotos
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhotos}
                    >
                      {isUploadingPhotos ? (
                        <span className="animate-spin mr-2">...</span>
                      ) : (
                        <UploadCloud className="w-4 h-4 mr-2" />
                      )}
                      Fotos
                    </Button>
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      className="hidden"
                      ref={videoInputRef}
                      onChange={handleVideoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploadingVideo}
                    >
                      {isUploadingVideo ? (
                        <span className="animate-spin mr-2">...</span>
                      ) : (
                        <UploadCloud className="w-4 h-4 mr-2" />
                      )}
                      Vídeo
                    </Button>
                    <BatchPhotoUploader
                      vehicleId={formData.id}
                      modelo={formData.modelo}
                      placa={formData.placa}
                      onUploaded={(urls) => {
                        setFormData((p: any) => ({ ...p, fotos: [...(p.fotos || []), ...urls] }))
                        loadMediaAssets()
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => setIsMediaCenterOpen(true)}>
                      <ImageIcon className="w-4 h-4 mr-2 text-blue-600" /> Biblioteca
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncGoogleDrive}
                      disabled={isSyncingDrive || !formData.placa}
                      className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                      title={
                        formData.placa
                          ? `Sincronizar fotos da placa ${formData.placa}`
                          : 'Informe a placa primeiro'
                      }
                    >
                      {isSyncingDrive ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {isSyncingDrive ? 'Sincronizando...' : 'Sync Drive'}
                    </Button>
                  </div>
                </div>

                {formData.fotos?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {formData.fotos.map((f: string, i: number) => (
                      <div
                        key={f}
                        className={cn(
                          'flex items-center gap-4 bg-slate-50 p-3 rounded-xl border',
                          i === 0 && 'ring-1 ring-blue-500 border-blue-200 bg-white',
                        )}
                      >
                        <div className="relative w-24 h-16 rounded-md overflow-hidden bg-slate-200 shrink-0">
                          {f.match(/\.(mp4|mov)$/i) ? (
                            <video src={f} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={f} className="w-full h-full object-cover" />
                          )}
                          {i === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-1">
                              <span className="text-[10px] font-bold text-white flex items-center">
                                <Star className="w-3 h-3 mr-1 fill-current" /> CAPA
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium truncate">{f.split('/').pop()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!f.match(/\.(mp4|mov)$/i) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                              onClick={() => setEditingImage(f)}
                              title="Otimizar com IA"
                            >
                              <Wand2 className="w-4 h-4 mr-1" /> Editar/IA
                            </Button>
                          )}
                          {i !== 0 && (
                            <Button variant="outline" size="sm" onClick={() => setAsCover(f)}>
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={async () => {
                              const newFotos = formData.fotos.filter((_: any, x: number) => x !== i)
                              setFormData((p: any) => ({ ...p, fotos: newFotos }))
                              if (formData.id) {
                                await supabase
                                  .from('veiculos')
                                  .update({ fotos: newFotos })
                                  .eq('id', formData.id)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-8 text-center text-slate-500 bg-slate-50">
                    Nenhuma imagem selecionada.
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2 mb-4">
                  <Camera className="w-5 h-5 text-blue-600" /> Vídeos
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Fica separado das fotos de propósito — vídeo tem proporção e player
                  diferentes, e a página de detalhes do veículo já mostra cada vídeo no seu
                  próprio bloco, abaixo da galeria de fotos.
                </p>
                {formData.videos?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {formData.videos.map((v: string, i: number) => (
                      <div
                        key={v}
                        className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border"
                      >
                        <div className="relative w-24 h-16 rounded-md overflow-hidden bg-slate-800 shrink-0">
                          <video src={v} className="w-full h-full object-cover" muted />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium truncate">{v.split('/').pop()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50"
                          onClick={async () => {
                            const newVideos = formData.videos.filter(
                              (_: any, x: number) => x !== i,
                            )
                            setFormData((p: any) => ({ ...p, videos: newVideos }))
                            if (formData.id) {
                              await supabase
                                .from('veiculos')
                                .update({ videos: newVideos })
                                .eq('id', formData.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center text-slate-500 bg-slate-50 text-sm">
                    Nenhum vídeo. Use o botão "Vídeo" acima ou o Sync Drive (que já traz vídeos
                    separadamente das fotos).
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <h3 className="font-bold flex items-center gap-2 text-slate-800">
                    <Camera className="w-5 h-5 text-blue-600" /> Roteiro de Fotos (20 shots)
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!formData.id || roteiroAssign.every((u) => !u)}
                    onClick={() => setRoteiroConfirmOpen(true)}
                  >
                    Salvar roteiro ({roteiroAssign.filter(Boolean).length}/{PHOTO_ROTEIRO.length})
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Fotos sincronizadas do Drive com nome no padrão <code>01_capa.jpg</code>,{' '}
                  <code>02_frente_angulo.jpg</code>... são encaixadas automaticamente. Pra o resto,
                  clique no slot vazio e escolha manualmente. Ao salvar, a lista de fotos do site
                  passa a ser exatamente as fotos referenciadas aqui, nessa ordem.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {PHOTO_ROTEIRO.map((item, i) => {
                    const assignedUrl = roteiroAssign[i]
                    const unassignedPool = (formData.fotos || []).filter(
                      (url: string) => !roteiroAssign.includes(url),
                    )
                    return (
                      <div
                        key={i}
                        className={`relative rounded border p-1.5 text-xs ${assignedUrl ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px] ${assignedUrl ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {assignedUrl ? '✓' : i + 1}
                          </span>
                          <span className="text-slate-600 truncate" title={item}>
                            {item}
                          </span>
                        </div>
                        {assignedUrl ? (
                          <div className="relative">
                            <img
                              src={assignedUrl}
                              alt={item}
                              className="w-full aspect-[4/3] object-cover rounded"
                            />
                            <button
                              type="button"
                              title="Remover referência"
                              className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-red-600 shadow hover:bg-white"
                              onClick={() =>
                                setRoteiroAssign((prev) =>
                                  prev.map((u, x) => (x === i ? null : u)),
                                )
                              }
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="w-full aspect-[4/3] border-2 border-dashed rounded flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 text-center px-1"
                            onClick={() =>
                              setRoteiroExpandedSlot(roteiroExpandedSlot === i ? null : i)
                            }
                          >
                            Referenciar
                          </button>
                        )}
                        {roteiroExpandedSlot === i && (
                          <div className="absolute z-20 top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 max-h-56 overflow-y-auto">
                            {unassignedPool.length === 0 ? (
                              <p className="col-span-4 text-slate-400 text-center py-4">
                                Nenhuma foto disponível
                              </p>
                            ) : (
                              unassignedPool.map((url: string) => (
                                <button
                                  key={url}
                                  type="button"
                                  onClick={() => {
                                    setRoteiroAssign((prev) =>
                                      prev.map((u, x) => (x === i ? url : u)),
                                    )
                                    setRoteiroExpandedSlot(null)
                                  }}
                                >
                                  <img
                                    src={url}
                                    className="w-full aspect-square object-cover rounded hover:ring-2 hover:ring-blue-400"
                                  />
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  {formData.fotos?.length || 0} fotos no armazenamento · {roteiroAssign.filter(Boolean).length} de{' '}
                  {PHOTO_ROTEIRO.length} referenciadas no roteiro
                </p>
              </div>

              <AlertDialog open={roteiroConfirmOpen} onOpenChange={setRoteiroConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Salvar roteiro de fotos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O site vai passar a mostrar exatamente as{' '}
                      <strong>{roteiroAssign.filter(Boolean).length} fotos referenciadas</strong>{' '}
                      acima, nessa ordem.{' '}
                      {(formData.fotos?.length || 0) > roteiroAssign.filter(Boolean).length && (
                        <>
                          As outras{' '}
                          {(formData.fotos?.length || 0) - roteiroAssign.filter(Boolean).length}{' '}
                          foto(s) sincronizada(s) continuam salvas, mas deixam de aparecer no site
                          e na lista de fotos do veículo até serem referenciadas em algum slot.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const finalFotos = roteiroAssign.filter((u): u is string => !!u)
                        setFormData((p: any) => ({ ...p, fotos: finalFotos }))
                        if (formData.id) {
                          await supabase
                            .from('veiculos')
                            .update({ fotos: finalFotos })
                            .eq('id', formData.id)
                        }
                        toast({
                          title: 'Roteiro salvo',
                          description: `${finalFotos.length}/${PHOTO_ROTEIRO.length} fotos publicadas na ordem do roteiro.`,
                        })
                        setRoteiroConfirmOpen(false)
                      }}
                    >
                      Salvar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            <TabsContent value="financeiro" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Análise de Precificação & ROI</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-xs text-slate-500">Margem Bruta</p>
                    <p className="text-xl font-bold text-green-600">
                      R${' '}
                      {Math.max(
                        0,
                        (Number(formData.preco_venda) || 0) - (Number(formData.preco_minimo) || 0),
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-xs text-slate-500">Despesas (Loja)</p>
                    <p className="text-xl font-bold text-red-500">
                      R${' '}
                      {despesas
                        .filter((d) => d.responsabilidade === 'loja')
                        .reduce((s, d) => s + (Number(d.valor) || 0), 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-xs text-slate-500">Lucro Líquido Est.</p>
                    <p className="text-xl font-bold text-blue-600">
                      R${' '}
                      {Math.max(
                        0,
                        (Number(formData.preco_venda) || 0) -
                          (Number(formData.preco_minimo) || 0) -
                          despesas
                            .filter((d) => d.responsabilidade === 'loja')
                            .reduce((s, d) => s + (Number(d.valor) || 0), 0),
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  {fipeHistory.length > 0 ? (
                    <LineChart data={fipeHistory}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} angle={-15} height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">
                      Consulte a placa para carregar o histórico FIPE do veículo.
                    </div>
                  )}
                </ChartContainer>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Despesas Vinculadas</h3>
                <div className="bg-slate-50 p-4 rounded-lg border mb-4 shadow-sm flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <Label>Descrição</Label>
                    <Input
                      value={novaDespesa.descricao}
                      onChange={(e) =>
                        setNovaDespesa({ ...novaDespesa, descricao: e.target.value })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="w-40">
                    <Label>Responsabilidade</Label>
                    <Select
                      value={novaDespesa.responsabilidade}
                      onValueChange={(v) => setNovaDespesa({ ...novaDespesa, responsabilidade: v })}
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
                  <div className="w-40">
                    <Label>Tipo</Label>
                    <Select
                      value={novaDespesa.tipo}
                      onValueChange={(v) => setNovaDespesa({ ...novaDespesa, tipo: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="documentacao">Documentação</SelectItem>
                        <SelectItem value="limpeza">Limpeza</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="comissao">Comissão</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-40">
                    <Label>Origem</Label>
                    <Select
                      value={novaDespesa.origem}
                      onValueChange={(v) => setNovaDespesa({ ...novaDespesa, origem: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interna">Interna</SelectItem>
                        <SelectItem value="externa">Externa</SelectItem>
                        <SelectItem value="terceirizado">Terceirizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Valor</Label>
                    <CurrencyInput
                      value={novaDespesa.valor}
                      onChange={(v) => setNovaDespesa({ ...novaDespesa, valor: v })}
                      className="bg-white"
                    />
                  </div>
                  <Button
                    onClick={handleAddDespesa}
                    disabled={loading}
                    className="w-full md:w-auto"
                  >
                    Lançar
                  </Button>
                </div>
                {despesas.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center p-3 border rounded-lg mb-2"
                  >
                    <div>
                      <p className="font-medium">{d.descricao || d.categoria}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{d.data_despesa}</p>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${d.responsabilidade === 'loja' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
                        >
                          {d.responsabilidade === 'loja' ? 'Loja' : 'Cliente'}
                        </span>
                        {d.tipo && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-700 capitalize">
                            {d.tipo}
                          </span>
                        )}
                        {d.origem && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-teal-100 text-teal-700 capitalize">
                            {d.origem}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-red-500">
                      R$ {Number(d.valor).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="m-0 space-y-6">
              <div className="bg-white p-8 rounded-lg border text-center">
                <h3 className="text-4xl font-black">{leadsCount}</h3>
                <p>Leads Interessados</p>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold">Anexos do Veículo</h3>
                  <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="w-4 h-4 mr-2" /> Novo Documento
                  </Button>
                </div>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleDocumentFile}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="border p-4 rounded flex justify-between items-center bg-slate-50"
                    >
                      <p
                        className="text-sm font-semibold truncate cursor-pointer hover:underline"
                        onClick={() => window.open(doc.url_documento, '_blank')}
                      >
                        {doc.nome_documento}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => setPreviewDoc(doc)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={async () => {
                            await supabase.from('documentos').delete().eq('id', doc.id)
                            setDocumentos((p) => p.filter((d) => d.id !== doc.id))
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="marketing" className="m-0 space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <Button
                  onClick={handleGerarAdKit}
                  disabled={loadingAdKit || !formData.id}
                  className="bg-purple-600 hover:bg-purple-700 w-full mb-4"
                >
                  Gerar Kit Redes Sociais (IA)
                </Button>
                {adKitContent && (
                  <div
                    className="prose bg-slate-50 p-4 border rounded"
                    dangerouslySetInnerHTML={{ __html: adKitContent }}
                  />
                )}
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-white flex justify-end gap-3 shadow-md">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const photoCount = formData.fotos?.length || 0
                if (photoCount < 20) {
                  toast({
                    title: '⚠️ Roteiro de fotos incompleto',
                    description: `${photoCount}/20 fotos cadastradas. Recomendamos 20 fotos para melhor performance nos portais.`,
                  })
                }
                save('rascunho', true)
              }}
              disabled={loading}
            >
              Salvar como Rascunho
            </Button>
            <Button
              onClick={handleValidarESalvar}
              disabled={loading || loadingWmMapeamento}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {loadingWmMapeamento ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Validar e Salvar
            </Button>
          </div>
        </Tabs>

        {/* Mapeamento Webmotors: candidatos quando o auto-match não teve confiança suficiente */}
        <Dialog
          open={!!wmMapeamentoDialog}
          onOpenChange={(open) => !open && setWmMapeamentoDialog(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirmar mapeamento Webmotors</DialogTitle>
            </DialogHeader>
            {wmMapeamentoDialog && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {wmMapeamentoDialog.erroMsg ||
                    'Não foi possível casar automaticamente com o catálogo da Webmotors.'}
                </p>
                {wmMapeamentoDialog.motivo === 'modelo' &&
                  wmMapeamentoDialog.candidatosModelo.length > 0 && (
                    <div className="space-y-2">
                      <Label>Escolha o modelo correto:</Label>
                      {wmMapeamentoDialog.candidatosModelo.map((c) => (
                        <Button
                          key={c.codigo_wm}
                          variant="outline"
                          className="w-full justify-between"
                          disabled={loadingWmMapeamento}
                          onClick={() => handleConfirmarMapeamento(c.codigo_wm, undefined)}
                        >
                          <span>{c.nome_wm}</span>
                          <span className="text-xs text-gray-400">
                            {Math.round((c.score || 0) * 100)}%
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                {wmMapeamentoDialog.motivo === 'versao' &&
                  wmMapeamentoDialog.candidatosVersao.length > 0 && (
                    <div className="space-y-2">
                      <Label>Escolha a versão correta:</Label>
                      {wmMapeamentoDialog.candidatosVersao.map((c) => (
                        <Button
                          key={c.codigo_wm}
                          variant="outline"
                          className="w-full justify-between"
                          disabled={loadingWmMapeamento}
                          onClick={() => handleConfirmarMapeamento(undefined, c.codigo_wm)}
                        >
                          <span>{c.nome_wm}</span>
                          <span className="text-xs text-gray-400">
                            {Math.round((c.score || 0) * 100)}%
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                {(wmMapeamentoDialog.motivo === 'marca' ||
                  wmMapeamentoDialog.motivo === 'catalogo_wm') && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    Esse caso não tem escolha automática — ajuste o cadastro (marca, cor, câmbio ou
                    combustível) pra bater com o catálogo da Webmotors, ou peça pra cadastrar o
                    termo equivalente.
                  </p>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setWmMapeamentoDialog(null)}>
                    Fechar (o veículo já foi salvo, só o mapeamento Webmotors ficou pendente)
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* MEDIA CENTER DIALOG */}
        <Dialog open={isMediaCenterOpen} onOpenChange={setIsMediaCenterOpen}>
          <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden bg-slate-50">
            <DialogHeader className="shrink-0 flex flex-row items-center justify-between border-b p-4 bg-white">
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" /> Media Center
              </DialogTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Buscar mídia..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="pl-9 w-64 h-10"
                />
              </div>
            </DialogHeader>
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="w-64 border-r bg-white p-2 flex flex-col gap-1 overflow-y-auto shrink-0">
                <Button
                  variant={selectedFolder === null ? 'secondary' : 'ghost'}
                  className="justify-start text-left w-full"
                  onClick={() => setSelectedFolder(null)}
                >
                  Todas as Pastas
                </Button>
                {folders.map((f) => (
                  <Button
                    key={f}
                    variant={selectedFolder === f ? 'secondary' : 'ghost'}
                    className="justify-start text-left w-full truncate"
                    onClick={() => setSelectedFolder(f)}
                    title={f}
                  >
                    {f}
                  </Button>
                ))}
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredMedia.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleMediaSelect(asset.file_path)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer shadow-sm group bg-white"
                    >
                      {asset.mime_type?.startsWith('video/') ? (
                        <video src={asset.file_path} className="w-full h-full object-cover" muted />
                      ) : (
                        <img
                          src={asset.file_path}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {(formData.fotos || []).includes(asset.file_path) && (
                        <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <Plus className="w-4 h-4 rotate-45" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredMedia.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-12">
                      Nenhuma mídia encontrada.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-between items-center p-4 border-t bg-white shrink-0">
              <span className="text-sm text-slate-500 font-medium">
                {(formData.fotos || []).length} fotos selecionadas
              </span>
              <Button onClick={() => setIsMediaCenterOpen(false)}>Concluir Seleção</Button>
            </div>
          </DialogContent>
        </Dialog>

        {editingImage && (
          <ImageEditorModal
            isOpen={!!editingImage}
            imageUrl={editingImage}
            vehicleData={{
              marca: formData.marca,
              modelo: formData.modelo,
              cor: formData.cor,
              ano_modelo: formData.ano_modelo,
            }}
            onClose={() => setEditingImage(null)}
            onSave={(newUrl, isAiGenerated) => {
              if (isAiGenerated) {
                setFormData((p: any) => ({
                  ...p,
                  fotos: [...(p.fotos || []), newUrl],
                }))
              } else {
                setFormData((p: any) => ({
                  ...p,
                  fotos: p.fotos.map((f: string) => (f === editingImage ? newUrl : f)),
                }))
              }
              loadMediaAssets()
            }}
          />
        )}

        <DocumentPreviewDialog document={previewDoc} onClose={() => setPreviewDoc(null)} />
      </DialogContent>
    </Dialog>
  )
}
