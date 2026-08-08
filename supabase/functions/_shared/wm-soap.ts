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
}

// --- Endpoints Webmotors (homologação) ---
// Fonte: documento "Credenciais, IDs e Configurações — Projeto Revenda" (03/08/2026)
const WM_AUTH_URL =
  'https://hportal.webmotors.com.br/IntegracaoRevendedor/wsLoginSistemaRevendedor.asmx'
const WM_ESTOQUE_URL =
  'https://hportal.webmotors.com.br/IntegracaoRevendedor/wsEstoqueRevendedorWebMotors.asmx'

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
// Pendência conhecida: nenhuma página consultada até agora fala em
// CodigoVersaoAno como parte do request real (só apareceu na tabela do
// AnuncioWM.html, que já se mostrou não confiável para o schema de entrada).
export function buildAnuncioXML(
  veiculo: any,
  mapa: MapeamentoWM,
  codigoAnuncio: string | number = 0,
): string {
  const precoVenda = Number(veiculo.preco_venda) || 0
  const precoRevenda = Number(veiculo.preco_revenda) || precoVenda
  return `
      <CodigoAnuncio>${codigoAnuncio}</CodigoAnuncio>
      <CodigoMarca>${mapa.codigo_marca_wm}</CodigoMarca>
      <CodigoModelo>${mapa.codigo_modelo_wm}</CodigoModelo>
      <CodigoVersao>${mapa.codigo_versao_wm}</CodigoVersao>
      <AnoDoModelo>${veiculo.ano_modelo || 0}</AnoDoModelo>
      <NrPortas>${veiculo.portas || 4}</NrPortas>
      <CodigoCombustivel>${mapa.codigo_combustivel_wm}</CodigoCombustivel>
      <DescricaoCombustivel>${escapeXml(mapa.descricao_combustivel)}</DescricaoCombustivel>
      <AdaptadoDeficientesFisicos>${snField(veiculo.adaptado_deficientes)}</AdaptadoDeficientesFisicos>
      <Alienado>${snField(veiculo.alienado)}</Alienado>
      <AnoFabricacao>${veiculo.ano_fabricacao || 0}</AnoFabricacao>
      <Blindado>${snField(veiculo.blindado)}</Blindado>
      <Cambio>${escapeXml(mapa.descricao_cambio)}</Cambio>
      <CodigoModalidade>${mapa.codigo_modalidade_wm}</CodigoModalidade>
      <CorExterna>${escapeXml(mapa.descricao_cor)}</CorExterna>
      <CodigoCor>${mapa.codigo_cor_wm}</CodigoCor>
      <GarantiaDeFabrica>${snField(veiculo.garantia_fabrica)}</GarantiaDeFabrica>
      <IpvaPago>${snField(veiculo.ipva_pago)}</IpvaPago>
      <Km>${veiculo.quilometragem || 0}</Km>
      <Licenciado>${snField(veiculo.licenciado, 'S')}</Licenciado>
      <Observacao>${escapeXml((veiculo.descricao || '').slice(0, 500))}</Observacao>
      <Placa>${escapeXml(veiculo.placa || '')}</Placa>
      <PrecoRevenda>${precoRevenda.toFixed(2)}</PrecoRevenda>
      <PrecoVenda>${precoVenda.toFixed(2)}</PrecoVenda>
      <RevisadoOficinaAgendaDoCarro>${snField(veiculo.revisado_oficina)}</RevisadoOficinaAgendaDoCarro>
      <RevisoesEmConcessionaria>${snField(veiculo.revisoes_concessionaria)}</RevisoesEmConcessionaria>
      <TipoAnuncio>U</TipoAnuncio>
      <UnicoDono>${snField(veiculo.unico_dono)}</UnicoDono>
      <Leilao>N</Leilao>
      <DataInclusao></DataInclusao>
      <DataUltimaAlteracao></DataUltimaAlteracao>
      <Opcional></Opcional>
      <CodigoRetorno></CodigoRetorno>`
}

export function buildIncluirCarroXML(veiculo: any, hash: string, mapa: MapeamentoWM): string {
  const anuncioXml = buildAnuncioXML(veiculo, mapa, 0)
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
): string {
  const anuncioXml = buildAnuncioXML(veiculo, mapa, codigoAnuncio)
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pAnuncio>${anuncioXml}
      </pAnuncio>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'AlterarCarro', innerXml)
}

export function buildExcluirCarroXML(hash: string, codigoAnuncio: string): string {
  const innerXml = `
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pCodigoAnuncio>${codigoAnuncio}</pCodigoAnuncio>
      <pMotivoExclusao>1</pMotivoExclusao>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'ExcluirCarro', innerXml)
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

// Formatos observados ao vivo: "22|78" (posições cruas separadas por "|") e
// "43|52,43|30" (cada posição prefixada por "43|", unidades separadas por
// vírgula). O "43" nunca é uma posição real (não existe na CODIGO_RETORNO_43),
// então é seguro tratá-lo sempre como prefixo e descartar.
function decodeCodigoRetorno(codigoRetorno: string): string {
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
