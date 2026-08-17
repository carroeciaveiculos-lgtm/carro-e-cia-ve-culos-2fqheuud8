import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

const ALL_MODULES = [
  { id: 'estoque', label: 'Estoque e Integrador' },
  { id: 'crm', label: 'Gerenciador de Leads (CRM)' },
  { id: 'portais', label: 'Portais e Redes Sociais' },
  { id: 'site', label: 'Gerenciador do Site' },
  { id: 'avaliacao', label: 'Avaliação de Veículos' },
  { id: 'relatorios', label: 'Relatórios e Métricas' },
  { id: 'marketing', label: 'Central de Marketing' },
  { id: 'configuracoes', label: 'Configurações do Sistema' },
]

interface CriarUsuarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CriarUsuarioModal({ open, onOpenChange, onSuccess }: CriarUsuarioModalProps) {
  const { toast } = useToast()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nivel, setNivel] = useState('operador')
  const [modulos, setModulos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setNome('')
    setEmail('')
    setSenha('')
    setNivel('operador')
    setModulos([])
  }

  const toggleModulo = (modId: string) => {
    setModulos((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId],
    )
  }

  const handleCreate = async () => {
    if (!nome || !email || !senha) {
      toast({ title: 'Preencha nome, e-mail e senha', variant: 'destructive' })
      return
    }
    if (senha.length < 8) {
      toast({ title: 'A senha precisa ter no mínimo 8 caracteres', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('criar-usuario-admin', {
        body: { nome, email, senha, nivel, modulos },
      })

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Falha ao criar usuário')
      }

      toast({ title: 'Usuário criado com sucesso!' })
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast({ title: 'Erro ao criar usuário', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#0D47A1]">Criar Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha (mín. 8 caracteres)</Label>
            <Input
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Combine a senha com a pessoa antes de criar"
            />
          </div>

          <div className="space-y-2">
            <Label>Nível de Acesso</Label>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_master">Admin Master</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Módulos Permitidos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border">
              {ALL_MODULES.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center space-x-3 bg-white p-2 rounded-md border shadow-sm"
                >
                  <Checkbox
                    id={`novo-${m.id}`}
                    checked={modulos.includes(m.id)}
                    onCheckedChange={() => toggleModulo(m.id)}
                    className="data-[state=checked]:bg-[#1565C0] data-[state=checked]:border-[#1565C0]"
                  />
                  <label
                    htmlFor={`novo-${m.id}`}
                    className="text-sm font-medium leading-none cursor-pointer text-slate-700 flex-1"
                  >
                    {m.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className="bg-[#1565C0] hover:bg-[#0D47A1]"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
