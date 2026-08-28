export interface WMCredentials {
  email: string
  senha: string
  cnpj: string
}

export interface SOAPResult {
  success: boolean
  error?: string
  codigoAnuncio?: string
  hashAutenticacao?: string
  networkError?: boolean
  codigoRetorno?: string
  raw?: string
}

export interface MapeamentoWM {
  codigo_marca_wm: string
  codigo_modelo_wm: string
  codigo_versao_wm: string
  codigo_cor_wm: string
  codigo_combustivel_wm: string
  codigo_cambio_wm: string
  codigo_modalidade_wm: string
  descricao_cor: string
  descricao_cambio: string
  descricao_combustivel: string
  // Ano especifico que o CATALOGO da Webmotors espera pra essa CodigoVersao
  // (nem sempre igual ao ano_modelo real do carro no nosso cadastro) --
  // nunca sobrescreve veiculo.ano_modelo, so o que e enviado no XML.
  ano_modelo_override_wm?: number | null
}

// --- Endpoints Webmotors ---
// Fonte homologação: documento "Credenciais, IDs e Configurações — Projeto
// Revenda" (03/08/2026). Fonte produção: collection Postman oficial (ver
// docs/webmotors-integracao.md) — só o endpoint de estoque foi confirmado
// por lá; o de autenticação segue o mesmo padrão (troca hportal.../
// IntegracaoRevendedor/ por integracao...), não confirmado por documento
// oficial ainda.
//
// Achado em auditoria (13/08/2026): o secret WM_AMBIENTE já existe desde
// 29/07/2026, mas nenhum código nunca leu ele — os endpoints ficavam sempre
// fixos em homologação. É provável que isso explique o erro 401/CodigoRetorno
// 400 de 12/08/2026 (credenciais de produção trocadas, mas batendo no
// servidor de homologação). Definir WM_AMBIENTE=producao pra usar os
// endpoints reais.
const WM_AMBIENTE = Deno.env.get('WM_AMBIENTE') || 'homologacao'
const WM_AUTH_URL =
  WM_AMBIENTE === 'producao'
    ? 'https://integracao.webmotors.com.br/wsLoginSistemaRevendedor.asmx'
    : 'https://hportal.webmotors.com.br/IntegracaoRevendedor/wsLoginSistemaRevendedor.asmx'
const WM_ESTOQUE_URL =
  WM_AMBIENTE === 'producao'
    ? 'https://integracao.webmotors.com.br/wsEstoqueRevendedorWebMotors.asmx'
    : 'https://hportal.webmotors.com.br/IntegracaoRevendedor/wsEstoqueRevendedorWebMotors.asmx'

// Namespaces SOAP
const WM_AUTH_NAMESPACE = 'www.webmotors.com.br/wsLoginSistemaRevendedor'
// Confirmado via test-estoque.json real (equipe): namespace do serviço de estoque
// no hportal é wsEstoqueRevendedorWebMotors, não wsEstoqueRevendedor
const WM_ESTOQUE_NAMESPACE = 'www.webmotors.com.br/wsEstoqueRevendedorWebMotors'

