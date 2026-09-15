import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  MOTIVOS_PERDA_PADRAO,
  fetchMotivosPersonalizados,
  type MotivoPersonalizado,
} from '@/lib/motivos-perda'

interface CadastroMotivosPerdaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Tela "Cadastro" do CRM (pedido da Adriana, 15/09/2026): motivos de perda
// personalizados, além dos 8 padrão do sistema (esses ficam só como
// referência aqui, não são editáveis).
export function CadastroMotivosPerdaModal({ open, onOpenChange }: CadastroMotivosPerdaModalProps) {
  const { toast } = useToast()
  const [motivos, setMotivos] = useState<MotivoPersonalizado[]>([])
  const [novoMotivo, setNovoMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => setMotivos(await fetchMotivosPersonalizados())

  useEffect(() => {
    if (open) carregar()
  }, [open])

  const handleCriar = async () => {
    const nome = novoMotivo.trim()
    if (!nome) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('motivos_perda_personalizados').insert({ nome })
      if (error) throw error
      setNovoMotivo('')
      await carregar()
    } catch (e: any) {
      toast({ title: 'Erro ao criar motivo', description: e.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleApagar = async (id: string) => {
    if (!confirm('Apagar este motivo? Leads que já usam ele mantêm o texto salvo.')) return
    const { error } = await supabase.from('motivos_perda_personalizados').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao apagar', description: error.message, variant: 'destructive' })
      return
    }
    await carregar()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Motivos de Perda Personalizados</DialogTitle>
          <p className="text-sm text-slate-500">
            Adicione motivos de perda específicos para sua empresa, além dos padrões do sistema.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Motivos padrão</p>
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS_PERDA_PADRAO.map((m) => (
                <Badge key={m} variant="secondary" className="font-normal">
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Motivos personalizados</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {motivos.length === 0 && (
                <p className="text-sm text-slate-400 italic">Nenhum motivo personalizado ainda.</p>
              )}
              {motivos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 bg-slate-50 border rounded-md px-3 py-1.5"
                >
                  <span className="text-sm text-slate-700">{m.nome}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={() => handleApagar(m.id)}
                    title="Apagar motivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="Criar novo motivo..."
              value={novoMotivo}
              onChange={(e) => setNovoMotivo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
            />
            <Button onClick={handleCriar} disabled={salvando || !novoMotivo.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
