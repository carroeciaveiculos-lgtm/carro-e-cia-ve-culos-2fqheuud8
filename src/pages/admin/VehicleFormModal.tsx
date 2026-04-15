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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Camera,
  Search,
  Trash2,
  Send,
  Car,
  Settings,
  Share2,
  Loader2,
  DollarSign,
  Info,
} from 'lucide-react'

const CARACTERISTICAS_LIST = [
  'Adaptado para Def. Físico',
  'Único Dono',
  'Blindado',
  'Chave Reserva',
  'Garantia de Fábrica',
  'IPVA Pago',
  'Licenciado',
  'Manual',
  'Passagem por leilão',
  'Revisado em Concessionária',
]

const OPCIONAIS_LIST = [
  'Airbag laterais',
  'Airbag motorista',
  'Airbag passageiro',
  'Alarme',
  'Ar condicionado',
  'Ar condicionado Digital',
  'Ar quente',
  'Banco do motorista com ajuste de altura',
  'Bancos de Couro',
  'Bancos dianteiros com aquecimento',
  'Câmera de ré',
  'Capota Marítima',
  'CD player',
  'Cd player com MP3',
  'Computador de bordo',
  'Controle de som no volante',
  'Controle de tração',
  'Controle de velocidade',
  'Desembaçador traseiro',
  'Direção Elétrica',
  'Direção Hidraulica',
  'DVD player',
  'Encosto de cabeça traseiro',
  'Entrada USB',
  'Faróis de xenon',
  'Farol de milha',
  'Farol de neblina',
  'Freios ABS',
  'GPS',
  'Insufilm',
  'Limpador traseiro',
  'Multimídia',
  'Pára-choques na cor do veiculo',
  'Piloto automático',
  'Porta copos',
  'Protetor de Caçamba',
  'Retrovisor fotocrômico',
  'Retrovisores elétricos',
  'Rodas de liga leve',
  'Sensor de chuva',
  'Sensor de estacionamento',
  'Sensor de Luminosidade',
  'Teto solar',
  'Tração 4x4',
  'Travas elétricas',
  'Vidros elétricos',
  'Vidros elétricos Traseiros',
  'Volante com regulagem de altura',
]

const YEARS = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => 2026 - i)

const VERSOES_COMUNS = [
  '1.0 MPI',
  '1.6 MSI',
  '1.4 TSI',
  '2.0 TSI',
  '1.0 Flex',
  '1.8 Flex',
  '2.0 Flex',
  'Outra',
]

