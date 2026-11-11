import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { desativarUsuario, motivoParaNaoDesativar, reativarUsuario } from '@/services/usuarios'

export type UsuarioAtivacao = {
  id: string
  nome: string
  nivel?: string | null
  ativo?: boolean | null
}

interface Props {
  usuario: UsuarioAtivacao | null
  meuId?: string
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

/** Confirmação de Desativar / Reativar colaborador (só admin_master chega até aqui). */
export function AtivacaoUsuarioDialog({ usuario, meuId, onOpenChange, onDone }: Props) {
  const { toast } = useToast()
  const [nivel, setNivel] = useState('operador')
  const [salvando, setSalvando] = useState(false)
  const reativando = usuario ? usuario.ativo === false : false

  useEffect(() => {
    setNivel('operador')
  }, [usuario?.id])

  const confirmar = async () => {
    if (!usuario) return
    setSalvando(true)
    if (!reativando) {
      const motivo = await motivoParaNaoDesativar(usuario, meuId)
      if (motivo) {
        setSalvando(false)
        toast({ title: 'Não foi possível desativar', description: motivo, variant: 'destructive' })
        return
      }
    }
    const { error } = reativando
      ? await reativarUsuario(usuario.id, nivel)
      : await desativarUsuario(usuario.id)
    setSalvando(false)
    if (error) {
      toast({
        title: reativando ? 'Erro ao reativar' : 'Erro ao desativar',
        description: 'Tente novamente. Se repetir, avise o suporte.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: reativando ? 'Colaborador reativado' : 'Colaborador desativado' })
    onOpenChange(false)
    onDone()
  }

  return (
    <AlertDialog open={!!usuario} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {reativando ? 'Reativar' : 'Desativar'} {usuario?.nome}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {reativando ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  A pessoa volta a aparecer nas listas (como responsável por lead, por exemplo) e
                  pode entrar no painel com o nível escolhido abaixo.
                </p>
                <div className="space-y-2">
                  <Label>Nível de acesso</Label>
                  <Select value={nivel} onValueChange={setNivel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_master">Admin Master</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  A pessoa deixa de aparecer nas listas de responsáveis e perde o acesso ao painel
                  (nível passa a Bloqueado).
                </p>
                <p>
                  Nada é apagado: leads, veículos e histórico dela continuam. Você pode reativar
                  quando quiser.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
          <Button
            className={
              reativando ? 'bg-[#1565C0] hover:bg-[#0D47A1]' : 'bg-[#C62828] hover:bg-[#B71C1C]'
            }
            onClick={confirmar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : reativando ? 'Reativar' : 'Desativar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
