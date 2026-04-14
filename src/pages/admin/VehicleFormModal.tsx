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

const DIFERENCIAIS = [
  'Ar condicionado',
  'Direção elétrica',
  'Vidros elétricos',
  'Travas elétricas',
  'Sensor de ré',
  'Câmera de ré',
  'Multimídia',
  'Bluetooth',
  'GPS',
  'Banco de couro',
  'Teto solar',
  'Rodas de liga leve',
  'Freios ABS',
  'Airbag',
  'Central multimídia Android Auto',
]

export default function VehicleFormModal({ isOpen, onClose, vehicleId, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [marcas, setMarcas] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])
  const [anos, setAnos] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
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
    final_placa: '',
    ipva_pago: false,
    preco_venda: '',
    preco_minimo: '',
    valor_fipe: '',
    status: 'disponivel',
    is_consignado: false,
    proprietario_nome: '',
    proprietario_telefone: '',
    descricao: '',
    diferenciais: [],
    fotos: [],
    publicado_olx: false,
    publicado_webmotors: false,
    publicado_icarros: false,
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
            const m = marcas.find((x) => x.nome === data.marca)
            if (m) getModelos(m.codigo).then(setModelos)
          }
        })
    }
  }, [vehicleId])

  const handleMarcaChange = (val: string) => {
    setFormData({ ...formData, marca: val, modelo: '', ano_fabricacao: '' })
    const m = marcas.find((x) => x.nome === val)
    if (m) getModelos(m.codigo).then(setModelos)
  }

  const handleModeloChange = (val: string) => {
    setFormData({ ...formData, modelo: val, ano_fabricacao: '' })
    const m = marcas.find((x) => x.nome === formData.marca)
    const mod = modelos.find((x) => x.nome === val)
    if (m && mod) getAnos(m.codigo, mod.codigo).then(setAnos)
  }

  const handleAnoChange = async (val: string) => {
    setFormData({ ...formData, ano_fabricacao: val, ano_modelo: val })
    const m = marcas.find((x) => x.nome === formData.marca)
    const mod = modelos.find((x) => x.nome === formData.modelo)
    const a = anos.find((x) => x.nome === val)
    if (m && mod && a) {
      const res = await fetch(
        `https://parallelum.com.br/fipe/api/v1/carros/marcas/${m.codigo}/modelos/${mod.codigo}/anos/${a.codigo}`,
      )
      const fipeData = await res.json()
      if (fipeData && fipeData.Valor) {
        const numValue = parseFloat(
          fipeData.Valor.replace('R$ ', '').replace('.', '').replace(',', '.'),
        )
        setFormData((prev) => ({ ...prev, valor_fipe: numValue }))
      }
    }
  }

  const toggleDiferencial = (dif: string) => {
    setFormData((prev: any) => ({
      ...prev,
      diferenciais: prev.diferenciais?.includes(dif)
        ? prev.diferenciais.filter((d: string) => d !== dif)
        : [...(prev.diferenciais || []), dif],
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const ext = file.name.split('.').pop()
    const filename = `${Math.random().toString(36).substring(2, 15)}.${ext}`

    setLoading(true)
    const { data, error } = await supabase.storage
      .from('veiculos-fotos')
      .upload(`fotos/${filename}`, file)
    setLoading(false)

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao enviar foto', variant: 'destructive' })
    } else {
      const {
        data: { publicUrl },
      } = supabase.storage.from('veiculos-fotos').getPublicUrl(`fotos/${filename}`)
      setFormData((prev: any) => ({ ...prev, fotos: [...(prev.fotos || []), publicUrl] }))
      toast({ title: 'Sucesso', description: 'Foto enviada' })
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      fotos: prev.fotos.filter((_: any, i: number) => i !== index),
    }))
  }

  const save = async (statusOverride?: string) => {
    setLoading(true)
    const payload = { ...formData }
    if (statusOverride) payload.status = statusOverride
    if (!payload.id) {
      const { error } = await supabase.from('veiculos').insert([payload])
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        toast({ title: 'Sucesso', description: 'Veículo salvo' })
        onSuccess()
        onClose()
      }
    } else {
      const { error } = await supabase.from('veiculos').update(payload).eq('id', payload.id)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        toast({ title: 'Sucesso', description: 'Veículo atualizado' })
        onSuccess()
        onClose()
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{vehicleId ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            <section>
              <h3 className="font-bold mb-4 border-b pb-2">Integração FIPE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Select value={formData.marca} onValueChange={handleMarcaChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
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
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Select
                    value={formData.modelo}
                    onValueChange={handleModeloChange}
                    disabled={!formData.marca}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
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
                <div className="space-y-2">
                  <Label>Ano de Fabricação/Modelo *</Label>
                  <Select
                    value={formData.ano_fabricacao?.toString()}
                    onValueChange={handleAnoChange}
                    disabled={!formData.modelo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map((a) => (
                        <SelectItem key={a.codigo} value={a.nome}>
                          {a.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor FIPE Estimado</Label>
                  <Input
                    readOnly
                    className="bg-muted"
                    value={formData.valor_fipe ? `R$ ${formData.valor_fipe}` : ''}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold mb-4 border-b pb-2">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Versão</Label>
                  <Input
                    value={formData.versao || ''}
                    onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Input
                    value={formData.cor || ''}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quilometragem</Label>
                  <Input
                    type="number"
                    value={formData.quilometragem || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, quilometragem: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Câmbio</Label>
                  <Select
                    value={formData.cambio || ''}
                    onValueChange={(v) => setFormData({ ...formData, cambio: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automático">Automático</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Combustível</Label>
                  <Select
                    value={formData.combustivel || ''}
                    onValueChange={(v) => setFormData({ ...formData, combustivel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Final da Placa</Label>
                  <Input
                    maxLength={1}
                    value={formData.final_placa || ''}
                    onChange={(e) => setFormData({ ...formData, final_placa: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Switch
                  checked={formData.ipva_pago || false}
                  onCheckedChange={(c) => setFormData({ ...formData, ipva_pago: c })}
                  id="ipva"
                />
                <Label htmlFor="ipva">IPVA Pago?</Label>
              </div>
            </section>

            <section>
              <h3 className="font-bold mb-4 border-b pb-2">Preços e Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input
                    type="number"
                    value={formData.preco_venda || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, preco_venda: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Mínimo (Interno)</Label>
                  <Input
                    type="number"
                    value={formData.preco_minimo || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, preco_minimo: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status || 'disponivel'}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                      <SelectItem value="consignado">Consignado Ativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_consignado || false}
                    onCheckedChange={(c) => setFormData({ ...formData, is_consignado: c })}
                    id="consig"
                  />
                  <Label htmlFor="consig">Veículo Consignado?</Label>
                </div>
                {formData.is_consignado && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Proprietário</Label>
                      <Input
                        value={formData.proprietario_nome || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_nome: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp Proprietário</Label>
                      <Input
                        value={formData.proprietario_telefone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, proprietario_telefone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="font-bold mb-4 border-b pb-2">Descrição e Diferenciais</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição Pública</Label>
                  <Textarea
                    className="min-h-[100px]"
                    value={formData.descricao || ''}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Diferenciais</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DIFERENCIAIS.map((d) => (
                      <div key={d} className="flex items-center gap-2">
                        <Checkbox
                          id={`d-${d}`}
                          checked={(formData.diferenciais || []).includes(d)}
                          onCheckedChange={() => toggleDiferencial(d)}
                        />
                        <Label htmlFor={`d-${d}`} className="text-sm cursor-pointer">
                          {d}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold mb-4 border-b pb-2">Fotos</h3>
              <div className="mb-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {(formData.fotos || []).map((f: string, i: number) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-md overflow-hidden bg-muted group"
                  >
                    <img src={f} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2 bg-muted/20">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => save('rascunho')} disabled={loading}>
            Salvar Rascunho
          </Button>
          <Button onClick={() => save()} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar e Publicar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