export default function VehicleFormModal({ isOpen, onClose, vehicleId, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [loadingPlaca, setLoadingPlaca] = useState(false)
  const { toast } = useToast()

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
    preco_classificados: '',
    quilometragem: '',
    cambio: 'Manual',
    status: 'disponivel',
    tipo_entrada: 'consignacao', // 'consignacao' | 'proprio'
    proprietario_nome: '',
    proprietario_telefone: '',
    diferenciais: [],
    caracteristicas: [],
    fotos: [],
    publicado_olx: false,
    publicado_webmotors: false,
    publicado_icarros: false,
    publicado_mercadolivre: false,
    nao_exibir_km: false,
    mesma_obs_classificados: false,
    fipe_ref: 'Atual',
    info_personalizadas: [],
    versao: '',
    video_url: '',
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
            if (data) {
              setFormData({
                ...data,
                diferenciais: data.diferenciais || [],
                caracteristicas: data.caracteristicas || [],
                fotos: data.fotos || [],
                tipo_entrada: data.is_consignado ? 'consignacao' : 'proprio',
              })
            }
          })
          .catch(() => {
            toast({ title: 'Erro ao carregar dados do veículo', variant: 'destructive' })
          })
      } else {
        setFormData({
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
          preco_classificados: '',
          quilometragem: '',
          cambio: 'Manual',
          status: 'disponivel',
          tipo_entrada: 'consignacao',
          proprietario_nome: '',
          proprietario_telefone: '',
          diferenciais: [],
          caracteristicas: [],
          fotos: [],
          publicado_olx: false,
          publicado_webmotors: false,
          publicado_icarros: false,
          publicado_mercadolivre: false,
          nao_exibir_km: false,
          mesma_obs_classificados: false,
          fipe_ref: 'Atual',
          info_personalizadas: [],
          versao: '',
          video_url: '',
          descricao: '',
        })
      }
    }
  }, [isOpen, vehicleId])

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1080
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
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
            'image/jpeg',
            0.8,
          )
        }
      }
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setLoading(true)
    const newUrls = []
    for (const file of Array.from(e.target.files)) {
      try {
        const compressedBlob = await compressImage(file)
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg',
        })
        const filename = `${Math.random().toString(36).substring(2)}.jpg`
        const { error } = await supabase.storage
          .from('veiculos-fotos')
          .upload(`fotos/${filename}`, compressedFile)
        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('veiculos-fotos').getPublicUrl(`fotos/${filename}`)
          newUrls.push(publicUrl)
        }
      } catch (err) {
        console.error('Erro ao comprimir imagem:', err)
      }
    }
    setFormData((prev: any) => ({ ...prev, fotos: [...(prev.fotos || []), ...newUrls] }))
    setLoading(false)
  }

  const consultarAPIPlaca = async () => {
    if (!formData.placa) {
      return toast({
        title: 'Atenção',
        description: 'Digite a placa primeiro.',
        variant: 'destructive',
      })
    }
    setLoadingPlaca(true)

    try {
      const { data, error } = await supabase.functions.invoke('consultar-placa', {
        body: { placa: formData.placa },
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Falha ao consultar placa')

      const vData = data.data

      setFormData((prev: any) => ({
        ...prev,
        chassi: vData.chassi || prev.chassi || '',
        renavam: vData.renavam || prev.renavam || '',
        marca: vData.marca || prev.marca || '',
        modelo: vData.modelo || prev.modelo || '',
        ano_fabricacao: vData.ano_fab || prev.ano_fabricacao || '',
        ano_modelo: vData.ano_modelo || prev.ano_modelo || '',
        combustivel: vData.combustivel || prev.combustivel || '',
        cor: vData.cor || prev.cor || '',
        valor_fipe: vData.preco_fipe || prev.valor_fipe || '',
        fipe_ref: vData.mes_referencia || prev.fipe_ref || 'Atual',
        versao: vData.versao || prev.versao || '',
      }))

      toast({ title: 'Sucesso!', description: 'Dados importados com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Erro ao consultar placa', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingPlaca(false)
    }
  }

  const save = async (statusOverride?: string) => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        is_consignado: formData.tipo_entrada === 'consignacao',
        ...(statusOverride && { status: statusOverride }),
      }
      delete payload.tipo_entrada // Remove local state field before saving

      const { data, error } = payload.id
        ? await supabase.from('veiculos').update(payload).eq('id', payload.id).select()
        : await supabase.from('veiculos').insert([payload]).select()

      if (error) throw error

      // Trigger sync se publicado em algum portal
      if (
        payload.publicado_olx ||
        payload.publicado_webmotors ||
        payload.publicado_icarros ||
        payload.publicado_mercadolivre
      ) {
        supabase.functions
          .invoke('sync-estoque', { body: { veiculo_id: data?.[0]?.id || payload.id } })
          .catch(console.error)
      }

      toast({ title: 'Veículo salvo com sucesso!' })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleArray = (field: string, val: string) => {
    setFormData((p: any) => ({
      ...p,
      [field]: (p[field] || []).includes(val)
        ? p[field].filter((x: string) => x !== val)
        : [...(p[field] || []), val],
    }))
  }

  const dragStart = (e: React.DragEvent, idx: number) =>
    e.dataTransfer.setData('idx', idx.toString())
  const drop = (e: React.DragEvent, dropIdx: number) => {
    const dragIdx = parseInt(e.dataTransfer.getData('idx'))
    if (isNaN(dragIdx) || dragIdx === dropIdx) return
    const f = [...(formData.fotos || [])]
    f.splice(dropIdx, 0, f.splice(dragIdx, 1)[0])
    setFormData({ ...formData, fotos: f })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 bg-[#F4F6F8] gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-white text-slate-800 shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />{' '}
            {vehicleId ? 'EDITAR VEÍCULO' : 'CADASTRAR VEÍCULO'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* BUSCA PLACA API */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">
                  Placa do Veículo
                </Label>
                <Input
                  value={formData.placa || ''}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  onBlur={() => {
                    if (formData.placa && formData.placa.length >= 7 && !formData.chassi) {
                      consultarAPIPlaca()
                    }
                  }}
                  className="mt-1 font-mono uppercase bg-slate-50 text-lg h-12"
                  placeholder="ABC-1234"
                  maxLength={8}
                />
              </div>
              <Button
                onClick={consultarAPIPlaca}
                disabled={loadingPlaca}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
              >
                {loadingPlaca ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                DENATRAN
              </Button>
            </div>

            {/* DADOS DO VEÍCULO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> DADOS TÉCNICOS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Marca</Label>
                      <Input
                        value={formData.marca || ''}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Modelo</Label>
                      <Input
                        value={formData.modelo || ''}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Ano Fab.</Label>
                      <Select
                        value={formData.ano_fabricacao?.toString() || ''}
                        onValueChange={(v) =>
                          setFormData({ ...formData, ano_fabricacao: parseInt(v) })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={`fab-${y}`} value={y.toString()}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Ano Modelo
                      </Label>
                      <Select
                        value={formData.ano_modelo?.toString() || ''}
                        onValueChange={(v) => setFormData({ ...formData, ano_modelo: parseInt(v) })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={`mod-${y}`} value={y.toString()}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase">Versão:</Label>
                    <Select
                      value={formData.versao || ''}
                      onValueChange={(v) => setFormData({ ...formData, versao: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {VERSOES_COMUNS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Cor</Label>
                      <Input
                        value={formData.cor || ''}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Combustível
                      </Label>
                      <Input
                        value={formData.combustivel || ''}
                        onChange={(e) => setFormData({ ...formData, combustivel: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Câmbio</Label>
                      <Input
                        value={formData.cambio || ''}
                        onChange={(e) => setFormData({ ...formData, cambio: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Chassi (Readonly)
                    </Label>
                    <Input
                      readOnly
                      value={formData.chassi || ''}
                      className="mt-1 bg-slate-50 text-xs font-mono text-slate-500"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Link do Vídeo:
                    </Label>
                    <Input
                      value={formData.video_url || ''}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* FIPE DESTAQUE */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-blue-800 font-bold text-xl">
                        Fipe: R${' '}
                        {Number(formData.valor_fipe || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-blue-600 text-xs font-medium uppercase mt-1">
                        Ref: {formData.fipe_ref || 'Atual'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full h-12 w-12 shrink-0 shadow-sm"
                    >
                      <DollarSign className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-green-700 uppercase">
                          Preço p/ Site (R$)
                        </Label>
                        <Input
                          type="number"
                          value={formData.preco_venda || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preco_venda: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 font-bold text-green-700 text-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-green-700 uppercase">
                          Preço Classificados:
                        </Label>
                        <Input
                          type="number"
                          value={formData.preco_classificados || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preco_classificados: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 text-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-600 uppercase">
                        Quilometragem
                      </Label>
                      <div className="flex gap-4 items-center mt-1">
                        <Input
                          type="number"
                          value={formData.quilometragem || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quilometragem: parseInt(e.target.value) || 0,
                            })
                          }
                          className="flex-1 text-lg"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer shrink-0">
                          <Checkbox
                            checked={formData.nao_exibir_km}
                            onCheckedChange={(c) => setFormData({ ...formData, nao_exibir_km: c })}
                          />{' '}
                          Não exibir Km
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Checkbox
                        checked={formData.mesma_obs_classificados}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, mesma_obs_classificados: c })
                        }
                      />
                      <Label className="text-xs font-bold text-slate-600 cursor-pointer">
                        Utilizar a mesma observação do site nos classificados.
                      </Label>
                    </div>
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Observação Site:
                    </Label>
                    <Textarea
                      className="mt-1 h-24 text-sm"
                      value={formData.descricao || ''}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    />
                    <a
                      href="#"
                      className="text-[11px] text-blue-600 hover:underline mt-2 inline-block font-medium"
                    >
                      Clique aqui para gravar uma observação padrão para seus veículos.
                    </a>
                  </div>

                  {/* TIPO DE ENTRADA */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Label className="text-xs font-bold text-blue-800 uppercase block mb-3">
                      Tipo de Entrada
                    </Label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          checked={formData.tipo_entrada === 'consignacao'}
                          onChange={() => setFormData({ ...formData, tipo_entrada: 'consignacao' })}
                          className="accent-blue-600 w-4 h-4"
                        />
                        Consignação
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          checked={formData.tipo_entrada === 'proprio'}
                          onChange={() => setFormData({ ...formData, tipo_entrada: 'proprio' })}
                          className="accent-blue-600 w-4 h-4"
                        />
                        Veículo Próprio
                      </label>
                    </div>
                    {formData.tipo_entrada === 'consignacao' && (
                      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-blue-200/50">
                        <div>
                          <Label className="text-[10px] uppercase text-slate-500 font-bold">
                            Proprietário Nome
                          </Label>
                          <Input
                            value={formData.proprietario_nome || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, proprietario_nome: e.target.value })
                            }
                            className="mt-1 h-8 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase text-slate-500 font-bold">
                            Proprietário Telefone
                          </Label>
                          <Input
                            value={formData.proprietario_telefone || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, proprietario_telefone: e.target.value })
                            }
                            className="mt-1 h-8 text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FOTOS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" /> FOTOS (Arraste para reordenar)
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3">
                {formData.fotos?.map((f: string, i: number) => (
                  <div
                    key={f}
                    draggable
                    onDragStart={(e) => dragStart(e, i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => drop(e, i)}
                    className="relative group aspect-square bg-slate-100 rounded-lg border cursor-grab overflow-hidden"
                  >
                    <img src={f} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5">
                        Capa
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 p-1 rounded-md opacity-0 group-hover:opacity-100"
                      onClick={() =>
                        setFormData((p: any) => ({
                          ...p,
                          fotos: p.fotos.filter((_: any, x: number) => x !== i),
                        }))
                      }
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Adicionar</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            {/* INFORMAÇÕES PERSONALIZADAS POR CLASSIFICADO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b pb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" /> INFORMAÇÕES PERSONALIZADAS POR
                  CLASSIFICADO
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 shrink-0"
                >
                  + Adicionar
                </Button>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg text-xs font-medium text-slate-600 mb-6 border border-slate-200">
                Só utilize essa funcionalidade, caso queira informar uma observação e/ou preço
                diferenciado em cada classificado. Caso utilize a mesma observação e preço em todos
                os classificados, só preencher essas informações nos dados do veículo.
              </div>
              <Tabs defaultValue="classificado" className="w-full">
                <TabsList className="bg-slate-100 p-1 w-full justify-start rounded-lg h-auto">
                  <TabsTrigger
                    value="classificado"
                    className="text-xs py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    CLASSIFICADO
                  </TabsTrigger>
                  <TabsTrigger
                    value="observacao"
                    className="text-xs py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    OBSERVAÇÃO
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="classificado"
                  className="p-8 border border-slate-100 rounded-lg mt-4 bg-slate-50 text-center text-sm text-slate-500"
                >
                  Nenhum classificado personalizado adicionado.
                </TabsContent>
                <TabsContent
                  value="observacao"
                  className="p-8 border border-slate-100 rounded-lg mt-4 bg-slate-50 text-center text-sm text-slate-500"
                >
                  Nenhuma observação personalizada adicionada.
                </TabsContent>
              </Tabs>
            </div>

            {/* CARACTERÍSTICAS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" /> CARACTERÍSTICAS
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold shrink-0"
                  onClick={() =>
                    setFormData({ ...formData, caracteristicas: CARACTERISTICAS_LIST })
                  }
                >
                  SELECIONAR TODOS
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                {CARACTERISTICAS_LIST.map((c) => (
                  <label key={c} className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={(formData.caracteristicas || []).includes(c)}
                      onCheckedChange={() => toggleArray('caracteristicas', c)}
                      className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-tight">
                      {c}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* OPCIONAIS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" /> OPCIONAIS
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold shrink-0"
                  onClick={() => setFormData({ ...formData, diferenciais: OPCIONAIS_LIST })}
                >
                  SELECIONAR TODOS
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3 gap-x-4">
                {OPCIONAIS_LIST.map((o) => (
                  <label key={o} className="flex items-start gap-2 cursor-pointer group">
                    <Checkbox
                      checked={(formData.diferenciais || []).includes(o)}
                      onCheckedChange={() => toggleArray('diferenciais', o)}
                      className="w-4 h-4 mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm"
                    />
                    <span className="text-[13px] text-slate-700 group-hover:text-slate-900 leading-tight">
                      {o}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* INTEGRAÇÃO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> PUBLICAÇÃO E PORTAIS
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={formData.publicado_webmotors}
                    onCheckedChange={(c) => setFormData({ ...formData, publicado_webmotors: c })}
                  />{' '}
                  WebMotors
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={formData.publicado_icarros}
                    onCheckedChange={(c) => setFormData({ ...formData, publicado_icarros: c })}
                  />{' '}
                  iCarros
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={formData.publicado_mercadolivre}
                    onCheckedChange={(c) => setFormData({ ...formData, publicado_mercadolivre: c })}
                  />{' '}
                  Mercado Livre
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-white shrink-0 flex justify-end gap-3 shadow-md z-10">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => save('inativo')} disabled={loading}>
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => save()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Send className="w-4 h-4 mr-2" /> Salvar e Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
