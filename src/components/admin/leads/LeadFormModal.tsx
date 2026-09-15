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
import { fetchTodosMotivosPerdaAtivos } from '@/lib/motivos-perda'

// Campos que este formulário realmente edita — salvar só esses (achado
// 15/09/2026: antes mandava o `formData` inteiro, que começa como uma
// cópia crua do lead inteiro em modo edição, arriscando sobrescrever
// campos que não aparecem nesta tela com o valor antigo sem querer).
const CAMPOS_EDITAVEIS = [
  'nome',
  'telefone',
  'email',
  'veiculo_interesse',
  'origem',
  'temperatura',
  'motivo_perda',
] as const

export function LeadFormModal({ open, onOpenChange, lead, onSuccess }: any) {
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [motivosPerda, setMotivosPerda] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (lead) setFormData(lead)
    else
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        veiculo_interesse: '',
        origem: 'manual',
        temperatura: 'frio',
        status: 'novo',
      })
  }, [lead, open])

  useEffect(() => {
    if (open) fetchTodosMotivosPerdaAtivos().then(setMotivosPerda)
  }, [open])

  const handleSave = async () => {
    setLoading(true)
    try {
      const dadosParaSalvar = Object.fromEntries(
        CAMPOS_EDITAVEIS.map((campo) => [campo, formData[campo] ?? null]),
      )
      if (lead?.id) {
        const { error } = await supabase.from('leads').update(dadosParaSalvar).eq('id', lead.id)
        if (error) throw error
        toast({ title: 'Lead atualizado com sucesso' })
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([{ ...dadosParaSalvar, status: formData.status || 'novo' }])
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
          {formData.status === 'perdido' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Motivo</Label>
              <Select
                value={formData.motivo_perda || ''}
                onValueChange={(v) => setFormData({ ...formData, motivo_perda: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Motivo da perda" />
                </SelectTrigger>
                <SelectContent>
                  {motivosPerda.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
