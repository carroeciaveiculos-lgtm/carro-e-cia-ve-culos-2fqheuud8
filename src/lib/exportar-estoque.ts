// Relatório completo do estoque em CSV e XML (26/11/2026, pedido da Adriana).
// Define as colunas por bloco e monta os arquivos. A busca dos dados fica em
// src/services/relatorio-estoque.ts. O bloco "proprietario" só sai para
// admin_master e gerente (dados pessoais, LGPD) — quem decide é a tela.

export type BlocoExportacao = 'veiculo' | 'publicacao' | 'entrada' | 'proprietario'

export interface ColunaExportacao {
  bloco: BlocoExportacao
  chave: string
  rotulo: string
  // Texto que o Excel estragaria se lesse como número (zeros à esquerda, notação científica).
  texto?: boolean
}

const c = (
  bloco: BlocoExportacao,
  chave: string,
  rotulo: string,
  texto = false,
): ColunaExportacao => ({
  bloco,
  chave,
  rotulo,
  texto,
})

// Campos da tabela `veiculos`. Lista explícita de propósito: campo novo no cadastro não vaza
// para o arquivo sem alguém decidir, e os do proprietário nunca saem por engano.
export const COLUNAS_VEICULO: ColunaExportacao[] = [
  c('veiculo', 'id', 'ID do veículo'),
  c('veiculo', 'status', 'Status'),
  c('veiculo', 'placa', 'Placa', true),
  c('veiculo', 'final_placa', 'Final da placa', true),
  c('veiculo', 'chassi', 'Chassi', true),
  c('veiculo', 'chassi_completo', 'Chassi completo', true),
  c('veiculo', 'renavam', 'Renavam', true),
  c('veiculo', 'marca', 'Marca'),
  c('veiculo', 'modelo', 'Modelo'),
  c('veiculo', 'versao', 'Versão'),
  c('veiculo', 'ano_fabricacao', 'Ano fabricação'),
  c('veiculo', 'ano_modelo', 'Ano modelo'),
  c('veiculo', 'cor', 'Cor'),
  c('veiculo', 'quilometragem', 'Km'),
  c('veiculo', 'nao_exibir_km', 'Ocultar km no site'),
  c('veiculo', 'cambio', 'Câmbio'),
  c('veiculo', 'combustivel', 'Combustível'),
  c('veiculo', 'combustivel_sintetico', 'Combustível (padronizado)'),
  c('veiculo', 'portas', 'Portas'),
  c('veiculo', 'direcao', 'Direção'),
  c('veiculo', 'cilindrada', 'Cilindrada'),
  c('veiculo', 'categoria', 'Categoria'),
  c('veiculo', 'categoria_sintetica', 'Categoria (padronizada)'),
  c('veiculo', 'is_zero_km', '0 km'),
  c('veiculo', 'preco_venda', 'Preço de venda ("Por")'),
  c('veiculo', 'preco_revenda', 'Preço "De"'),
  c('veiculo', 'preco_minimo', 'Preço mínimo'),
  c('veiculo', 'preco_classificados', 'Preço classificados'),
  c('veiculo', 'valor_fipe', 'Valor FIPE'),
  c('veiculo', 'codigo_fipe', 'Código FIPE', true),
  c('veiculo', 'fipe_ref', 'Referência FIPE'),
  c('veiculo', 'mes_referencia', 'Mês de referência FIPE'),
  c('veiculo', 'url_fipe', 'Link FIPE'),
  c('veiculo', 'ipva_pago', 'IPVA pago'),
  c('veiculo', 'garantia', 'Garantia'),
  c('veiculo', 'laudo_cautelar', 'Laudo cautelar'),
  c('veiculo', 'unico_dono', 'Único dono'),
  c('veiculo', 'licenciado', 'Licenciado'),
  c('veiculo', 'alienado', 'Alienado'),
  c('veiculo', 'blindado', 'Blindado'),
  c('veiculo', 'garantia_fabrica', 'Garantia de fábrica'),
  c('veiculo', 'revisado_oficina', 'Revisado em oficina'),
  c('veiculo', 'revisoes_concessionaria', 'Revisões na concessionária'),
  c('veiculo', 'adaptado_deficientes', 'Adaptado PCD'),
  c('veiculo', 'wm_ipva_pago', 'Webmotors: IPVA pago'),
  c('veiculo', 'wm_licenciado', 'Webmotors: licenciado'),
  c('veiculo', 'wm_garantia_fabrica', 'Webmotors: garantia de fábrica'),
  c('veiculo', 'wm_unico_dono', 'Webmotors: único dono'),
  c('veiculo', 'wm_blindado', 'Webmotors: blindado'),
  c('veiculo', 'wm_kit_gas', 'Webmotors: kit gás'),
  c('veiculo', 'wm_adaptado_deficiente', 'Webmotors: adaptado PCD'),
  c('veiculo', 'wm_veiculo_troca', 'Webmotors: aceita troca'),
  c('veiculo', 'wm_alienado', 'Webmotors: alienado'),
  c('veiculo', 'wm_revisado_oficina', 'Webmotors: revisado em oficina'),
  c('veiculo', 'wm_revisoes_concessionaria', 'Webmotors: revisões na concessionária'),
  c('veiculo', 'diferenciais', 'Diferenciais'),
  c('veiculo', 'caracteristicas', 'Características'),
  c('veiculo', 'info_personalizadas', 'Informações personalizadas'),
  c('veiculo', 'descricao', 'Descrição'),
  c('veiculo', 'descricao_webmotors', 'Descrição Webmotors'),
  c('veiculo', 'mesma_obs_classificados', 'Mesma observação nos classificados'),
  c('veiculo', 'notas_internas', 'Notas internas'),
  c('veiculo', 'tag_promocional', 'Tag promocional'),
  c('veiculo', 'destaque', 'Destaque'),
  c('veiculo', 'em_preparacao', 'Em preparação'),
  c('veiculo', 'exibir_no_site', 'Exibir no site'),
  c('veiculo', 'elegivel_portais', 'Elegível para portais'),
  c('veiculo', 'requires_review', 'Precisa de revisão'),
  c('veiculo', 'ml_listing_type', 'Tipo de anúncio ML'),
  c('veiculo', 'slug', 'Endereço no site'),
  c('veiculo', 'qtd_fotos', 'Quantidade de fotos'),
  c('veiculo', 'foto_capa', 'Foto de capa'),
  c('veiculo', 'qtd_videos', 'Quantidade de vídeos'),
  c('veiculo', 'visualizacoes_site', 'Visualizações no site'),
  c('veiculo', 'cliques_whatsapp', 'Cliques no WhatsApp'),
  c('veiculo', 'data_venda', 'Data da venda (última)'),
  c('veiculo', 'data_devolucao', 'Data da devolução (última)'),
  c('veiculo', 'updated_at', 'Última atualização'),
]