// --- Proxy de saída (IP fixo liberado pela Webmotors) ---
const WM_PROXY_URL = Deno.env.get('WM_PROXY_URL') || ''

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]*)</(?:\\w+:)?${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function wrapSOAP(namespace: string, action: string, innerXml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="${namespace}">
      ${innerXml}
    </${action}>
  </soap:Body>
</soap:Envelope>`
}

// Ordem das tags segue o WSDL: cnpj, email, senha (tags fora de ordem = erro 504)
export function buildAuthXML(creds: WMCredentials): string {
  const innerXml = `
      <cnpj>${creds.cnpj}</cnpj>
      <email>${creds.email}</email>
      <senha>${creds.senha}</senha>`
  return wrapSOAP(WM_AUTH_NAMESPACE, 'autenticar', innerXml)
}

export function snField(value: any, fallback: 'S' | 'N' = 'N'): string {
  if (typeof value === 'boolean') return value ? 'S' : 'N'
  if (typeof value === 'string' && (value.toUpperCase() === 'S' || value.toUpperCase() === 'N')) {
    return value.toUpperCase()
  }
  return fallback
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Nomes de tag e ordem — histórico de teste real em 07/08/2026:
// 1ª rodada (nomes 100% do manual AnuncioWM.html + reordenação): resolveu o
// erro de Cor (43|22), mas quebrou Combustível (43|30, antes OK) e
// RevisadoOficinaAgendaDoCarro (43|52, antes OK) — o esquema de ENTRADA do
// IncluirCarro não é idêntico ao esquema de SAÍDA documentado nessas páginas
// (que é o do ObterEstoqueAtual).
// 2ª rodada (revertido Combustível e o "typo"; mantido CorExterna/PrecoRevenda
// + a ordem do manual): zero erros de validação (CodigoRetorno vazio), mas
// CodigoAnuncio continuou 0.
// 3ª rodada: tentativa de seguir a collection Postman oficial à risca
// (CodigoCor/DescricaoCor, PrecoReal, ordem "clássica" do código antigo) —
// **trouxe de volta o 22|78 exatamente como antes.** Confirma que a collection
// não bate com o comportamento real deste ambiente — a config da 2ª rodada
// é a única que zerou os erros de validação até agora.
// 4ª rodada (esta): volta pra config da 2ª rodada e só ACRESCENTA, no final,
// as 4 tags vazias que a collection tinha (DataInclusao/DataUltimaAlteracao/
// Opcional/CodigoRetorno) — isolando se isso afeta o CodigoAnuncio=0.
//
// 5ª rodada (10/08/2026) — ATENÇÃO: as conclusões das rodadas 1 a 4 acima estão
// PARCIALMENTE INVALIDADAS. Gabriel Moreira da Silva (suporte Webmotors) confirmou
// que 22|78 significa "PrecoReal (De) deve ser maior que PrecoVenda (Por)" — regra
// de preço, não de cor. As rodadas que "trouxeram de volta o 22|78" ao usar
// DescricaoCor o fizeram porque mandavam PrecoReal IGUAL ao PrecoVenda ao mesmo
// tempo. O nome do campo de cor nunca foi o problema.
//
// A resposta do IncluirCarro ecoa o que foi recebido, e isso decidiu o schema de
// entrada de uma vez: com <CorExterna> e <Cambio> a resposta voltava
// DescricaoCor vazia, CodigoCambio 0 e DescricaoCambio vazia, enquanto o par
// <CodigoCombustivel>+<DescricaoCombustivel> voltava intacto. Ou seja: a API quer
// pares Codigo*/Descricao*, e ignora CorExterna/Cambio (que são nomes do schema
// de SAÍDA). Daí a troca para CodigoCambio+DescricaoCambio e CodigoCor+DescricaoCor.
//
// Pendência conhecida: nenhuma página consultada até agora fala em
// CodigoVersaoAno como parte do request real (só apareceu na tabela do
// AnuncioWM.html, que já se mostrou não confiável para o schema de entrada).
export function buildAnuncioXML(
  veiculo: any,
  mapa: MapeamentoWM,
  codigoAnuncio: string | number = 0,
  codigosOpcionais: string[] = [],
): string {
  const precoVenda = Number(veiculo.preco_venda) || 0
  const precoRevendaBruto = Number(veiculo.preco_revenda) || 0
  // Webmotors exige PrecoReal ("De") ESTRITAMENTE maior que PrecoVenda
  // ("Por") — CodigoRetorno 22|78 quando não é (confirmado com o suporte
  // Webmotors, 10/08/2026). Achado em auditoria (13/08/2026): 21 dos 27
  // veículos disponíveis têm preco_revenda (hoje espelhando a FIPE) menor ou
  // igual ao preço de venda — não existe um "De" honesto pra eles. Decisão da
  // Adriana: nesses casos, não inventar um valor — omite a tag em vez de
  // mandar De == Por ou De < Por. Testando se a Webmotors aceita sem ela.
  const temPrecoRealValido = precoRevendaBruto > precoVenda
  const precoRealTag = temPrecoRealValido
    ? `\n      <PrecoReal>${precoRevendaBruto.toFixed(2)}</PrecoReal>`
    : ''
  // Corte de 500 caracteres na Observacao removido (26/08/2026, achado real,
  // pedido da Adriana): não existia nenhum limite confirmado da Webmotors —
  // testado ao vivo com AlterarCarro mandando 1104 caracteres, a resposta
  // ecoou o texto completo sem reclamar. Era só uma trava nossa sem
  // necessidade, que vinha cortando a descrição de 17 dos veículos
  // publicados no meio da frase.
  return `
      <CodigoAnuncio>${codigoAnuncio}</CodigoAnuncio>
      <CodigoMarca>${mapa.codigo_marca_wm}</CodigoMarca>
      <CodigoModelo>${mapa.codigo_modelo_wm}</CodigoModelo>
      <CodigoVersao>${mapa.codigo_versao_wm}</CodigoVersao>
      <AnoDoModelo>${mapa.ano_modelo_override_wm ?? veiculo.ano_modelo ?? 0}</AnoDoModelo>
      <NrPortas>${veiculo.portas || 4}</NrPortas>
      <CodigoCombustivel>${mapa.codigo_combustivel_wm}</CodigoCombustivel>
      <DescricaoCombustivel>${escapeXml(mapa.descricao_combustivel)}</DescricaoCombustivel>
      <AdaptadoDeficientesFisicos>${snField(veiculo.adaptado_deficientes)}</AdaptadoDeficientesFisicos>
      <Alienado>${snField(veiculo.alienado)}</Alienado>
      <AnoFabricacao>${veiculo.ano_fabricacao || 0}</AnoFabricacao>
      <Blindado>${snField(veiculo.blindado)}</Blindado>
      <CodigoCambio>${mapa.codigo_cambio_wm}</CodigoCambio>
      <DescricaoCambio>${escapeXml(mapa.descricao_cambio)}</DescricaoCambio>
      <CodigoModalidade>${mapa.codigo_modalidade_wm}</CodigoModalidade>
      <CodigoCor>${mapa.codigo_cor_wm}</CodigoCor>
      <DescricaoCor>${escapeXml(mapa.descricao_cor)}</DescricaoCor>
      <GarantiaDeFabrica>${snField(veiculo.garantia_fabrica)}</GarantiaDeFabrica>
      <IpvaPago>${snField(veiculo.ipva_pago)}</IpvaPago>
      <Km>${veiculo.quilometragem || 0}</Km>
      <Licenciado>${snField(veiculo.licenciado, 'S')}</Licenciado>
      <Observacao>${escapeXml(veiculo.descricao || '')}</Observacao>
      <Placa>${escapeXml(veiculo.placa || '')}</Placa>${precoRealTag}
      <PrecoVenda>${precoVenda.toFixed(2)}</PrecoVenda>
      <RevisadoOficinaAgendaDoCarro>${snField(veiculo.revisado_oficina)}</RevisadoOficinaAgendaDoCarro>
      <RevisoesEmConcessionaria>${snField(veiculo.revisoes_concessionaria)}</RevisoesEmConcessionaria>
      <TipoAnuncio>U</TipoAnuncio>
      <UnicoDono>${snField(veiculo.unico_dono)}</UnicoDono>
      <Leilao>N</Leilao>
      <DataInclusao></DataInclusao>
      <DataUltimaAlteracao></DataUltimaAlteracao>${buildOpcionalTag(codigosOpcionais)}
      <CodigoRetorno></CodigoRetorno>`
}

export function buildIncluirCarroXML(
  veiculo: any,
  hash: string,
  mapa: MapeamentoWM,
  codigosOpcionais: string[] = [],
): string {
  const anuncioXml = buildAnuncioXML(veiculo, mapa, 0, codigosOpcionais)
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pAnuncio>${anuncioXml}
      </pAnuncio>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'IncluirCarro', innerXml)
}

export function buildAlterarCarroXML(
  veiculo: any,
  hash: string,
  mapa: MapeamentoWM,
  codigoAnuncio: string,
  codigosOpcionais: string[] = [],
): string {
  const anuncioXml = buildAnuncioXML(veiculo, mapa, codigoAnuncio, codigosOpcionais)
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pAnuncio>${anuncioXml}
      </pAnuncio>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'AlterarCarro', innerXml)
}

// TrocarModalidadeCarro -- operacao dedicada do manual oficial pra mudar a
// modalidade de um anuncio JA existente (pedido da Adriana, 28/08/2026).
// Diferente de AlterarCarro (que reenvia o anuncio inteiro e cujo suporte
// real a mudanca de CodigoModalidade nunca foi confirmado), essa e' a
// chamada que o manual documenta especificamente pra isso.
export function buildTrocarModalidadeXML(
  hash: string,
  codigoAnuncio: string,
  codigoModalidade: string,
): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pCodigoAnuncio>${codigoAnuncio}</pCodigoAnuncio>
      <pCodigoModalidade>${codigoModalidade}</pCodigoModalidade>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'TrocarModalidadeCarro', innerXml)
}

export function buildExcluirCarroXML(hash: string, codigoAnuncio: string): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pCodigoAnuncio>${codigoAnuncio}</pCodigoAnuncio>
      <pMotivoExclusao>1</pMotivoExclusao>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'ExcluirCarro', innerXml)
}

// VERIFICADO AO VIVO em 12/08/2026 via wm-catalog-fetch (catalogo=estoque_atual)
// contra a homologação: chamada com só pHashAutenticacao funciona e devolve o
// estoque publicado de verdade (49 anúncios no teste). Implementado pra
// checagem de duplicidade antes de publicar (ver docs/webmotors-integracao.md).
export function buildObterEstoqueAtualXML(hash: string): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'ObterEstoqueAtual', innerXml)
}

export interface AnuncioWMResumo {
  codigoAnuncio: string
  placa: string
}

// Corrigido em 12/08/2026: o item real vem como <Anuncio>, não <AnuncioWM> —
// o mesmo risco de <Versao> vs <VersaoWM> já visto no ObterVersao, confirmado
// ao vivo com wm-catalog-fetch (49 × <Anuncio>, 0 × <AnuncioWM> na resposta
// real). Com o nome errado, a lista sempre voltava vazia e a checagem de
// duplicidade nunca disparava, silenciosamente. Parser continua tolerante: se
// o item vier com nome de tag diferente do esperado, devolve lista vazia em
// vez de quebrar — quem chama trata lista vazia como "não deu pra confirmar",
// nunca como "confirmado sem duplicata".
export function parseEstoqueAtual(xml: string): AnuncioWMResumo[] {
  const itens: AnuncioWMResumo[] = []
  const regex = /<(?:\w+:)?Anuncio>([\s\S]*?)<\/(?:\w+:)?Anuncio>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    const inner = match[1]
    const codigoAnuncio = extractTag(inner, 'CodigoAnuncio')
    const placa = extractTag(inner, 'Placa')
    if (codigoAnuncio && placa) {
      itens.push({ codigoAnuncio, placa: placa.toUpperCase().replace(/[^A-Z0-9]/g, '') })
    }
  }
  return itens
}

// Achado em auditoria (13/08/2026): CodigoModalidade difere entre
// homologação (2943) e produção (6351 pro CNPJ real) — e cada modalidade tem
// cota própria (QuantidadeAnunciosTotal/QuantidadeAnuncios). Usado tanto pra
// atualizar o catálogo (wm-catalog-fetch) quanto como trava antes de publicar
// (wm-sync), pra não gastar chamada tentando IncluirCarro sem vaga.
export function buildObterModalidadeXML(hash: string): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'ObterModalidade', innerXml)
}

export interface ModalidadeWM {
  codigoModalidade: string
  descricao: string
  quantidadeTotal: number
  quantidadeUsados: number
}

export function parseModalidades(xml: string): ModalidadeWM[] {
  const itens: ModalidadeWM[] = []
  const regex = /<(?:\w+:)?ModalidadeWM>([\s\S]*?)<\/(?:\w+:)?ModalidadeWM>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    const inner = match[1]
    const codigoModalidade = extractTag(inner, 'CodigoModalidade')
    const descricao = extractTag(inner, 'Descricao')
    const total = extractTag(inner, 'QuantidadeAnunciosTotal')
    const usados = extractTag(inner, 'QuantidadeAnuncios')
    if (codigoModalidade) {
      itens.push({
        codigoModalidade,
        descricao: descricao || '',
        quantidadeTotal: total ? parseInt(total, 10) : 0,
        quantidadeUsados: usados ? parseInt(usados, 10) : 0,
      })
    }
  }
  return adjustModalidadeQuotas(itens)
}

// Confirmado pela Adriana (13/08/2026): o total de 20 que a Webmotors reporta
// no registro do "Anúncio Básico" é o teto da CONTA INTEIRA, não uma cota
// exclusiva — dentro desses 20, 2 são reservados pra modalidade Vip. Total
// realmente disponível pro Básico = total bruto (20) - total das outras
// modalidades (Vip, 2) = 18. Sem esse ajuste, a trava de vaga em wm-sync
// deixaria passar 2 anúncios Básico a mais do que a conta realmente comporta.
function adjustModalidadeQuotas(modalidades: ModalidadeWM[]): ModalidadeWM[] {
  if (modalidades.length <= 1) return modalidades
  const totalOutras = modalidades
    .filter((m) => m.descricao !== 'Anúncio Básico')
    .reduce((acc, m) => acc + m.quantidadeTotal, 0)
  return modalidades.map((m) =>
    m.descricao === 'Anúncio Básico'
      ? { ...m, quantidadeTotal: Math.max(0, m.quantidadeTotal - totalOutras) }
      : m,
  )
}

// Achado via WSDL público do serviço (?WSDL, 13/08/2026): Opcional no
// IncluirCarro é um ArrayOfOpcionalWM (CodigoOpcional decimal + Descricao),
// não texto livre — por isso a tag sempre ia vazia até aqui, e nenhum
// opcional aparecia nos anúncios. Catálogo real via ObterOpcionais.
export interface OpcionalWM {
  codigoOpcional: string
  descricao: string
}

export function parseOpcionais(xml: string): OpcionalWM[] {
  const itens: OpcionalWM[] = []
  const regex = /<(?:\w+:)?OpcionalWM>([\s\S]*?)<\/(?:\w+:)?OpcionalWM>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    const inner = match[1]
    const codigoOpcional = extractTag(inner, 'CodigoOpcional')
    const descricao = extractTag(inner, 'Descricao')
    if (codigoOpcional) {
      itens.push({ codigoOpcional, descricao: descricao || '' })
    }
  }
  return itens
}

function buildOpcionalTag(codigosOpcionais: string[]): string {
  if (codigosOpcionais.length === 0) return '\n      <Opcional></Opcional>'
  const itens = codigosOpcionais
    .map((c) => `\n        <OpcionalWM><CodigoOpcional>${c}</CodigoOpcional></OpcionalWM>`)
    .join('')
  return `\n      <Opcional>${itens}\n      </Opcional>`
}

// Checa quantas fotos o anúncio já tem antes de mandar mais — sem isso, toda
// vez que AlterarCarro roda de novo (ex: outro campo mudou) reenviaria as
// mesmas fotos e duplicaria.
export function buildObterFotosCarroXML(hash: string, codigoAnuncio: string | number): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pCodigoAnuncio>${codigoAnuncio}</pCodigoAnuncio>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'ObterFotosCarro', innerXml)
}

export function parseQuantidadeFotos(xml: string): number {
  const q = extractTag(xml, 'QuantidadeFotos')
  return q ? parseInt(q, 10) : 0
}

// Também via WSDL: fotos NÃO vão no IncluirCarro — é uma chamada separada por
// foto, depois de ter o CodigoAnuncio. IncluirFotoUrl (URL direta) sempre
// voltou 21|10 mesmo com imagem trivial de outro domínio — o exemplo OFICIAL
// do manual da Webmotors (13/08/2026, confirmado pela Adriana) usa IncluirFoto
// com os bytes da imagem, não URL. Usando esse em vez do Url.
export function buildIncluirFotoXML(
  hash: string,
  codigoAnuncio: string | number,
  base64Image: string,
): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pByteImage>${base64Image}</pByteImage>
      <pCodigoAnuncio>${codigoAnuncio}</pCodigoAnuncio>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'IncluirFoto', innerXml)
}

const AUTH_ACTIONS = new Set(['autenticar', 'Autenticar', 'LoginSistemaRevendedor'])

// ATENÇÃO — procedência não confirmada.
// Esta tabela não veio de um documento verificável: o manual oficial da Webmotors
// não está no repo. É reconciliada a partir do comportamento REAL observado em
// 06/08/2026 (via wm_mapeamento_veiculos.ultima_resposta_xml), substituindo uma
// tabela anterior (500-507) que não tinha nenhuma evidência por trás. Trate a
// tradução como pista, nunca como diagnóstico final — a verdade fica no XML bruto.
const CODIGO_RETORNO_43: Record<string, string> = {
  '1': 'Somente anúncios ativos podem ser desativados.',
  '7': 'Preço do carro deve ser preenchido.',
  '8': 'Ano do modelo deve ser preenchido.',
  '9': 'Ano de fabricação deve ser preenchido.',
  '10': 'Câmbio deve ser preenchido.',
  '11': 'Cor deve ser preenchida.',
  '12': 'Número de portas deve ser preenchido.',
  '13': 'Placa deve ser preenchida.',
  '14': 'Quilometragem deve ser preenchida.',
  '15': 'Marca deve ser preenchida.',
  '16': 'Modelo deve ser preenchido.',
  '17': 'Versão deve ser preenchida.',
  '18': 'Quilometragem deve ser preenchida.',
  '19': 'Placa deve ser preenchida.',
  '20': 'Câmbio deve ser preenchido.',
  '21': 'Número de portas deve ser preenchido.',
  '22': 'Cor deve ser preenchida.',
  '30': 'Combustível deve ser preenchido.',
  '32': 'Número de anúncios disponíveis para a modalidade esgotado.',
  '37': 'Ano do modelo inválido.',
  '41': 'Marca - Modelo - Versão - Ano Modelo Inconsistentes.',
  '42': 'Cor Externa inválida para a Versão.',
  '44': 'Tipo Combustível inválido.',
  '45': 'Câmbio inválido.',
  '46': 'AdaptadoDeficientesFisicos deve possuir S ou N.',
  '47': 'Alienado deve possuir S ou N.',
  '48': 'Blindado deve possuir S ou N.',
  '49': 'IpvaPago deve possuir S ou N.',
  '50': 'GarantiaDeFabrica deve possuir S ou N.',
  '51': 'Licenciado deve possuir S ou N.',
  '52': 'RevisadoOficinaAgendaDoCarro deve possuir S ou N.',
  '53': 'RevisoesEmConcessionaria deve possuir S ou N.',
  '54': 'UnicoDono deve possuir S ou N.',
  '55': 'TipoAnuncio deve possuir U ou N.',
  '56': 'Código da modalidade de anúncio inválida para o Revendedor/Tipo de anúncio.',
  '62': 'Número de porta inválido.',
  '63': 'Combustível inválido.',
  '64': 'Cor inválida.',
  '66': 'O preço cadastrado não está de acordo com o praticado pelo mercado (fora da faixa FIPE/Webmotors).',
  '67': 'Preço de Revenda inválido.',
  '68': 'Quilometragem não permitida.',
  '70': 'Marca deve ser preenchido.',
  '71': 'Modelo deve ser preenchido.',
  '72': 'Versão deve ser preenchido.',
  '73': 'Cor deve ser preenchido.',
  '74': 'Placa deve ser preenchido.',
  '75': 'Câmbio deve ser preenchido.',
  '76': 'Número de Portas deve ser preenchido.',
  '77': 'Combustível deve ser preenchido.',
  '78': 'Preço de Venda deve ser preenchido.',
  '84': 'Placa inválida.',
  '85': 'Ano de fabricação inválido.',
  '102': 'Preço de venda inválido: valor acima da tabela FIPE mais que o permitido.',
  '105': 'Preço de revenda inválido: valor acima da tabela FIPE mais que o permitido.',
  '106': 'Código do anúncio deve ser preenchido.',
  '107':
    'O campo quilometragem só pode ser alterado para um valor superior ao cadastrado inicialmente.',
  '112': 'Ano de fabricação inválido.',
}

const CODIGO_RETORNO_MENSAGENS: Record<string, string> = {
  '500': 'Sucesso',
  '31': 'Hash de autenticação inválido',
  '32': 'Falha inesperada — payload com estrutura ou nomes de campo incorretos',
  '53': 'Cor interna inválida para a versão',
  '82': 'Campo contém números inválidos',
}

// Traduções CONFIRMADAS pelo suporte da Webmotors — não decompor por posição.
// "22|78" foi confirmado por Gabriel Moreira da Silva em 10/08/2026: é uma regra
// de relação entre preços, e NÃO "Cor (22) + Preço de Venda (78)" como a
// decomposição por posição sugeria. Foi essa leitura errada que levou a 4 rodadas
// de teste trocando nomes de campo de cor à toa.
const CODIGO_RETORNO_CONFIRMADOS: Record<string, string> = {
  '22|78':
    'O campo PrecoReal (De) deve ser maior que o campo PrecoVenda (Por) — confirmado pelo suporte Webmotors em 10/08/2026',
}

// Formatos observados ao vivo: "22|78" (posições cruas separadas por "|") e
// "43|52,43|30" (cada posição prefixada por "43|", unidades separadas por
// vírgula). O "43" nunca é uma posição real (não existe na CODIGO_RETORNO_43),
// então é seguro tratá-lo sempre como prefixo e descartar.
function decodeCodigoRetorno(codigoRetorno: string): string {
  const confirmado = CODIGO_RETORNO_CONFIRMADOS[codigoRetorno]
  if (confirmado) return confirmado

  const direto = CODIGO_RETORNO_MENSAGENS[codigoRetorno]
  if (direto) return `${direto} (tradução não confirmada)`

  if (/^(43\|\d+|\d+)([|,](43\|\d+|\d+))*$/.test(codigoRetorno)) {
    const posicoes = codigoRetorno
      .split(',')
      .flatMap((chunk) => chunk.split('|'))
      .filter((p) => p !== '43')
    const traduzidas = posicoes.map((p) => CODIGO_RETORNO_43[p] || `posição ${p} desconhecida`)
    return `${traduzidas.join(' + ')} (tradução não confirmada)`
  }

  return `código desconhecido (${codigoRetorno})`
}

export async function callSOAP(
  xml: string,
  action: string,
  hashForHeader?: string,
): Promise<SOAPResult> {
  try {
    const secret = Deno.env.get('PROXY_SHARED_SECRET')
    if (!WM_PROXY_URL || !secret) {
      return {
        success: false,
        error: 'WM_PROXY_URL ou PROXY_SHARED_SECRET não configurados nas secrets da Edge Function',
      }
    }

    const isAuth = AUTH_ACTIONS.has(action)
    const targetUrl = isAuth ? WM_AUTH_URL : WM_ESTOQUE_URL
    const namespace = isAuth ? WM_AUTH_NAMESPACE : WM_ESTOQUE_NAMESPACE
    const soapAction = `${namespace}/${action}`

    const proxyRes = await fetch(WM_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-proxy-secret': secret,
      },
      body: JSON.stringify({ targetUrl, soapAction, xmlBody: xml, authHash: hashForHeader }),
    })

    if (proxyRes.status === 401) {
      return { success: false, error: 'Proxy recusou a chamada: x-proxy-secret incorreto' }
    }
    if (proxyRes.status === 400) {
      const detail = await proxyRes.text()
      return { success: false, error: `Requisição inválida ao proxy: ${detail}`, raw: detail }
    }
    if (proxyRes.status === 502) {
      const detail = await proxyRes.text()
      return {
        success: false,
        error: `Proxy não conseguiu conectar à Webmotors: ${detail}`,
        networkError: true,
        raw: detail,
      }
    }

    const responseText = await proxyRes.text()

    if (responseText.includes('<faultcode>') || responseText.includes('Fault')) {
      const errorMsg = extractTag(responseText, 'faultstring') || 'SOAP fault occurred'
      return { success: false, error: errorMsg, raw: responseText }
    }

    const codigoRetorno = extractTag(responseText, 'CodigoRetorno') || undefined
    const hash = extractTag(responseText, 'HashAutenticacao')
    const codigo = extractTag(responseText, 'CodigoAnuncio')

    if (codigoRetorno && codigoRetorno !== '500') {
      const detalhe = `CodigoRetorno ${codigoRetorno}: ${decodeCodigoRetorno(codigoRetorno)}`
      return { success: false, error: detalhe, codigoRetorno, raw: responseText }
    }

    if (isAuth) {
      if (!hash) {
        return {
          success: false,
          error: 'Hash não encontrado na resposta. Resposta bruta: ' + responseText.slice(0, 500),
          raw: responseText,
        }
      }
      return { success: true, hashAutenticacao: hash, codigoRetorno, raw: responseText }
    }

    if (action === 'IncluirCarro' || action === 'IncluirMoto') {
      if (!codigo || codigo === '0') {
        return {
          success: false,
          error:
            'CodigoAnuncio não encontrado/zerado na resposta. Resposta bruta: ' +
            responseText.slice(0, 800),
          raw: responseText,
        }
      }
      return { success: true, codigoAnuncio: codigo, codigoRetorno, raw: responseText }
    }

    return { success: true, codigoRetorno, raw: responseText }
  } catch (err: any) {
    const msg = err.message || 'Network error during SOAP call'
    const isNetwork =
      msg.includes('dns') ||
      msg.includes('DNS') ||
      msg.includes('resolve') ||
      msg.includes('connect') ||
      msg.includes('timed out') ||
      msg.includes('timeout') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNRESET') ||
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('Network')
    return { success: false, error: msg, networkError: isNetwork }
  }
}
