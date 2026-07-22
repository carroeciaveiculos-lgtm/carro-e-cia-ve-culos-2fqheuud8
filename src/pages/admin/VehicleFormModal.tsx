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
import { BatchPhotoUploader } from '@/components/admin/BatchPhotoUploader'
import { ImageEditorModal } from '@/components/admin/ImageEditorModal'
import { DocumentPreviewDialog } from '@/components/admin/DocumentPreviewDialog'
import { getFipeHistoryFromDB } from '@/services/fipe'
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

const PHOTO_ROTEIRO = [
  'Capa principal (Frente/Esq.)',
  'Frente ângulo',
  'Traseira ângulo',
  'Lateral esquerda',
  'Lateral direita',
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
  'Step',
  'Manual e chave reserva',
  'Teto',
]

const chartConfig = { valor: { label: 'Valor (R$)', color: 'hsl(var(--primary))' } }

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
  const [mediaSearch, setMediaSearch] = useState('')
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
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
    direcao: '',
    cilindrada: '',
    portas: '',
    ml_listing_type: 'gold_special',
    status: 'disponivel',
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
    info_personalizadas: {},
    publicado_olx: false,
    fipe_ref: 'Atual',
    versao: '',
    descricao: '',
    em_preparacao: false,
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
          categoria: 'Carro',
          placa: '',
          tipo_entrada: 'consignacao',
          caracteristicas: [],
          fotos: [],
          diferenciais: [],
          info_personalizadas: {},
          em_preparacao: false,
          proprietario_estado_civil: '',
          direcao: '',
          cilindrada: '',
          portas: '',
          ml_listing_type: 'gold_special',
          versao: '',
          cambio: 'Manual',
          notas_internas: '',
        })
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

  const handleSyncGoogleDrive = async () => {
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

  const validatePortalFields = () => {
    const missing: string[] = []
    if (!formData.marca) missing.push('Marca')
    if (!formData.modelo) missing.push('Modelo')
    if (!formData.ano_fabricacao) missing.push('Ano')
    if (!formData.cor) missing.push('Cor')
    if (!formData.combustivel) missing.push('Combustível')
    if (!formData.quilometragem) missing.push('KM')
    if (!formData.preco_venda) missing.push('Preço')
    if (!formData.fotos || formData.fotos.length === 0) missing.push('Fotos (mínimo 1)')
    if (missing.length > 0) {
      toast({
        title: '⚠️ Campos importantes ausentes',
        description: `Para melhor performance nos portais: ${missing.join(', ')}`,
        variant: 'destructive',
      })
    }
    return missing.length === 0
  }

  const save = async (status = 'disponivel', shouldClose = true) => {
    setLoading(true)
    try {
      const sanitizeNumber = (val: any) => {
        if (!val) return null
        const num = Number(val.toString().replace(/\./g, '').replace(',', '.'))
        return isNaN(num) ? null : num
      }
      const payload = {
        ...formData,
        ano_fabricacao: sanitizeNumber(formData.ano_fabricacao),
        ano_modelo: sanitizeNumber(formData.ano_modelo),
        quilometragem: sanitizeNumber(formData.quilometragem),
        portas: sanitizeNumber(formData.portas),
        valor_fipe: sanitizeNumber(formData.valor_fipe),
        preco_venda: sanitizeNumber(formData.preco_venda),
        preco_minimo: sanitizeNumber(formData.preco_minimo),
        proprietario_telefone: sanitizePhone(formData.proprietario_telefone),
        proprietario_telefone_residencial: sanitizePhone(
          formData.proprietario_telefone_residencial,
        ),
        proprietario_telefone_trabalho: sanitizePhone(formData.proprietario_telefone_trabalho),
        final_placa: extractFinalPlaca(formData.placa),
        is_consignado: formData.tipo_entrada === 'consignacao',
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
      if (data && data[0]) setFormData((p: any) => ({ ...p, id: data[0].id }))
      toast({ title: 'Veículo salvo!' })
      onSuccess()
      if (shouldClose) onClose()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
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

      const sanitizeFolderName = (str: string) =>
        str
          ? str
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-zA-Z0-9]/g, '_')
              .toLowerCase()
          : 'desconhecido'
      const folderName = `${sanitizeFolderName(formData.modelo)}_${sanitizeFolderName(formData.placa)}`

      const newPhotos: string[] = []

      for (let i = 0; i < resizedBlobs.length; i++) {
        const blob = resizedBlobs[i]
        const file = files[i]
        const fileExt = blob.type.includes('png') ? 'png' : 'jpg'
        const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${folderName}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, blob, { contentType: blob.type || 'image/jpeg' })
        if (uploadError) {
          const { error: uploadError2 } = await supabase.storage
            .from('site-assets')
            .upload(filePath, blob, { contentType: blob.type || 'image/jpeg' })
          if (uploadError2) throw uploadError2
          const { data: publicUrlData } = supabase.storage
            .from('site-assets')
            .getPublicUrl(filePath)
          newPhotos.push(publicUrlData.publicUrl)
          await supabase.from('media_assets').insert([
            {
              file_name: file.name,
              file_path: publicUrlData.publicUrl,
              file_size: blob.size,
              mime_type: blob.type || 'image/jpeg',
              folder: folderName,
              uploaded_by: userId,
            },
          ])
        } else {
          const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filePath)
          newPhotos.push(publicUrlData.publicUrl)
          await supabase.from('media_assets').insert([
            {
              file_name: file.name,
              file_path: publicUrlData.publicUrl,
              file_size: blob.size,
              mime_type: blob.type || 'image/jpeg',
              folder: folderName,
              uploaded_by: userId,
            },
          ])
        }
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
      const { data, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: {
          tema: `Veículo para anúncio: ${formData.marca} ${formData.modelo} ${formData.versao || ''} - Ano ${formData.ano_modelo || formData.ano_fabricacao || ''}. Combustível: ${formData.combustivel}. Cor: ${formData.cor}. Quilometragem: ${formData.quilometragem} km. Categoria: ${formData.categoria}. Câmbio: ${formData.cambio}. Notas do vendedor: ${formData.notas_internas || 'Nenhuma nota adicional'}.`,
          palavraChave: `${formData.marca} ${formData.modelo} seminovo uberaba`,
          tom: 'Conversacional',
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
    if (!formData.id) return toast({ title: 'Salve primeiro' })
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

        <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
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
                    <div>
                      <Label>Portas</Label>
                      <Input
                        type="number"
                        value={formData.portas || ''}
                        onChange={(e) => setFormData({ ...formData, portas: e.target.value })}
                        placeholder="Ex: 4"
                      />
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
                    <Textarea
                      value={formData.descricao || ''}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="h-32"
                    />
                  </div>
                </div>
              </div>

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
                      accept="image/*,video/*"
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
                      Upload
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
                <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
                  <Camera className="w-5 h-5 text-blue-600" /> Roteiro de Fotos (18 shots)
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Siga este guia para garantir anúncios de alta qualidade. Cada foto deve ser clara
                  e bem iluminada.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {PHOTO_ROTEIRO.map((item, i) => {
                    const hasPhoto = (formData.fotos || []).length > i
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-xs p-2 rounded border ${hasPhoto ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 ${hasPhoto ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {hasPhoto ? '✓' : i + 1}
                        </span>
                        <span className="text-slate-600">{item}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  {formData.fotos?.length || 0} de 18 fotos cadastradas
                </p>
              </div>
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
                if (photoCount < 18) {
                  toast({
                    title: '⚠️ Roteiro de fotos incompleto',
                    description: `${photoCount}/18 fotos cadastradas. Recomendamos 18 fotos para melhor performance nos portais.`,
                  })
                }
                save('rascunho', true)
              }}
              disabled={loading}
            >
              Salvar como Rascunho
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFormData((p: any) => ({ ...p, requires_review: false }))
                save('disponivel', true)
                toast({ title: 'Veículo aprovado e publicado!' })
              }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Aprovar e Publicar
            </Button>
            <Button
              onClick={() => {
                const photoCount = formData.fotos?.length || 0
                if (photoCount < 18) {
                  toast({
                    title: '⚠️ Roteiro de fotos incompleto',
                    description: `${photoCount}/18 fotos. Complete o roteiro de 18 fotos para publicar.`,
                    variant: 'destructive',
                  })
                }
                if (!validatePortalFields()) return
                save('disponivel', true)
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Send className="w-4 h-4 mr-2" /> Salvar Veículo
            </Button>
          </div>
        </Tabs>

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
            onClose={() => setEditingImage(null)}
            onSave={(newUrl) => {
              setFormData((p: any) => ({
                ...p,
                fotos: p.fotos.map((f: string) => (f === editingImage ? newUrl : f)),
              }))
              loadMediaAssets()
            }}
          />
        )}

        <DocumentPreviewDialog document={previewDoc} onClose={() => setPreviewDoc(null)} />
      </DialogContent>
    </Dialog>
  )
}
