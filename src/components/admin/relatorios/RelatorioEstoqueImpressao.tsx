import { createPortal } from 'react-dom'
import { BRAND } from '@/lib/brand'

// Folha de impressão do Relatório de Estoque (09/11/2026, pedido da Adriana): A4 vertical,
// cabeçalho com logo, data/hora da impressão e uma linha por veículo.
// A folha vive num portal direto no <body>; na tela fica escondida e, ao imprimir, o CSS
// esconde todo o resto do painel (menu, filtros...) e mostra só ela.
// REGRA (Adriana): só o preço de VENDA pode aparecer. Nunca incluir preço de compra, preço
// mínimo, preço de revenda ("De") nem valor FIPE — por isso nem são lidos do banco.

export interface LinhaRelatorio {
  id: string
  marca: string | null
  modelo: string | null
  versao: string | null
  ano_fabricacao: number | null
  ano_modelo: number | null
  placa: string | null
  quilometragem: number | null
  cor: string | null
  combustivel: string | null
  cambio: string | null
  preco_venda: number | null
  is_zero_km: boolean | null
  status: string | null
  dias: number
}

export type ColunaId =
  | 'ano'
  | 'placa'
  | 'km'
  | 'cor'
  | 'combustivel'
  | 'cambio'
  | 'preco'
  | 'dias'
  | 'situacao'

const STATUS_ROTULO: Record<string, string> = {
  disponivel: 'Ativo',
  vendido: 'Vendido',
  devolvido: 'Devolvido',
  em_preparacao: 'Em preparação',
  rascunho: 'Rascunho',
}

const moeda = (n: number | null) =>
  n ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n) : '—'

interface DefColuna {
  id: ColunaId
  rotulo: string
  largura: number // mm, quando há espaço
  densa: number // mm, no modo compacto (muitas colunas)
  dir?: boolean
  valor: (v: LinhaRelatorio) => string
}

// Ordem aqui = ordem das colunas na folha
export const COLUNAS: DefColuna[] = [
  {
    id: 'ano',
    rotulo: 'Ano',
    largura: 20,
    densa: 15,
    valor: (v) =>
      v.ano_fabricacao && v.ano_modelo && v.ano_fabricacao !== v.ano_modelo
        ? `${v.ano_fabricacao}/${v.ano_modelo}`
        : String(v.ano_modelo || v.ano_fabricacao || '—'),
  },
  { id: 'placa', rotulo: 'Placa', largura: 18, densa: 14, valor: (v) => v.placa || '—' },
  {
    id: 'km',
    rotulo: 'Km',
    largura: 20,
    densa: 13,
    dir: true,
    valor: (v) =>
      v.is_zero_km
        ? 'Zero km'
        : v.quilometragem != null
          ? new Intl.NumberFormat('pt-BR').format(v.quilometragem)
          : '—',
  },
  { id: 'cor', rotulo: 'Cor', largura: 28, densa: 19, valor: (v) => v.cor || '—' },
  {
    id: 'combustivel',
    rotulo: 'Combustível',
    largura: 24,
    densa: 17,
    valor: (v) => v.combustivel || '—',
  },
  { id: 'cambio', rotulo: 'Câmbio', largura: 24, densa: 17, valor: (v) => v.cambio || '—' },
  {
    id: 'situacao',
    rotulo: 'Situação',
    largura: 22,
    densa: 15,
    valor: (v) => STATUS_ROTULO[v.status || ''] || v.status || '—',
  },
  {
    id: 'preco',
    rotulo: 'Preço de venda',
    largura: 33,
    densa: 22,
    dir: true,
    valor: (v) => moeda(v.preco_venda),
  },
  { id: 'dias', rotulo: 'Dias', largura: 12, densa: 9, dir: true, valor: (v) => String(v.dias) },
]

export const ROTULO_COLUNA: Record<string, string> = {
  ano: 'Ano',
  placa: 'Placa',
  km: 'Km',
  cor: 'Cor',
  combustivel: 'Combustível',
  cambio: 'Câmbio',
  preco: 'Preço de venda',
  dias: 'Dias em estoque',
}

const LARGURA_UTIL = 186 // A4 (210mm) menos 2 x 12mm de margem
const LARGURA_MIN_VEICULO = 55 // abaixo disso o nome do veículo fica espremido: entra o modo compacto
const LARGURA_MIN_VEICULO_DENSO = 40

interface Props {
  linhas: LinhaRelatorio[]
  colunas: ColunaId[]
  filtros: string
  impressoEm: Date
}

const dataHora = (d: Date) =>
  `${d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${d.toLocaleTimeString(
    'pt-BR',
    { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' },
  )}`