export const COLUNAS_PUBLICACAO: ColunaExportacao[] = [
  c('publicacao', 'pub_webmotors', 'Webmotors (última situação)'),
  c('publicacao', 'pub_napista', 'NaPista (última situação)'),
  c('publicacao', 'pub_mercadolivre', 'Mercado Livre (última situação)'),
]

export const COLUNAS_ENTRADA: ColunaExportacao[] = [
  c('entrada', 'created_at', 'Data do cadastro'),
  c('entrada', 'entrada_estoque_em', 'Entrada no estoque (contagem atual)'),
  c('entrada', 'dias_em_estoque', 'Dias em estoque'),
  c('entrada', 'is_consignado', 'Consignado'),
  c('entrada', 'contrato_numero', 'Nº do contrato mais recente', true),
  c('entrada', 'contrato_tipo', 'Tipo do contrato (consignação/venda)'),
  c('entrada', 'contrato_assinatura_status', 'Situação da assinatura'),
  c('entrada', 'contrato_assinatura_data', 'Data da assinatura'),
  c('entrada', 'avaliacao_data', 'Data da avaliação (pela placa)'),
  c('entrada', 'avaliacao_valor_avaliado', 'Valor avaliado'),
  c('entrada', 'avaliacao_preco_consignacao', 'Preço de consignação na avaliação'),
  c('entrada', 'avaliacao_margem', 'Margem esperada'),
  c('entrada', 'avaliacao_condicao', 'Condição geral'),
]

export const COLUNAS_PROPRIETARIO: ColunaExportacao[] = [
  c('proprietario', 'proprietario_nome', 'Proprietário: nome'),
  c('proprietario', 'proprietario_cpf', 'Proprietário: CPF', true),
  c('proprietario', 'proprietario_rg', 'Proprietário: RG', true),
  c('proprietario', 'proprietario_data_nascimento', 'Proprietário: nascimento'),
  c('proprietario', 'proprietario_idade', 'Proprietário: idade'),
  c('proprietario', 'proprietario_sexo', 'Proprietário: sexo'),
  c('proprietario', 'proprietario_estado_civil', 'Proprietário: estado civil'),
  c('proprietario', 'proprietario_mae', 'Proprietário: nome da mãe'),
  c('proprietario', 'proprietario_situacao_receita', 'Proprietário: situação na Receita'),
  c(
    'proprietario',
    'proprietario_situacao_receita_data',
    'Proprietário: data da consulta na Receita',
  ),
  c('proprietario', 'proprietario_email', 'Proprietário: e-mail'),
  c('proprietario', 'proprietario_telefone', 'Proprietário: celular', true),
  c('proprietario', 'proprietario_telefone_residencial', 'Proprietário: tel. residencial', true),
  c('proprietario', 'proprietario_telefone_trabalho', 'Proprietário: tel. trabalho', true),
  c('proprietario', 'proprietario_cep', 'Proprietário: CEP', true),
  c('proprietario', 'proprietario_logradouro', 'Proprietário: logradouro'),
  c('proprietario', 'proprietario_numero', 'Proprietário: número', true),
  c('proprietario', 'proprietario_complemento', 'Proprietário: complemento'),
  c('proprietario', 'proprietario_bairro', 'Proprietário: bairro'),
  c('proprietario', 'proprietario_cidade', 'Proprietário: cidade'),
  c('proprietario', 'proprietario_estado', 'Proprietário: UF'),
]

