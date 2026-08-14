import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarClock, Check, X, CalendarX2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Agendamento = {
  id: string
  lead_id: string
  veiculo_id: string | null
  data_hora: string
  tipo: string
  status: string
  observacoes: string | null
  leads: { nome: string | null; telefone: string | null } | null
  veiculos: { marca: string | null; modelo: string | null } | null
}

const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado',
  realizado: 'Compareceu',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
}

const STATUS_COLOR: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700 border-blue-200',
  realizado: 'bg-green-100 text-green-700 border-green-200',
  cancelado: 'bg-slate-100 text-slate-600 border-slate-200',
  nao_compareceu: 'bg-red-100 text-red-700 border-red-200',
}

// Bloco 2 do plano de agendamentos (13/08/2026, pedido da Adriana) — antes a
// tabela agendamentos_visita (criada em 12/08/2026, quando a Clara ganhou a
// função agendar_visita) não tinha NENHUMA tela: só dava pra ver por SQL
// direto, e não existia jeito de marcar se o cliente veio ou não.
export default function Agendamentos() {
  const { toast } = useToast()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'proximos' | 'hoje' | 'todos'>('proximos')
  const [atualizando, setAtualizando] = useState<string | null>(null)

  useEffect(() => {
    carregar()

    const channel = supabase
      .channel('agendamentos-visita-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos_visita' },
        () => carregar(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const carregar = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agendamentos_visita')
      .select('*, leads(nome, telefone), veiculos(marca, modelo)')
      .order('data_hora', { ascending: true })

    if (error) {
      toast({ title: 'Erro ao carregar agendamentos', description: error.message, variant: 'destructive' })
    } else {
      setAgendamentos((data as any) || [])
    }
    setLoading(false)
  }

  const atualizarStatus = async (id: string, status: string) => {
    setAtualizando(id)
    const { error } = await supabase.from('agendamentos_visita').update({ status }).eq('id', id)
    setAtualizando(null)
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      return
    }
    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const filtrados = useMemo(() => {
    const agora = new Date()
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000)

    if (filtro === 'todos') return agendamentos
    if (filtro === 'hoje') {
      return agendamentos.filter((a) => {
        const d = new Date(a.data_hora)
        return d >= inicioHoje && d < fimHoje
      })
    }
    // próximos: hoje em diante, ainda em aberto primeiro
    return agendamentos.filter((a) => new Date(a.data_hora) >= inicioHoje || a.status === 'agendado')
  }, [agendamentos, filtro])

  const contagemHoje = useMemo(() => {
    const agora = new Date()
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000)
    return agendamentos.filter((a) => {
      const d = new Date(a.data_hora)
      return d >= inicioHoje && d < fimHoje
    }).length
  }, [agendamentos])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Agendamentos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visitas e avaliações marcadas pela Clara ou pela equipe.
            {contagemHoje > 0 && (
              <span className="ml-1 font-medium text-blue-700">
                {contagemHoje} agendamento{contagemHoje > 1 ? 's' : ''} hoje.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center border rounded-md p-1 bg-slate-100">
          {(['proximos', 'hoje', 'todos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                filtro === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
              )}
            >
              {f === 'proximos' ? 'Próximos' : f === 'hoje' ? 'Hoje' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!loading && filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Nenhum agendamento aqui.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(a.data_hora).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-800">{a.leads?.nome || 'Sem nome'}</div>
                  {a.leads?.telefone && (
                    <div className="text-xs text-slate-400">{a.leads.telefone}</div>
                  )}
                </TableCell>
                <TableCell>
                  {a.veiculos ? `${a.veiculos.marca} ${a.veiculos.modelo}` : '—'}
                </TableCell>
                <TableCell className="capitalize">{a.tipo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLOR[a.status] || ''}>
                    {STATUS_LABEL[a.status] || a.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {a.status === 'agendado' ? (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={atualizando === a.id}
                        className="h-7 px-2 text-green-700 border-green-200 hover:bg-green-50"
                        onClick={() => atualizarStatus(a.id, 'realizado')}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Compareceu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={atualizando === a.id}
                        className="h-7 px-2 text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => atualizarStatus(a.id, 'nao_compareceu')}
                      >
                        <CalendarX2 className="w-3.5 h-3.5 mr-1" /> Não veio
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={atualizando === a.id}
                        className="h-7 px-2 text-slate-600"
                        onClick={() => atualizarStatus(a.id, 'cancelado')}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-slate-400"
                      onClick={() => atualizarStatus(a.id, 'agendado')}
                    >
                      Reabrir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