export const CSS_IMPRESSAO = `
@page { size: A4 portrait; margin: 12mm; }
#relatorio-impressao-root { display: none; }
@media print {
  body > *:not(#relatorio-impressao-root) { display: none !important; }
  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  #relatorio-impressao-root { display: block !important; }
}
#relatorio-impressao { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 8.5pt; }
#relatorio-impressao .cab { display: flex; align-items: center; justify-content: space-between;
  border-bottom: 0.6mm solid #b91c1c; padding-bottom: 3mm; margin-bottom: 3mm; }
#relatorio-impressao .cab img { height: 14mm; width: auto; }
#relatorio-impressao .cab .tit { text-align: right; }
#relatorio-impressao .cab h1 { margin: 0; font-size: 14pt; text-transform: uppercase; }
#relatorio-impressao .cab p { margin: 0.8mm 0 0; font-size: 8pt; color: #444; }
#relatorio-impressao .info { display: flex; justify-content: space-between; gap: 6mm;
  font-size: 8pt; color: #333; margin-bottom: 3mm; }
#relatorio-impressao .info span:last-child { white-space: nowrap; }
#relatorio-impressao table { font-size: 8.5pt; width: 186mm; border-collapse: collapse;
  table-layout: fixed; }
#relatorio-impressao thead { display: table-header-group; }
#relatorio-impressao tr { page-break-inside: avoid; break-inside: avoid; }
#relatorio-impressao th { background: #1f2937; color: #fff; text-align: left; font-size: 7.5pt;
  padding: 1.6mm 1.5mm; text-transform: uppercase; }
#relatorio-impressao td { padding: 1.2mm 1.5mm; min-height: 6mm; line-height: 1.25;
  box-sizing: border-box; border-bottom: 0.2mm solid #d1d5db; white-space: normal;
  overflow-wrap: anywhere; }
#relatorio-impressao tbody tr:nth-child(even) td { background: #f3f4f6; }
#relatorio-impressao .dir { text-align: right; }
#relatorio-impressao.denso table { font-size: 7pt; }
#relatorio-impressao.denso th { font-size: 6pt; padding: 1.4mm 1mm; }
#relatorio-impressao.denso td { padding: 1mm; line-height: 1.2; }
#relatorio-impressao .tot { margin-top: 4mm; padding-top: 2mm; border-top: 0.4mm solid #111;
  display: flex; justify-content: space-between; font-weight: bold; font-size: 9pt;
  break-inside: avoid; }
`

export function RelatorioEstoqueImpressao({ linhas, colunas, filtros, impressoEm }: Props) {
  const escolhidas = COLUNAS.filter((c) => colunas.includes(c.id))
  const somaNormal = escolhidas.reduce((acc, c) => acc + c.largura, 0)
  // Muitas colunas: modo compacto (letra menor, larguras justas). Se nem assim couber, encolhe tudo.
  const denso = somaNormal > LARGURA_UTIL - LARGURA_MIN_VEICULO
  const base = escolhidas.map((c) => (denso ? c.densa : c.largura))
  const somaBase = base.reduce((a, b) => a + b, 0)
  const fator = Math.min(
    1,
    (LARGURA_UTIL - (denso ? LARGURA_MIN_VEICULO_DENSO : LARGURA_MIN_VEICULO)) / (somaBase || 1),
  )
  const larguras = base.map((l) => Math.floor(l * fator * 10) / 10)
  const larguraVeiculo = Math.round((LARGURA_UTIL - larguras.reduce((a, b) => a + b, 0)) * 10) / 10
  const mostraPreco = colunas.includes('preco')
  const valorTotal = linhas.reduce((acc, v) => acc + (v.preco_venda || 0), 0)

  return createPortal(
    <div id="relatorio-impressao-root">
      <style>{CSS_IMPRESSAO}</style>
      <div id="relatorio-impressao" className={denso ? 'denso' : undefined}>
        <div className="cab">
          <img src={BRAND.logoUrl} alt={BRAND.name} />
          <div className="tit">
            <h1>Relatório de Estoque</h1>
            <p>{BRAND.name}</p>
          </div>
        </div>
        <div className="info">
          <span>{filtros}</span>
          <span>Impresso em {dataHora(impressoEm)}</span>
        </div>
        <table>
          <colgroup>
            <col style={{ width: `${larguraVeiculo}mm` }} />
            {larguras.map((l, i) => (
              <col key={escolhidas[i].id} style={{ width: `${l}mm` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>Veículo</th>
              {escolhidas.map((c) => (
                <th key={c.id} className={c.dir ? 'dir' : undefined}>
                  {c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((v) => (
              <tr key={v.id}>
                <td>{[v.marca, v.modelo, v.versao].filter(Boolean).join(' ')}</td>
                {escolhidas.map((c) => (
                  <td key={c.id} className={c.dir ? 'dir' : undefined}>
                    {c.valor(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tot">
          <span>
            {linhas.length} {linhas.length === 1 ? 'veículo' : 'veículos'}
          </span>
          {mostraPreco && <span>Soma dos preços de venda: {moeda(valorTotal)}</span>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
