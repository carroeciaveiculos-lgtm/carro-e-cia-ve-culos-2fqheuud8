import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ClipboardList } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  MOTIVOS_PERDA_PADRAO,
  fetchMotivosPersonalizados,
  type MotivoPersonalizado,
} from '@/lib/motivos-perda'

// Tela "Cadastro" do CRM (pedido da Adriana, 15/09/2026) — pediu pra ficar
// no menu principal, logo abaixo de "Avaliação de Veículo", não como botão
// dentro da tela de Leads.
export default function CadastroCrm() {
  const { toast } = useToast()
  const [motivos, setMotivos] = useState<MotivoPersonalizado[]>([])
  const [novoMotivo, setNovoMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => setMotivos(await fetchMotivosPersonalizados())

  useEffect(() => {
    carregar()
  }, [])

  const handleCriar = async () => {
    const nome = novoMotivo.trim()
    if (!nome) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('motivos_perda_personalizados').insert({ nome })
      if (error) throw error
      setNovoMotivo('')
      await carregar()
      toast({ title: 'Motivo criado' })
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
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Cadastro
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurações do CRM que valem pra todos os leads.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-slate-800">Motivos de Perda Personalizados</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Adicione motivos de perda específicos para sua empresa, além dos padrões do sistema.
          </p>
        </div>

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
          <div className="space-y-1.5">
            {motivos.length === 0 && (
              <p className="text-sm text-slate-400 italic">Nenhum motivo personalizado ainda.</p>
            )}
            {motivos.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 bg-slate-50 border rounded-md px-3 py-2"
              >
                <span className="text-sm text-slate-700">{m.nome}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:bg-red-50"
                  onClick={() => handleApagar(m.id)}
                  title="Apagar motivo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t">
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
    </div>
  )
}
