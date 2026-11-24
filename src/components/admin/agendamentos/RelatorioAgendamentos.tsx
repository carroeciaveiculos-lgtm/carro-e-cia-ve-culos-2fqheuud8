import { useMemo } from 'react'
import { format, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { downloadBlob } from '@/utils/downloadFile'
import {
  type Agendamento,
  STATUS_LABEL,
  diaDoAgendamento,
  horaDoAgendamento,
  resumirAgendamentos,
} from '@/services/agendamentos'

// Relatório de agendamentos (A3, 24/11/2026). Usa o MÊS mostrado no
// calendário e os MESMOS filtros da tela (status, tipo, veículo, origem) —
// quem muda o mês ou o filtro lá em cima muda o relatório junto.
// Regra de contagem: ver resumirAgendamentos em services/agendamentos.ts.

type Props = {
  mes: Date
  agendamentos: Agendamento[]
}

const CORES = {
  visitas: '#16a34a',
  naoVieram: '#dc2626',
  cancelados: '#94a3b8',
  agendados: '#2563eb',
}

function Cartao({
  titulo,
  valor,
  detalhe,
  cor,
}: {
  titulo: string
  valor: string | number
  detalhe?: string
  cor: string
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-500">{titulo}</div>
      <div className="text-2xl font-bold" style={{ color: cor }}>
        {valor}
      </div>
      {detalhe && <div className="text-[11px] text-slate-400 leading-tight">{detalhe}</div>}
    </div>
  )
}

const celulaCsv = (valor: string) => `"${valor.replace(/"/g, '""')}"`

export function RelatorioAgendamentos({ mes, agendamentos }: Props) {
  const chaveMes = format(mes, 'yyyy-MM')

  const doMes = useMemo(
    () => agendamentos.filter((a) => diaDoAgendamento(a.data_hora).startsWith(chaveMes)),
    [agendamentos, chaveMes],
  )

  const resumo = useMemo(() => resumirAgendamentos(doMes), [doMes])

  // Agrupa por semana (começando no domingo, como o calendário).
  const porSemana = useMemo(() => {
    const mapa = new Map<
      string,
      { semana: string; visitas: number; naoVieram: number; cancelados: number; agendados: number }
    >()
    for (const a of doMes) {
      const inicio = format(startOfWeek(parseISO(diaDoAgendamento(a.data_hora))), 'yyyy-MM-dd')
      const linha = mapa.get(inicio) ?? {
        semana: `Sem. ${format(parseISO(inicio), 'dd/MM')}`,
        visitas: 0,
        naoVieram: 0,
        cancelados: 0,
        agendados: 0,
      }
      if (a.status === 'realizado') linha.visitas++
      else if (a.status === 'nao_compareceu') linha.naoVieram++
      else if (a.status === 'cancelado') linha.cancelados++
      else linha.agendados++
      mapa.set(inicio, linha)
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  }, [doMes])

  const exportarCsv = () => {
    const cabecalho = ['Data', 'Hora', 'Cliente', 'Veículo', 'Tipo', 'Origem', 'Status']
    const linhas = [...doMes]
      .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
      .map((a) =>
        [
          format(parseISO(diaDoAgendamento(a.data_hora)), 'dd/MM/yyyy'),
          horaDoAgendamento(a.data_hora),
          a.leads?.nome || 'Sem nome',
          a.veiculos ? `${a.veiculos.marca ?? ''} ${a.veiculos.modelo ?? ''}`.trim() : '',
          a.tipo ?? '',
          a.leads?.origem ?? '',
          STATUS_LABEL[a.status] || a.status,
        ]
          .map(celulaCsv)
          .join(';'),
      )
    // BOM + ";" pro Excel em português abrir com acentos e colunas certas.
    const conteudo = '﻿' + [cabecalho.map(celulaCsv).join(';'), ...linhas].join('\r\n')
    downloadBlob(
      new Blob([conteudo], { type: 'text/csv;charset=utf-8' }),
      `agendamentos_${chaveMes}.csv`,
    )
  }

  const nomeMes = format(mes, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="bg-slate-50 rounded-lg border p-3 sm:p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          Relatório de <span className="capitalize">{nomeMes}</span>
          <span className="ml-2 text-xs font-normal text-slate-500">
            {resumo.total} agendamento{resumo.total === 1 ? '' : 's'} no mês
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="bg-white"
          onClick={exportarCsv}
          disabled={doMes.length === 0}
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <Cartao
          titulo="Visitas (vieram)"
          valor={resumo.visitas}
          detalhe="Marcados como Compareceu"
          cor={CORES.visitas}
        />
        <Cartao titulo="Não vieram" valor={resumo.naoVieram} cor={CORES.naoVieram} />
        <Cartao
          titulo="Cancelados / remarcados"
          valor={resumo.cancelados}
          detalhe="Remarcar não conta como 2 visitas"
          cor={CORES.cancelados}
        />
        <Cartao
          titulo="Ainda agendados"
          valor={resumo.aindaAgendados}
          detalhe={
            resumo.semResultado > 0
              ? `${resumo.semResultado} já passaram sem resultado marcado`
              : undefined
          }
          cor={CORES.agendados}
        />
        <Cartao
          titulo="Taxa de comparecimento"
          valor={resumo.taxaComparecimento === null ? '—' : `${resumo.taxaComparecimento}%`}
          detalhe="Vieram ÷ (vieram + não vieram)"
          cor="#0f172a"
        />
      </div>

      {porSemana.length > 0 ? (
        <ChartContainer
          config={{
            visitas: { label: 'Vieram', color: CORES.visitas },
            naoVieram: { label: 'Não vieram', color: CORES.naoVieram },
            cancelados: { label: 'Cancelados', color: CORES.cancelados },
            agendados: { label: 'Agendados', color: CORES.agendados },
          }}
          className="h-[220px] w-full bg-white rounded-md border p-2"
        >
          <BarChart data={porSemana} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="semana" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="visitas" stackId="s" fill="var(--color-visitas)" />
            <Bar dataKey="naoVieram" stackId="s" fill="var(--color-naoVieram)" />
            <Bar dataKey="cancelados" stackId="s" fill="var(--color-cancelados)" />
            <Bar
              dataKey="agendados"
              stackId="s"
              fill="var(--color-agendados)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">
          Nenhum agendamento neste mês com os filtros escolhidos.
        </p>
      )}
    </div>
  )
}
