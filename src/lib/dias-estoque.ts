// Contador de dias do estoque. Regras da Adriana (27/11/2026):
//   * a contagem começa em veiculos.entrada_estoque_em (= cadastro; RECOMEÇA DO ZERO quando o carro volta ao
//     estoque depois de vendido/devolvido — o banco grava isso sozinho, gatilho registrar_datas_status);
//   * vendido → dias da entrada até data_venda (para de contar); devolvido → até data_devolucao;
//   * sem a data de saída (vendas anteriores a 28/09/2026, devoluções anteriores a 27/11/2026) → null ("—");
//   * demais status → da entrada até hoje.
// Sem entrada_estoque_em (antes da migration de 27/11/2026) usa created_at.

const DIA_MS = 24 * 60 * 60 * 1000

type VeiculoDias = {
  created_at?: string | null
  entrada_estoque_em?: string | null
  status?: string | null
  data_venda?: string | null
  data_devolucao?: string | null
}

// created_at é "timestamp without time zone" gravado em UTC e chega sem fuso
// ("2026-11-17T12:00:00"); o navegador leria como horário local (Brasília, -3 h). Sem fuso = UTC.
function instante(valor: string): number {
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(valor.trim())
  return new Date(temFuso ? valor : `${valor.trim().replace(' ', 'T')}Z`).getTime()
}

export function diasEmEstoque(v: VeiculoDias, agora: Date = new Date()): number | null {
  const entrada = v.entrada_estoque_em || v.created_at
  if (!entrada) return null
  const inicio = instante(entrada)
  if (Number.isNaN(inicio)) return null

  const saiu = v.status === 'vendido' || v.status === 'devolvido'
  if (!saiu) return Math.max(0, Math.floor((agora.getTime() - inicio) / DIA_MS))
  // Campo ausente ou vazio = data de saída desconhecida → "—" (nunca conta até hoje).
  const saida = v.status === 'vendido' ? v.data_venda : v.data_devolucao
  if (!saida) return null
  const fim = instante(saida)
  // Data de saída anterior à entrada atual = sobra de um ciclo antigo (não deveria acontecer): não arrisca número.
  if (Number.isNaN(fim) || fim < inicio) return null
  return Math.floor((fim - inicio) / DIA_MS)
}

export const textoDias = (dias: number | null) => (dias === null ? '—' : String(dias))

// Rótulo curto para a lista do Estoque.
export function rotuloDias(status: string | null | undefined, dias: number | null): string {
  const n = dias === null ? '—' : `${dias} ${dias === 1 ? 'dia' : 'dias'}`
  if (status === 'vendido') return dias === null ? '—' : `Vendeu em ${n}`
  if (status === 'devolvido') return dias === null ? '—' : `Devolvido em ${n}`
  return n
}
