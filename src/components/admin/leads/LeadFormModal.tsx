import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LeadFormModal({ open, onOpenChange, lead, onSuccess }: any) {
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (lead) setFormData(lead)
    else
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        veiculo_interesse: '',
        origem: 'Manual',
        temperatura: 'frio',
        status: 'novo',
      })
  }, [lead, open])

  const handleSave = async () => {
    setLoading(true)
    try {
      if (lead?.id) {
        const { error } = await supabase.from('leads').update(formData).eq('id', lead.id)
        if (error) throw error
        toast({ title: 'Lead atualizado com sucesso' })
      } else {
        const { error } = await supabase.from('leads').insert([formData])
        if (error) throw error
        toast({ title: 'Lead criado com sucesso' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead Manual'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Nome</Label>
            <Input
              className="col-span-3"
              value={formData.nome || ''}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Telefone</Label>
            <Input
              className="col-span-3"
              value={formData.telefone || ''}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Email</Label>
            <Input
              type="email"
              className="col-span-3"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Veículo</Label>
            <Input
              className="col-span-3"
              placeholder="Modelo de Interesse"
              value={formData.veiculo_interesse || ''}
              onChange={(e) => setFormData({ ...formData, veiculo_interesse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Origem</Label>
            <Input
              className="col-span-3"
              value={formData.origem || ''}
              onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Temp.</Label>
            <Select
              value={formData.temperatura || 'frio'}
              onValueChange={(v) => setFormData({ ...formData, temperatura: v })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frio">Frio (Azul)</SelectItem>
                <SelectItem value="morno">Morno (Laranja)</SelectItem>
                <SelectItem value="quente">Quente (Vermelho)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
