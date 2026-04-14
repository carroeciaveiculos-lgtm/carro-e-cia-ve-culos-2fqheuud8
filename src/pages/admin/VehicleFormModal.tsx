import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Camera, Search, Trash2, GripHorizontal, Save, Send, ArrowLeft } from 'lucide-react'

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
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 bg-[#F5F5F5]">
        <DialogHeader className="px-6 py-4 border-b bg-[#0D47A1] text-white shrink-0">
          <DialogTitle className="text-xl">
            {vehicleId ? 'EDITAR VEÍCULO' : 'NOVO VEÍCULO'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* BLOCO A */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#0D47A1] mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5" /> BLOCO A - FOTOS DO VEÍCULO
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Para alterar a ordem das fotos, arraste a foto para posição desejada. (Máx 30)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3 mb-4">
                {formData.fotos?.map((f: string, i: number) => (
                  <div
                    key={f}
                    draggable
                    onDragStart={(e) => dragStart(e, i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => drop(e, i)}
                    className="relative group aspect-video bg-gray-100 rounded border border-gray-200 cursor-grab"
                  >
                    <img src={f} className="w-full h-full object-cover rounded" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 p-1 rounded opacity-0 group-hover:opacity-100"
                      onClick={() =>
                        setFormData((p: any) => ({
                          ...p,
                          fotos: p.fotos.filter((_: any, x: number) => x !== i),
                        }))
                      }
                    >
                      <Trash2 className="w-3 h-3 text-[#C62828]" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/60 p-1 rounded opacity-0 group-hover:opacity-100">
                      <GripHorizontal className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ))}
                <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-[#1565C0] rounded bg-[#E3F2FD] text-[#1565C0] cursor-pointer hover:bg-[#BBDEFB] transition-colors">
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Adicionar</span>
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
              <div className="max-w-md">
                <Label>Link Vídeo (YouTube)</Label>
                <Input
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>

            {/* BLOCO B */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#0D47A1] mb-6 border-b border-gray-100 pb-2">
                BLOCO B - DADOS DO VEÍCULO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Placa</Label>
                      <Input
                        value={formData.placa || ''}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                        className="mt-1 font-mono uppercase"
                      />
                    </div>
                    <Button type="button" className="bg-[#1565C0] hover:bg-[#0D47A1]">
                      <Search className="w-4 h-4 mr-2" /> DENATRAN
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                      >
                        <SelectTrigger className="mt-1">
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
                      <Label>Marca (FIPE)</Label>
                      <Select
                        value={formData.marca}
                        onValueChange={(v) => {
                          setFormData({ ...formData, marca: v, modelo: '' })
                          const m = marcas.find((x) => x.nome === v)
                          if (m) getModelos(m.codigo).then(setModelos)
                        }}
                      >
                        <SelectTrigger className="mt-1">
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
                      <Label>Modelo (FIPE)</Label>
                      <Select
                        value={formData.modelo}
                        onValueChange={(v) => {
                          setFormData({ ...formData, modelo: v })
                          const m = marcas.find((x) => x.nome === formData.marca)
                          const mod = modelos.find((x) => x.nome === v)
                          if (m && mod) getAnos(m.codigo, mod.codigo).then(setAnos)
                        }}
                      >
                        <SelectTrigger className="mt-1">
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
                      <Label>Ano Fab/Mod (FIPE)</Label>
                      <Select
                        value={formData.ano_fabricacao?.toString()}
                        onValueChange={handleAnoChange}
                      >
                        <SelectTrigger className="mt-1">
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
                    <Label>Versão</Label>
                    <Input
                      value={formData.versao || ''}
                      onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preço Site (R$)</Label>
                      <Input
                        type="number"
                        value={formData.preco_venda || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, preco_venda: parseFloat(e.target.value) })
                        }
                        className="mt-1 text-[#2E7D32] font-bold"
                      />
                    </div>
                    <div>
                      <Label>Preço Classificados (R$)</Label>
                      <Input
                        type="number"
                        value={formData.preco_classificados || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preco_classificados: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.is_zero_km}
                        onChange={() => setFormData({ ...formData, is_zero_km: true })}
                      />{' '}
                      0Km
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.is_zero_km}
                        onChange={() => setFormData({ ...formData, is_zero_km: false })}
                      />{' '}
                      Usado
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Combustível</Label>
                      <Select
                        value={formData.combustivel || ''}
                        onValueChange={(v) => setFormData({ ...formData, combustivel: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Flex">Flex</SelectItem>
                          <SelectItem value="Gasolina">Gasolina</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Elétrico">Elétrico</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Select
                        value={formData.cor || ''}
                        onValueChange={(v) => setFormData({ ...formData, cor: v })}
                      >
                        <SelectTrigger className="mt-1">
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
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="col-span-1">
                      <Label>Câmbio</Label>
                      <Select
                        value={formData.cambio || ''}
                        onValueChange={(v) => setFormData({ ...formData, cambio: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automático">Automático</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                          <SelectItem value="Semi-automático">Semi-automático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Label>KM</Label>
                      <Input
                        type="number"
                        value={formData.quilometragem || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, quilometragem: parseInt(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-1 mb-2 flex items-center gap-2">
                      <Checkbox id="nkm" />
                      <Label htmlFor="nkm" className="text-xs">
                        Ocultar KM
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Portas</Label>
                      <Select
                        value={formData.portas?.toString()}
                        onValueChange={(v) => setFormData({ ...formData, portas: parseInt(v) })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Chassi</Label>
                      <Input
                        value={formData.chassi || ''}
                        onChange={(e) => setFormData({ ...formData, chassi: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Renavam</Label>
                      <Input
                        value={formData.renavam || ''}
                        onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Valor FIPE Estimado</Label>
                    <Input
                      readOnly
                      value={formData.valor_fipe ? `FIPE: R$ ${formData.valor_fipe}` : ''}
                      className="mt-1 bg-gray-100 text-gray-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCOS C, E, F, G */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-[#0D47A1]">BLOCO C - CONSIGNAÇÃO</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_consignado}
                      onCheckedChange={(c) => setFormData({ ...formData, is_consignado: c })}
                      id="is_consignado"
                    />
                    <Label htmlFor="is_consignado">Veículo Consignado?</Label>
                  </div>
                </div>
                {formData.is_consignado && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded">
                    <div>
                      <Label>Proprietário *</Label>
                      <Input
                        value={formData.proprietario_nome || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_nome: e.target.value })
                        }
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={formData.proprietario_telefone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_telefone: e.target.value })
                        }
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Valor Mínimo (Interno)</Label>
                      <Input
                        type="number"
                        value={formData.valor_minimo || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, valor_minimo: parseFloat(e.target.value) })
                        }
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Data Entrada</Label>
                      <Input
                        type="date"
                        value={formData.data_entrada || ''}
                        onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-[#0D47A1] mb-4 border-b border-gray-100 pb-2">
                  BLOCO E - CARACTERÍSTICAS
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {CARACTERISTICAS.map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded"
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

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-[#0D47A1] mb-4 border-b border-gray-100 pb-2">
                  BLOCO F - OPCIONAIS
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-3 gap-x-2">
                  {OPCIONAIS.map((o) => (
                    <label
                      key={o}
                      className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <Checkbox
                        checked={(formData.diferenciais || []).includes(o)}
                        onCheckedChange={() => toggleArray('diferenciais', o)}
                      />{' '}
                      {o}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-[#0D47A1] mb-4 border-b border-gray-100 pb-2">
                  BLOCO G - PUBLICAÇÃO E STATUS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="reservado">Reservado</SelectItem>
                          <SelectItem value="vendido">Vendido</SelectItem>
                          <SelectItem value="consignado">Consignado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                      <Switch
                        checked={formData.destaque}
                        onCheckedChange={(c) => setFormData({ ...formData, destaque: c })}
                        id="destaque"
                      />
                      <Label htmlFor="destaque" className="font-bold">
                        Destacar na Home do site
                      </Label>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Publicar nos Portais</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={formData.publicado_webmotors}
                          onCheckedChange={(c) =>
                            setFormData({ ...formData, publicado_webmotors: c })
                          }
                        />{' '}
                        WebMotors
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={formData.publicado_icarros}
                          onCheckedChange={(c) =>
                            setFormData({ ...formData, publicado_icarros: c })
                          }
                        />{' '}
                        iCarros
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={formData.publicado_mercadolivre}
                          onCheckedChange={(c) =>
                            setFormData({ ...formData, publicado_mercadolivre: c })
                          }
                        />{' '}
                        Mercado Livre
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={formData.publicado_napista}
                          onCheckedChange={(c) =>
                            setFormData({ ...formData, publicado_napista: c })
                          }
                        />{' '}
                        NaPista
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Responsável pelo cadastro</Label>
                    <Select
                      value={formData.responsavel_id || '1'}
                      onValueChange={(v) => setFormData({ ...formData, responsavel_id: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Luiz Fernando</SelectItem>
                        <SelectItem value="2">Roberto Junior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="px-6 py-4 border-t bg-white shrink-0 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" onClick={onClose} className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => save('rascunho')}
            disabled={loading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
          </Button>
          <Button
            onClick={() => save()}
            disabled={loading}
            className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-8"
          >
            <Send className="w-4 h-4 mr-2" /> {loading ? 'Salvando...' : 'Salvar e Publicar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
