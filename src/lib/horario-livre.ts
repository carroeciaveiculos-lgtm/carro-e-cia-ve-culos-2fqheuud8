// Próximo horário livre para publicar um post aprovado (05/10/2026).
// Regra: até `porDia` posts por dia, por rede, nos horários configurados (horário de Brasília, UTC-3,
// sem horário de verão desde 2019). Aprovar não publica na hora: o post entra no próximo horário que
// estiver livre em TODAS as redes do post, para o feed não ser inundado quando vários são aprovados.

const MARGEM_SLOT_MS = 45 * 60_000 // post a menos de 45 min de um horário "ocupa" esse horário
const FOLGA_MINIMA_MS = 2 * 60_000 // o horário precisa estar pelo menos 2 min no futuro

const fmtDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// 'YYYY-MM-DD' do dia, em Brasília
export const diaEmBrasilia = (d: Date): string => fmtDia.format(d)

export const interpretarHorarios = (texto: string): string[] => {
  const horarios = texto
    .split(',')
    .map((h) => h.trim())
    .filter((h) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(h))
    .map((h) => h.padStart(5, '0'))
  return Array.from(new Set(horarios)).sort()
}

type Entrada = {
  agora: Date
  horarios: string // "10:00,18:00"
  porDia: number
  ocupadosPorRede: Date[][] // para cada rede do post, quando já há post agendado/publicado
  maxDias?: number
}

export function proximoHorarioLivre({
  agora,
  horarios,
  porDia,
  ocupadosPorRede,
  maxDias = 30,
}: Entrada): Date {
  const lista = interpretarHorarios(horarios)
  const slots = lista.length > 0 ? lista : ['10:00', '18:00']
  const hoje = diaEmBrasilia(agora)

  for (let i = 0; i < maxDias; i++) {
    // dia i a partir de hoje (meio-dia UTC evita virar o dia por causa do fuso)
    const base = new Date(`${hoje}T12:00:00Z`)
    base.setUTCDate(base.getUTCDate() + i)
    const dia = base.toISOString().slice(0, 10)

    for (const hhmm of slots) {
      const slot = new Date(`${dia}T${hhmm}:00-03:00`)
      if (slot.getTime() < agora.getTime() + FOLGA_MINIMA_MS) continue
      const livreEmTodas = ocupadosPorRede.every((ocupados) => {
        const doDia = ocupados.filter((o) => diaEmBrasilia(o) === dia)
        if (doDia.length >= porDia) return false
        return !doDia.some((o) => Math.abs(o.getTime() - slot.getTime()) < MARGEM_SLOT_MS)
      })
      if (livreEmTodas) return slot
    }
  }
  // Fila de 30 dias toda cheia: cai no mesmo dia seguinte ao último (não trava a aprovação)
  return new Date(agora.getTime() + 24 * 3_600_000)
}

export const formatarHorario = (d: Date): string =>
  d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
