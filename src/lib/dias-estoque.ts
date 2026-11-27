// Contador de dias do estoque (27/11/2026, autorizado pela Adriana). Antes havia duas cópias da conta
// (Estoque.tsx e RelatorioEstoque.tsx) e o carro VENDIDO continuava contando até hoje — a aba Vendidos
// mostrava "dias desde o cadastro", não "quanto tempo levou para vender", e inflava a média do relatório.
// Regra:
//   * vendido com data de venda → dias do cadastro até a venda (fica parado nesse número);
//   * vendido SEM data de venda → null (mostrar "—"; não dá para saber; 18 de 30 vendidos em 27/11/2026);
//   * demais status → dias do cadastro até hoje.
// "Cadastro" = veiculos.created_at (data em que a ficha foi criada, não a chegada física do carro).

const DIA_MS = 24 * 60 * 60 * 1000

type VeiculoDias = {
  created_at?: string | null
  status?: string | null
  data_venda?: string | null
}

// veiculos.created_at é "timestamp without time zone" gravado em UTC e chega sem fuso
// ("2026-11-17T12:00:00"); o navegador leria como horário local (Brasília, -3 h). Sem fuso = UTC.
function instante(valor: string): number {
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(valor.trim())
  return new Date(temFuso ? valor : `${valor.trim().replace(' ', 'T')}Z`).getTime()
}

export function diasEmEstoque(v: VeiculoDias, agora: Date = new Date()): number | null {
  if (!v.created_at) return null
  const inicio = instante(v.created_at)
  if (Number.isNaN(inicio)) return null
  if (v.status === 'vendido') {
    if (!v.data_venda) return null
    const fim = instante(v.data_venda)
    if (Number.isNaN(fim)) return null
    return Math.max(0, Math.floor((fim - inicio) / DIA_MS))
  }
  return Math.max(0, Math.floor((agora.getTime() - inicio) / DIA_MS))
}

export const textoDias = (dias: number | null) => (dias === null ? '—' : String(dias))