// Colunas que vêm direto da tabela `veiculos` (as demais são calculadas no service).
const CALCULADAS = new Set(['qtd_fotos', 'foto_capa', 'qtd_videos', 'dias_em_estoque'])
export function camposVeiculosParaSelect(comProprietario: boolean): string {
  const base = [...COLUNAS_VEICULO, ...COLUNAS_ENTRADA]
    .filter(
      (col) =>
        !CALCULADAS.has(col.chave) &&
        !col.chave.startsWith('contrato_') &&
        !col.chave.startsWith('avaliacao_'),
    )
    .map((col) => col.chave)
  const extras = ['fotos', 'videos']
  const dono = comProprietario ? COLUNAS_PROPRIETARIO.map((col) => col.chave) : []
  return [...new Set([...base, ...extras, ...dono])].join(', ')
}

export function colunasDaExportacao(comProprietario: boolean): ColunaExportacao[] {
  return [
    ...COLUNAS_VEICULO,
    ...COLUNAS_PUBLICACAO,
    ...COLUNAS_ENTRADA,
    ...(comProprietario ? COLUNAS_PROPRIETARIO : []),
  ]
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const FMT_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
})

// Valor legível em português, para o CSV aberto no Excel (vírgula decimal, Sim/Não, data BR).
function valorLegivel(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (typeof valor === 'number') return String(valor).replace('.', ',')
  if (Array.isArray(valor))
    return valor.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' | ')
  if (typeof valor === 'object') return JSON.stringify(valor)
  const texto = String(valor)
  if (DATA_ISO.test(texto)) {
    const d = new Date(texto)
    if (!Number.isNaN(d.getTime())) return FMT_DATA_HORA.format(d)
  }
  return texto
}

// Valor "cru" para o XML (ponto decimal, data ISO, true/false) — melhor para outro sistema ler.
function valorCru(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (Array.isArray(valor) || typeof valor === 'object') return JSON.stringify(valor)
  return String(valor)
}

function celulaCsv(valor: unknown, texto?: boolean): string {
  let s = valorLegivel(valor).replace(/\r?\n/g, ' ')
  // ="0123" faz o Excel manter como texto (sem perder zero à esquerda nem virar 1,2E+16).
  if (texto && s) return `"=""${s.replace(/"/g, '""""')}"""`
  // Texto livre (descrição, notas) começando com = + - @ o Excel executaria como fórmula.
  if (typeof valor === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export function montarCsv(linhas: Record<string, unknown>[], colunas: ColunaExportacao[]): string {
  const cabecalho = colunas.map((col) => `"${col.rotulo.replace(/"/g, '""')}"`).join(';')
  const corpo = linhas.map((l) =>
    colunas.map((col) => celulaCsv(l[col.chave], col.texto)).join(';'),
  )
  // BOM no começo: sem ele o Excel do Windows abre os acentos quebrados.
  // (escrito como código, não como caractere colado, para não sumir num editor/formatador)
  return String.fromCharCode(0xfeff) + [cabecalho, ...corpo].join('\r\n')
}

// Caracteres de controle (exceto tab, quebra de linha e retorno) são proibidos em XML 1.0
// e quebrariam o arquivo inteiro.
function semControle(s: string): string {
  let r = ''
  for (const ch of s) {
    const cod = ch.charCodeAt(0)
    if (cod >= 32 || cod === 9 || cod === 10 || cod === 13) r += ch
  }
  return r
}

function escaparXml(s: string): string {
  return semControle(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const TAG_BLOCO: Record<BlocoExportacao, string | null> = {
  veiculo: null,
  publicacao: 'publicacao',
  entrada: 'entrada',
  proprietario: 'proprietario',
}

export function montarXml(
  linhas: Record<string, unknown>[],
  colunas: ColunaExportacao[],
  geradoEm: Date,
): string {
  const partes: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<estoque gerado_em="${geradoEm.toISOString()}" total="${linhas.length}">`,
  ]
  for (const l of linhas) {
    partes.push('  <veiculo>')
    for (const bloco of ['veiculo', 'publicacao', 'entrada', 'proprietario'] as BlocoExportacao[]) {
      const doBloco = colunas.filter((col) => col.bloco === bloco)
      if (!doBloco.length) continue
      const tag = TAG_BLOCO[bloco]
      const recuo = tag ? '      ' : '    '
      if (tag) partes.push(`    <${tag}>`)
      for (const col of doBloco) {
        partes.push(`${recuo}<${col.chave}>${escaparXml(valorCru(l[col.chave]))}</${col.chave}>`)
      }
      if (tag) partes.push(`    </${tag}>`)
    }
    partes.push('  </veiculo>')
  }
  partes.push('</estoque>')
  return partes.join('\n')
}
