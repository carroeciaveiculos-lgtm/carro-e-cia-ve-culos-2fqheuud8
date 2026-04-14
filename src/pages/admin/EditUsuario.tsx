import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export default function EditUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [usuario, setUsuario] = useState<any>(null)
  const [modulos, setModulos] = useState<string[]>([])
  const [nivel, setNivel] = useState('operador')

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
            setModulos(data.modulos || [])
            setNivel(data.nivel || 'operador')
          }
        })
    }
  }, [id])

  const handleSave = async () => {
    const { error } = await supabase
      .from('usuarios')
      .update({
        modulos,
        nivel,
      })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } else {
      toast({ title: 'Permissões atualizadas com sucesso!' })
      navigate('/admin/usuarios')
    }
  }

  const toggleModulo = (modId: string) => {
    setModulos((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId],
    )
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
            </div>

            <div className="space-y-4">
              <Label className="text-base text-[#0D47A1]">Módulos Permitidos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                {ALL_MODULES.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center space-x-3 bg-white p-3 rounded-md border shadow-sm"
                  >
                    <Checkbox
                      id={m.id}
                      checked={modulos.includes(m.id)}
                      onCheckedChange={() => toggleModulo(m.id)}
                      className="data-[state=checked]:bg-[#1565C0] data-[state=checked]:border-[#1565C0]"
                    />
                    <label
                      htmlFor={m.id}
                      className="text-sm font-medium leading-none cursor-pointer text-slate-700 flex-1"
                    >
                      {m.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t mt-8">
              <Button variant="outline" onClick={() => navigate('/admin/usuarios')}>
                Cancelar
              </Button>
              <Button className="bg-[#1565C0] hover:bg-[#0D47A1]" onClick={handleSave}>
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
