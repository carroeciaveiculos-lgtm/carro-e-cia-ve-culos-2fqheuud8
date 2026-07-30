import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  fetchDirectives,
  createDirective,
  updateDirective,
  deleteDirective,
  type SystemDirective,
} from '@/services/system-directives'

export function SystemDirectives() {
  const [directives, setDirectives] = useState<SystemDirective[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SystemDirective | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setDirectives(await fetchDirectives())
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setTitle('')
    setContent('')
    setActive(true)
    setDialogOpen(true)
  }

  const openEdit = (d: SystemDirective) => {
    setEditing(d)
    setTitle(d.title)
    setContent(d.content)
    setActive(d.active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Preencha título e conteúdo')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateDirective(editing.id, { title, content, active })
        toast.success('Diretriz atualizada')
      } else {
        await createDirective(title, content, active)
        toast.success('Diretriz criada')
      }
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (d: SystemDirective) => {
    try {
      await updateDirective(d.id, { active: !d.active })
      setDirectives((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: !x.active } : x)))
      toast.success(`Diretriz ${!d.active ? 'ativada' : 'desativada'}`)
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`)
    }
  }

  const handleDelete = async (d: SystemDirective) => {
    try {
      await deleteDirective(d.id)
      setDirectives((prev) => prev.filter((x) => x.id !== d.id))
      toast.success('Diretriz excluída')
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className="h-5 w-5 text-indigo-600" />
            Diretrizes do Sistema
          </CardTitle>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Diretriz
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : directives.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma diretriz cadastrada. Clique em "Nova Diretriz" para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {directives.map((d) => (
              <div key={d.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{d.title}</p>
                    <Badge variant={d.active ? 'default' : 'secondary'} className="text-xs">
                      {d.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{d.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualizada em {new Date(d.updated_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={d.active} onCheckedChange={() => handleToggle(d)} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(d)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(d)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Diretriz' : 'Nova Diretriz'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tom de voz do atendimento"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Descreva a diretriz..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <label className="text-sm font-medium">Ativo</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
