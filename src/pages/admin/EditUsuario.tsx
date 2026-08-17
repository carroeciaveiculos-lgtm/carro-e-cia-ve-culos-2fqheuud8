import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { SetoresSelect } from '@/components/admin/SetoresSelect'
import { listSetorIdsDoUsuario, salvarSetoresDoUsuario } from '@/services/setores'

export default function EditUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [usuario, setUsuario] = useState<any>(null)
  const [nivel, setNivel] = useState('operador')
  const [setorIds, setSetorIds] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (id) {
      supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUsuario(data)
            setNivel(data.nivel || 'operador')
          }
        })
      listSetorIdsDoUsuario(id).then(({ data }) => setSetorIds(data))
    }
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSalvando(true)
    const { error } = await supabase.from('usuarios').update({ nivel }).eq('id', id)

    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
      setSalvando(false)
      return
    }

    const { error: setorError } = await salvarSetoresDoUsuario(id, setorIds)
    setSalvando(false)

    if (setorError) {
      toast({
        title: 'Nível salvo, mas falha ao atualizar setores',
        description: setorError.message,
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Permissões atualizadas com sucesso!' })
    navigate('/admin/usuarios')
  }

  if (!usuario)
    return (
      <div
        className="p-8 flex-1"
        style={{ background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%)' }}
      >
        Carregando...
      </div>
    )

  return (
    <div
      className="p-4 md:p-8 flex-1"
      style={{ background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0D47A1] mb-8 mt-4">Editar Permissões</h1>
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <CardTitle className="text-[#0D47A1]">Usuário: {usuario.nome}</CardTitle>
            <p className="text-sm text-muted-foreground">{usuario.email}</p>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-3">
              <Label className="text-base text-[#0D47A1]">Nível de Acesso</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_master">Admin Master</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              {nivel === 'bloqueado' && (
                <p className="text-sm text-red-600">
                  Usuário bloqueado não consegue mais entrar no painel.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base text-[#0D47A1]">
                Setores (define o que a pessoa vê e acessa no painel)
              </Label>
              <SetoresSelect selecionados={setorIds} onChange={setSetorIds} />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t mt-8">
              <Button variant="outline" onClick={() => navigate('/admin/usuarios')}>
                Cancelar
              </Button>
              <Button
                className="bg-[#1565C0] hover:bg-[#0D47A1]"
                onClick={handleSave}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
