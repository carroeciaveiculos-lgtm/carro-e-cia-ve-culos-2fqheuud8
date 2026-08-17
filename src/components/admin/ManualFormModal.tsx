import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Setor, listSetores } from '@/services/setores'
import {
  AjudaConteudo,
  criarAjudaConteudo,
  atualizarAjudaConteudo,
} from '@/services/ajuda'

interface ManualFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conteudo: AjudaConteudo | null
  onSuccess: () => void
}

const CAMPO_VAZIO = {
  categoria: 'Geral',
  titulo: '',
  o_que_e: '',
  dependencias: '',
  para_que_serve: '',
  caminho: '',
  quando_utilizar: '',
  como_utilizar: '',
  is_faq: false,
  setor_id: null as string | null,
}

export function ManualFormModal({ open, onOpenChange, conteudo, onSuccess }: ManualFormModalProps) {
  const { toast } = useToast()
  const [setores, setSetores] = useState<Setor[]>([])
  const [form, setForm] = useState(CAMPO_VAZIO)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    listSetores().then(({ data }) => setSetores(data))
  }, [])

  useEffect(() => {
    if (conteudo) {
      setForm({
        categoria: conteudo.categoria || 'Geral',
        titulo: conteudo.titulo,
        o_que_e: conteudo.o_que_e || '',
        dependencias: conteudo.dependencias || '',
        para_que_serve: conteudo.para_que_serve || '',
        caminho: conteudo.caminho || '',
        quando_utilizar: conteudo.quando_utilizar || '',
        como_utilizar: conteudo.como_utilizar || '',
        is_faq: conteudo.is_faq,
        setor_id: conteudo.setor_id,
      })
    } else {
      setForm(CAMPO_VAZIO)
    }
  }, [conteudo, open])

  const handleSalvar = async () => {
    if (!form.titulo.trim()) {
      toast({ title: 'Defina um título', variant: 'destructive' })
      return
    }
    setSalvando(true)
    const { error } = conteudo
      ? await atualizarAjudaConteudo(conteudo.id, form)
      : await criarAjudaConteudo(form)
    setSalvando(false)

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({ title: conteudo ? 'Manual atualizado!' : 'Manual criado!' })
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conteudo ? 'Editar Manual/POP' : 'Novo Manual/POP'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={form.setor_id || ''}
                onValueChange={(v) => setForm((f) => ({ ...f, setor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria (módulo do sistema, opcional)</Label>
              <Input
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                placeholder="Ex: CRM, Estoque, Geral"
              />
            </div>
            <div className="space-y-2">
              <Label>Caminho no sistema (opcional)</Label>
              <Input
                value={form.caminho || ''}
                onChange={(e) => setForm((f) => ({ ...f, caminho: e.target.value }))}
                placeholder="Ex: /admin/estoque"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_faq"
              checked={form.is_faq}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_faq: !!checked }))}
            />
            <Label htmlFor="is_faq">É uma dúvida frequente (FAQ), não um manual/POP completo</Label>
          </div>

          <div className="space-y-2">
            <Label>O que é</Label>
            <Textarea
              rows={2}
              value={form.o_que_e || ''}
              onChange={(e) => setForm((f) => ({ ...f, o_que_e: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Para que serve</Label>
            <Textarea
              rows={2}
              value={form.para_que_serve || ''}
              onChange={(e) => setForm((f) => ({ ...f, para_que_serve: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Quando utilizar</Label>
            <Textarea
              rows={2}
              value={form.quando_utilizar || ''}
              onChange={(e) => setForm((f) => ({ ...f, quando_utilizar: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Como utilizar (passo a passo)</Label>
            <Textarea
              rows={6}
              value={form.como_utilizar || ''}
              onChange={(e) => setForm((f) => ({ ...f, como_utilizar: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Dependências e vínculos</Label>
            <Textarea
              rows={2}
              value={form.dependencias || ''}
              onChange={(e) => setForm((f) => ({ ...f, dependencias: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
