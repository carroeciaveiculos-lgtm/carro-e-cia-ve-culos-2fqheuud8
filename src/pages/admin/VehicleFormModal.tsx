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
import { ScrollArea } from '@/components/ui/scroll-area'
import { CARACTERISTICAS, OPCIONAIS, CORES } from '@/lib/constants'
import {
  Camera,
  Search,
  Trash2,
  GripHorizontal,
  Save,
  Send,
  Car,
  Info,
  Settings,
  Share2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
        })
      }
    }
  }, [isOpen, vehicleId])

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
                  Consulta Automática via Placa
                </Label>
                <Input
                  value={formData.placa || ''}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  className="mt-1 font-mono uppercase bg-slate-50 text-lg h-12"
                  placeholder="ABC-1234"
                  maxLength={8}
                />
              </div>
              <Button
                onClick={consultarAPIPlaca}
                disabled={loadingPlaca}
                className="h-12 px-8 bg-slate-800 hover:bg-slate-900"
              >
                {loadingPlaca ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Consultar API Brasil
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
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Ano Fabricação
                      </Label>
                      <Input
                        type="number"
                        value={formData.ano_fabricacao || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, ano_fabricacao: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Ano Modelo
                      </Label>
                      <Input
                        type="number"
                        value={formData.ano_modelo || ''}
                        onChange={(e) => setFormData({ ...formData, ano_modelo: e.target.value })}
                        className="mt-1"
                      />
                    </div>
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
                </div>

                <div className="space-y-4">
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
                          className="mt-1 font-bold text-green-700"
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
                              preco_classificados: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">
                          Valor FIPE (R$)
                        </Label>
                        <Input
                          type="number"
                          readOnly
                          value={formData.valor_fipe || ''}
                          className="mt-1 bg-slate-100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">
                          Quilometragem
                        </Label>
                        <Input
                          type="number"
                          value={formData.quilometragem || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quilometragem: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
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

            {/* CHECKLIST */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">
                OPCIONAIS E CARACTERÍSTICAS
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-blue-600 uppercase mb-2 block">
                    Destaques
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CARACTERISTICAS.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-xs cursor-pointer">
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
                  <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block mt-4">
                    Opcionais
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {OPCIONAIS.map((o) => (
                      <label
                        key={o}
                        className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-600"
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
