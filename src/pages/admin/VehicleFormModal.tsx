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
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getMarcas, getModelos, getAnos } from '@/services/fipe'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CARACTERISTICAS, OPCIONAIS, CORES } from '@/lib/constants'
import {
  Camera,
  Search,
  Trash2,
  GripHorizontal,
  Save,
  Send,
  ArrowLeft,
  Car,
  Info,
  Settings,
  Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VehicleFormModal({ isOpen, onClose, vehicleId, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [marcas, setMarcas] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])
  const [anos, setAnos] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
    categoria: 'Carro',
    is_zero_km: false,
    marca: '',
    modelo: '',
    versao: '',
    ano_fabricacao: '',
    ano_modelo: '',
    cor: '',
    quilometragem: '',
    cambio: '',
    combustivel: '',
    portas: '4',
    placa: '',
    chassi: '',
    renavam: '',
    preco_venda: '',
    preco_classificados: '',
    valor_fipe: '',
    status: 'disponivel',
    is_consignado: false,
    proprietario_nome: '',
    proprietario_telefone: '',
    diferenciais: [],
    caracteristicas: [],
    fotos: [],
    video_url: '',
    publicado_olx: false,
    publicado_webmotors: false,
    publicado_icarros: false,
    publicado_mercadolivre: false,
    publicado_napista: false,
    destaque: false,
    responsavel_id: null,
    valor_minimo: '',
    data_entrada: '',
  })

  useEffect(() => {
    getMarcas().then(setMarcas)
    if (vehicleId) {
      supabase
        .from('veiculos')
        .select('*')
        .eq('id', vehicleId)
        .single()
        .then(({ data }) => {
          if (data) {
            setFormData(data)
            const m = marcas.find((x) => x.nome === data.marca) || { codigo: '0' }
            getModelos(m.codigo).then(setModelos)
          }
        })
    }
  }, [vehicleId])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setLoading(true)
    const newUrls = []
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop()
      const filename = `${Math.random().toString(36).substring(2)}.${ext}`
      const { error } = await supabase.storage
        .from('veiculos-fotos')
        .upload(`fotos/${filename}`, file)
      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('veiculos-fotos').getPublicUrl(`fotos/${filename}`)
        newUrls.push(publicUrl)
      }
    }
    setFormData((prev: any) => ({ ...prev, fotos: [...(prev.fotos || []), ...newUrls] }))
    setLoading(false)
  }

  const handleAnoChange = async (codigo: string) => {
    const a = anos.find((x) => x.codigo === codigo)
    if (!a) return
    const ano = a.nome.match(/\d{4}/)?.[0] || '0'
    setFormData((p: any) => ({ ...p, ano_fabricacao: parseInt(ano), ano_modelo: parseInt(ano) }))

    const m = marcas.find((x) => x.nome === formData.marca)
    const mod = modelos.find((x) => x.nome === formData.modelo)
    if (m && mod) {
      const res = await fetch(
        `https://parallelum.com.br/fipe/api/v1/carros/marcas/${m.codigo}/modelos/${mod.codigo}/anos/${codigo}`,
      )
      const d = await res.json()
      if (d?.Valor)
        setFormData((p: any) => ({
          ...p,
          valor_fipe: parseFloat(d.Valor.replace(/[^\d,]/g, '').replace(',', '.')),
        }))
    }
  }

  const save = async (statusOverride?: string) => {
    setLoading(true)
    const payload = { ...formData, ...(statusOverride && { status: statusOverride }) }
    const { error } = payload.id
      ? await supabase.from('veiculos').update(payload).eq('id', payload.id)
      : await supabase.from('veiculos').insert([payload])

    if (error) toast({ title: 'Erro ao salvar', variant: 'destructive' })
    else {
      toast({ title: 'Veículo salvo!' })
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const dragStart = (e: React.DragEvent, idx: number) =>
    e.dataTransfer.setData('idx', idx.toString())
  const drop = (e: React.DragEvent, dropIdx: number) => {
    const dragIdx = parseInt(e.dataTransfer.getData('idx'))
    if (isNaN(dragIdx) || dragIdx === dropIdx) return
    const f = [...formData.fotos]
    f.splice(dropIdx, 0, f.splice(dragIdx, 1)[0])
    setFormData({ ...formData, fotos: f })
  }

  const toggleArray = (field: string, val: string) => {
    setFormData((p: any) => ({
      ...p,
      [field]: p[field]?.includes(val)
        ? p[field].filter((x: string) => x !== val)
        : [...(p[field] || []), val],
    }))
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
            {/* BLOCO DE FOTOS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" /> GESTÃO DE FOTOS
              </h3>
              <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5 bg-blue-50 text-blue-700 p-2 rounded border border-blue-100">
                <Info className="w-4 h-4" /> Arraste as fotos para reordenar. A primeira foto será a
                capa do anúncio. (Máx 30 fotos)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-4">
                {formData.fotos?.map((f: string, i: number) => (
                  <div
                    key={f}
                    draggable
                    onDragStart={(e) => dragStart(e, i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => drop(e, i)}
                    className="relative group aspect-square bg-slate-100 rounded-lg border border-slate-200 cursor-grab overflow-hidden"
                  >
                    <img src={f} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br">
                        Capa
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                      onClick={() =>
                        setFormData((p: any) => ({
                          ...p,
                          fotos: p.fotos.filter((_: any, x: number) => x !== i),
                        }))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-slate-900/60 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripHorizontal className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                ))}
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors">
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

            {/* DADOS DO VEÍCULO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> PERFIL TÉCNICO COMPLETO
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna 1 */}
                <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Placa do Veículo
                      </Label>
                      <Input
                        value={formData.placa || ''}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                        className="mt-1 font-mono uppercase bg-slate-50"
                        placeholder="AAA-0A00"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    >
                      <Search className="w-4 h-4 mr-2" /> Consulta DENATRAN
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Categoria
                      </Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Carro">Carro</SelectItem>
                          <SelectItem value="Moto">Moto</SelectItem>
                          <SelectItem value="Caminhão">Caminhão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Marca (FIPE)
                      </Label>
                      <Select
                        value={formData.marca}
                        onValueChange={(v) => {
                          setFormData({ ...formData, marca: v, modelo: '' })
                          const m = marcas.find((x) => x.nome === v)
                          if (m) getModelos(m.codigo).then(setModelos)
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {marcas.map((m) => (
                            <SelectItem key={m.codigo} value={m.nome}>
                              {m.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Modelo (FIPE)
                      </Label>
                      <Select
                        value={formData.modelo}
                        onValueChange={(v) => {
                          setFormData({ ...formData, modelo: v })
                          const m = marcas.find((x) => x.nome === formData.marca)
                          const mod = modelos.find((x) => x.nome === v)
                          if (m && mod) getAnos(m.codigo, mod.codigo).then(setAnos)
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modelos.map((m) => (
                            <SelectItem key={m.codigo} value={m.nome}>
                              {m.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Ano (FIPE)
                      </Label>
                      <Select
                        value={formData.ano_fabricacao?.toString()}
                        onValueChange={handleAnoChange}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {anos.map((a) => (
                            <SelectItem key={a.codigo} value={a.codigo}>
                              {a.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Versão Detalhada
                    </Label>
                    <Input
                      value={formData.versao || ''}
                      onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Ex: 2.0 EXL 16V FLEX 4P AUTOMÁTICO"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Chassi</Label>
                      <Input
                        value={formData.chassi || ''}
                        onChange={(e) => setFormData({ ...formData, chassi: e.target.value })}
                        className="mt-1 bg-white text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Renavam</Label>
                      <Input
                        value={formData.renavam || ''}
                        onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                        className="mt-1 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Coluna 2 */}
                <div className="space-y-4">
                  <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        checked={formData.is_zero_km}
                        onChange={() => setFormData({ ...formData, is_zero_km: true })}
                        className="accent-blue-600 w-4 h-4"
                      />{' '}
                      0Km (Novo)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        checked={!formData.is_zero_km}
                        onChange={() => setFormData({ ...formData, is_zero_km: false })}
                        className="accent-blue-600 w-4 h-4"
                      />{' '}
                      Usado/Seminovo
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Combustível
                      </Label>
                      <Select
                        value={formData.combustivel || ''}
                        onValueChange={(v) => setFormData({ ...formData, combustivel: v })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Flex',
                            'Gasolina',
                            'Diesel',
                            'Elétrico',
                            'Híbrido',
                            'Etanol',
                            'GNV',
                          ].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">Cor</Label>
                      <Select
                        value={formData.cor || ''}
                        onValueChange={(v) => setFormData({ ...formData, cor: v })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CORES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Câmbio</Label>
                      <Select
                        value={formData.cambio || ''}
                        onValueChange={(v) => setFormData({ ...formData, cambio: v })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Manual', 'Automático', 'CVT', 'Semi-automático'].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Quilometragem
                      </Label>
                      <Input
                        type="number"
                        value={formData.quilometragem || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, quilometragem: parseInt(e.target.value) })
                        }
                        className="mt-1 bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Portas</Label>
                      <Select
                        value={formData.portas?.toString()}
                        onValueChange={(v) => setFormData({ ...formData, portas: parseInt(v) })}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['2', '3', '4', '5'].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                            setFormData({ ...formData, preco_venda: parseFloat(e.target.value) })
                          }
                          className="mt-1 text-green-700 font-bold bg-white border-green-200"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-green-700 uppercase">
                          Preço Mínimo (R$)
                        </Label>
                        <Input
                          type="number"
                          value={formData.preco_classificados || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preco_classificados: parseFloat(e.target.value),
                            })
                          }
                          className="mt-1 bg-white border-green-200"
                          placeholder="Margem interna"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Valor FIPE (Referência)
                      </Label>
                      <Input
                        readOnly
                        value={
                          formData.valor_fipe
                            ? `R$ ${formData.valor_fipe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : ''
                        }
                        className="mt-1 bg-slate-100 text-slate-500 font-mono font-bold border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CHECKLIST DE CARACTERÍSTICAS E OPCIONAIS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                CHECKLIST DE OPCIONAIS E CARACTERÍSTICAS
              </h3>
              <div className="space-y-6">
                <div>
                  <Label className="text-xs font-bold text-blue-600 uppercase mb-3 block">
                    Principais Diferenciais
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {CARACTERISTICAS.map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1.5 rounded-md border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Checkbox
                          checked={(formData.caracteristicas || []).includes(c)}
                          onCheckedChange={() => toggleArray('caracteristicas', c)}
                        />{' '}
                        {c}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase mb-3 block">
                    Opcionais do Veículo
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-3 gap-x-2">
                    {OPCIONAIS.map((o) => (
                      <label
                        key={o}
                        className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-slate-50 p-1.5 rounded-md border border-transparent hover:border-slate-200 transition-colors text-slate-600"
                      >
                        <Checkbox
                          checked={(formData.diferenciais || []).includes(o)}
                          onCheckedChange={() => toggleArray('diferenciais', o)}
                          className="w-3.5 h-3.5"
                        />{' '}
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PUBLICAÇÃO E INTEGRAÇÕES */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> STATUS E MATRIZ DE PUBLICAÇÃO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Status no Estoque
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="mt-1 bg-white font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Ativo / Disponível</SelectItem>
                        <SelectItem value="reservado">Reservado</SelectItem>
                        <SelectItem value="vendido">Vendido</SelectItem>
                        <SelectItem value="inativo">Inativo / Oculto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <Label
                      htmlFor="destaque"
                      className="font-bold text-amber-800 text-sm cursor-pointer"
                    >
                      Selo "Destaque" no Site
                    </Label>
                    <Switch
                      checked={formData.destaque}
                      onCheckedChange={(c) => setFormData({ ...formData, destaque: c })}
                      id="destaque"
                      className="data-[state=checked]:bg-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase mb-3 block">
                    Sincronizar Portais Externos
                  </Label>
                  <div className="space-y-2.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                      <Checkbox
                        checked={formData.publicado_webmotors}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, publicado_webmotors: c })
                        }
                      />{' '}
                      WebMotors
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                      <Checkbox
                        checked={formData.publicado_icarros}
                        onCheckedChange={(c) => setFormData({ ...formData, publicado_icarros: c })}
                      />{' '}
                      iCarros
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                      <Checkbox
                        checked={formData.publicado_mercadolivre}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, publicado_mercadolivre: c })
                        }
                      />{' '}
                      Mercado Livre
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                      <Checkbox
                        checked={formData.publicado_napista}
                        onCheckedChange={(c) => setFormData({ ...formData, publicado_napista: c })}
                      />{' '}
                      NaPista
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                      <Checkbox
                        checked={formData.publicado_olx}
                        onCheckedChange={(c) => setFormData({ ...formData, publicado_olx: c })}
                      />{' '}
                      OLX
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Label
                      htmlFor="is_consignado"
                      className="font-bold text-blue-800 text-sm cursor-pointer"
                    >
                      É Consignado?
                    </Label>
                    <Switch
                      checked={formData.is_consignado}
                      onCheckedChange={(c) => setFormData({ ...formData, is_consignado: c })}
                      id="is_consignado"
                    />
                  </div>

                  {formData.is_consignado && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                          Proprietário (Oculto no site)
                        </Label>
                        <Input
                          value={formData.proprietario_nome || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_nome: e.target.value })
                          }
                          className="mt-1 bg-white h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                          Telefone Proprietário
                        </Label>
                        <Input
                          value={formData.proprietario_telefone || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, proprietario_telefone: e.target.value })
                          }
                          className="mt-1 bg-white h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-white shrink-0 flex justify-end gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-10">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-slate-600 bg-white border-slate-200 hover:bg-slate-50 font-medium"
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => save('inativo')}
            disabled={loading}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
          >
            <Save className="w-4 h-4 mr-2" /> Salvar como Rascunho
          </Button>
          <Button
            onClick={() => save()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-sm"
          >
            <Send className="w-4 h-4 mr-2" />{' '}
            {loading ? 'Salvando...' : 'Salvar e Publicar Anúncio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
