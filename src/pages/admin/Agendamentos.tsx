import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { mensagemErroAmigavel } from '@/lib/friendly-error'
import {
  type Agendamento,
  STATUS_AGENDAMENTO,
  STATUS_COLOR,
  STATUS_LABEL,
  atualizarStatusAgendamento,
  contaNoNumeroDoDia,
  diaDoAgendamento,
  listarAgendamentos,
} from '@/services/agendamentos'
import { AcoesAgendamento } from '@/components/admin/agendamentos/AcoesAgendamento'
import { AgendamentosDoDia } from '@/components/admin/agendamentos/AgendamentosDoDia'

const TODOS = 'todos'
const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Opcao = { valor: string; rotulo: string }

function Filtro({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string
  valor: string
  opcoes: Opcao[]
  onChange: (valor: string) => void
}) {
  return (
    <div className="min-w-[160px] flex-1">
      <label className="text-xs text-slate-500">{rotulo}</label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-white capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor} className="capitalize">
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const opcoesUnicas = (valores: (string | null | undefined)[]): Opcao[] =>
  [...new Set(valores.filter((v): v is string => !!v))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((v) => ({ valor: v, rotulo: v.replace(/_/g, ' ') }))

// Tela criada em 13/08/2026 (lista simples). Em 12/11/2026 ganhou o
// calendário do mês — cada dia mostra só o NÚMERO de agendamentos, e o clique
// abre a janela com os detalhes — e os filtros (pedido da Adriana).
export default function Agendamentos() {
  const { toast } = useToast()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'proximos' | 'hoje' | 'todos'>('proximos')
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [mes, setMes] = useState(() => startOfMonth(new Date()))
  const [diaAberto, setDiaAberto] = useState<string | null>(null)
  const [fStatus, setFStatus] = useState(TODOS)
  const [fTipo, setFTipo] = useState(TODOS)
  const [fVeiculo, setFVeiculo] = useState(TODOS)
  const [fOrigem, setFOrigem] = useState(TODOS)

  useEffect(() => {
    carregar()

    const channel = supabase
      .channel('agendamentos-visita-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos_visita' }, () =>
        carregar(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const carregar = async () => {
    const { data, error } = await listarAgendamentos()
    if (error) {
      toast({
        title: 'Erro ao carregar agendamentos',
        description: mensagemErroAmigavel(error),
        variant: 'destructive',
      })
    } else {
      setAgendamentos(data)
    }
    setLoading(false)
  }

  const atualizarStatus = async (id: string, status: string) => {
    setAtualizando(id)
    const { error } = await atualizarStatusAgendamento(id, status)
    setAtualizando(null)
    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: mensagemErroAmigavel(error),
        variant: 'destructive',
      })
      return
    }
    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const opcoes = useMemo(() => {
    const veiculos = new Map<string, string>()
    for (const a of agendamentos) {
      if (a.veiculos) veiculos.set(a.veiculos.id, `${a.veiculos.marca} ${a.veiculos.modelo}`)
    }
    return {
      status: STATUS_AGENDAMENTO.map((s) => ({ valor: s, rotulo: STATUS_LABEL[s] })),
      tipo: opcoesUnicas(agendamentos.map((a) => a.tipo)),
      origem: opcoesUnicas(agendamentos.map((a) => a.leads?.origem)),
      veiculo: [...veiculos]
        .map(([valor, rotulo]) => ({ valor, rotulo }))
        .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')),
    }
  }, [agendamentos])

  // Filtros de cima valem para o calendário E para a lista.
  const filtrados = useMemo(
    () =>
      agendamentos.filter(
        (a) =>
          (fStatus === TODOS || a.status === fStatus) &&
          (fTipo === TODOS || a.tipo === fTipo) &&
          (fVeiculo === TODOS || a.veiculo_id === fVeiculo) &&
          (fOrigem === TODOS || a.leads?.origem === fOrigem),
      ),
    [agendamentos, fStatus, fTipo, fVeiculo, fOrigem],
  )

  const porDia = useMemo(() => {
    const mapa = new Map<string, Agendamento[]>()
    for (const a of filtrados) {
      const dia = diaDoAgendamento(a.data_hora)
      mapa.set(dia, [...(mapa.get(dia) ?? []), a])
    }
    return mapa
  }, [filtrados])

  // Se a pessoa escolheu um status no filtro, o número mostra exatamente o
  // que ela pediu; sem filtro de status, vale a regra de contaNoNumeroDoDia.
  const numeroDoDia = (dia: string) => {
    const lista = porDia.get(dia) ?? []
    return fStatus === TODOS ? lista.filter(contaNoNumeroDoDia).length : lista.length
  }

  const diasDoMes = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(mes)),
        end: endOfWeek(endOfMonth(mes)),
      }),
    [mes],
  )

  const hoje = diaDoAgendamento(new Date().toISOString())

  const daLista = useMemo(() => {
    if (periodo === 'todos') return filtrados
    if (periodo === 'hoje') return filtrados.filter((a) => diaDoAgendamento(a.data_hora) === hoje)
    // próximos: de hoje em diante, mais o que ficou em aberto no passado
    return filtrados.filter((a) => diaDoAgendamento(a.data_hora) >= hoje || a.status === 'agendado')
  }, [filtrados, periodo, hoje])

  const contagemHoje = (porDia.get(hoje) ?? []).filter(contaNoNumeroDoDia).length
  const temFiltro = [fStatus, fTipo, fVeiculo, fOrigem].some((f) => f !== TODOS)

  const limparFiltros = () => {
    setFStatus(TODOS)
    setFTipo(TODOS)
    setFVeiculo(TODOS)
    setFOrigem(TODOS)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
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

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Filtro rotulo="Status" valor={fStatus} opcoes={opcoes.status} onChange={setFStatus} />
        <Filtro rotulo="Tipo" valor={fTipo} opcoes={opcoes.tipo} onChange={setFTipo} />
        <Filtro rotulo="Veículo" valor={fVeiculo} opcoes={opcoes.veiculo} onChange={setFVeiculo} />
        <Filtro rotulo="Origem" valor={fOrigem} opcoes={opcoes.origem} onChange={setFOrigem} />
        {temFiltro && (
          <Button variant="ghost" size="sm" className="h-9 text-slate-500" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border p-3 sm:p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Mês anterior"
            onClick={() => setMes((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800 capitalize">
              {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            {!isSameMonth(mes, new Date()) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-blue-700"
                onClick={() => setMes(startOfMonth(new Date()))}
              >
                Hoje
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Próximo mês"
            onClick={() => setMes((m) => addMonths(m, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DIAS_DA_SEMANA.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
              {d}
            </div>
          ))}
          {diasDoMes.map((data) => {
            const dia = format(data, 'yyyy-MM-dd')
            const numero = numeroDoDia(dia)
            const foraDoMes = !isSameMonth(data, mes)
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaAberto(dia)}
                aria-label={`${format(data, "d 'de' MMMM", { locale: ptBR })}: ${numero} agendamento${numero === 1 ? '' : 's'}`}
                className={cn(
                  'h-14 sm:h-20 rounded-md border p-1.5 flex flex-col items-start justify-between text-left transition-colors hover:bg-blue-50 hover:border-blue-200',
                  foraDoMes ? 'bg-slate-50 text-slate-300 border-transparent' : 'text-slate-700',
                  dia === hoje && 'border-blue-500 ring-1 ring-blue-500',
                )}
              >
                <span className={cn('text-xs', dia === hoje && 'font-bold text-blue-700')}>
                  {format(data, 'd')}
                </span>
                {numero > 0 && (
                  <span
                    className={cn(
                      'self-center text-sm sm:text-base font-semibold',
                      foraDoMes ? 'text-slate-400' : 'text-blue-700',
                    )}
                  >
                    ( {numero} )
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-800">Lista</h2>
        <div className="flex items-center border rounded-md p-1 bg-slate-100">
          {(['proximos', 'hoje', 'todos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPeriodo(f)}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                periodo === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
              )}
            >
              {f === 'proximos' ? 'Próximos' : f === 'hoje' ? 'Hoje' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
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
            {!loading && daLista.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Nenhum agendamento aqui.
                  {periodo !== 'todos' && ' Passados e cancelados aparecem em "Todos".'}
                </TableCell>
              </TableRow>
            )}
            {daLista.map((a) => (
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
                  <AcoesAgendamento
                    status={a.status}
                    desabilitado={atualizando === a.id}
                    onMudar={(status) => atualizarStatus(a.id, status)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AgendamentosDoDia
        dia={diaAberto}
        agendamentos={diaAberto ? (porDia.get(diaAberto) ?? []) : []}
        atualizandoId={atualizando}
        onFechar={() => setDiaAberto(null)}
        onMudarStatus={atualizarStatus}
      />
    </div>
  )
}
