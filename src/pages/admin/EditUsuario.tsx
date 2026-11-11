import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { AtivacaoUsuarioDialog } from '@/components/admin/AtivacaoUsuarioDialog'
import {
  formatarWhatsApp,
  getDadosPessoais,
  normalizarWhatsApp,
  salvarDadosPessoais,
} from '@/services/usuarios'
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
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [dialogAtivacao, setDialogAtivacao] = useState(false)
  const { user } = useAuth()

  const carregarUsuario = () => {
    if (!id) return
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
  }

  useEffect(() => {
    if (id) {
      carregarUsuario()
      listSetorIdsDoUsuario(id).then(({ data }) => setSetorIds(data))
      getDadosPessoais(id).then(({ data }) => {
        setWhatsapp(data?.whatsapp ? formatarWhatsApp(data.whatsapp) : '')
        setEndereco(data?.endereco || '')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const inativo = usuario?.ativo === false

  const handleSave = async () => {
    if (!id) return
    if (whatsapp.trim() && !/^\d{12,13}$/.test(normalizarWhatsApp(whatsapp))) {
      toast({
        title: 'WhatsApp inválido',
        description: 'Use DDD + número, por exemplo (34) 99999-9999.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    // Usuário inativo fica bloqueado: o nível só muda depois de reativar.
    if (!inativo) {
      const { error } = await supabase.from('usuarios').update({ nivel }).eq('id', id)
      if (error) {
        toast({ title: 'Erro ao salvar', variant: 'destructive' })
        setSalvando(false)
        return
      }
    }

    const { error: dadosError } = await salvarDadosPessoais(id, { whatsapp, endereco })
    if (dadosError) {
      toast({
        title: 'Nível salvo, mas falha ao salvar WhatsApp/endereço',
        description: 'Confira o número e tente de novo.',
        variant: 'destructive',
      })
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
              <Select value={nivel} onValueChange={setNivel} disabled={inativo}>
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
              {inativo && (
                <p className="text-sm text-muted-foreground">
                  Colaborador inativo. Para mudar o nível, reative primeiro.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base text-[#0D47A1]">Contato do colaborador</Label>
              <p className="text-xs text-muted-foreground">
                Visível só para Admin Master e para a própria pessoa.
              </p>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  inputMode="tel"
                  placeholder="(34) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  rows={2}
                  placeholder="Rua, número, bairro, cidade"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base text-[#0D47A1]">
                Setores (define o que a pessoa vê e acessa no painel)
              </Label>
              <SetoresSelect selecionados={setorIds} onChange={setSetorIds} />
            </div>

            <div className="flex flex-wrap justify-end gap-4 pt-6 border-t mt-8">
              {usuario.id !== user?.id && (
                <Button
                  variant="outline"
                  className={`mr-auto ${inativo ? 'text-green-700' : 'text-[#C62828]'}`}
                  onClick={() => setDialogAtivacao(true)}
                >
                  {inativo ? 'Reativar colaborador' : 'Desativar colaborador'}
                </Button>
              )}
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
      <AtivacaoUsuarioDialog
        usuario={dialogAtivacao ? usuario : null}
        meuId={user?.id}
        onOpenChange={setDialogAtivacao}
        onDone={carregarUsuario}
      />
    </div>
  )
}
