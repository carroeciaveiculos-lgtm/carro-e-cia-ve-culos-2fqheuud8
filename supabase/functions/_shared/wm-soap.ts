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
}

// --- Endpoints Webmotors (homologação) ---
// Fonte: documento "Credenciais, IDs e Configurações — Projeto Revenda" (03/08/2026)
const WM_AUTH_URL = 'https://hportal.webmotors.com.br/IntegracaoRevendedor/wsLoginSistemaRevendedor.asmx'
const WM_ESTOQUE_URL = 'https://hportal.webmotors.com.br/IntegracaoRevendedor/wsEstoqueRevendedorWebMotors.asmx'

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

// NOTA (Fase B em andamento): ainda não usa códigos de catálogo nem os 9 campos S/N.
export function buildIncluirCarroXML(veiculo: any, hash: string, categoria: string): string {
  const fotos = Array.isArray(veiculo.fotos)
    ? veiculo.fotos
        .slice(0, 15)
        .map((f: string, i: number) => `<foto${i + 1}>${f}</foto${i + 1}>`)
        .join('\n      ')
    : ''

  const innerXml = `
      <hashAutenticacao>${hash}</hashAutenticacao>
      <marca>${veiculo.marca || ''}</marca>
      <modelo>${veiculo.modelo || ''}</modelo>
      <versao>${veiculo.versao || ''}</versao>
      <anoFabricacao>${veiculo.ano_fabricacao || ''}</anoFabricacao>
      <anoModelo>${veiculo.ano_modelo || ''}</anoModelo>
      <preco>${veiculo.preco_venda || 0}</preco>
      <km>${veiculo.quilometragem || 0}</km>
      <cor>${veiculo.cor || ''}</cor>
      <combustivel>${veiculo.combustivel || ''}</combustivel>
      <cambio>${veiculo.cambio || ''}</cambio>
      <portas>${veiculo.portas || 4}</portas>
      <placa>${veiculo.placa || ''}</placa>
      <observacao>${veiculo.descricao || ''}</observacao>
      ${fotos}`

  const action = categoria === 'Moto' ? 'IncluirMoto' : 'incluirCarro'
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, action, innerXml)
}

export function buildAlterarCarroXML(veiculo: any, hash: string, codigoAnuncio: string): string {
  const innerXml = `
      <hashAutenticacao>${hash}</hashAutenticacao>
      <codigoAnuncio>${codigoAnuncio}</codigoAnuncio>
      <preco>${veiculo.preco_venda || 0}</preco>
      <km>${veiculo.quilometragem || 0}</km>
      <observacao>${veiculo.descricao || ''}</observacao>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'alterarCarro', innerXml)
}

export function buildExcluirCarroXML(hash: string, codigoAnuncio: string): string {
  const innerXml = `
      <hashAutenticacao>${hash}</hashAutenticacao>
      <codigoAnuncio>${codigoAnuncio}</codigoAnuncio>`
  return wrapSOAP(WM_ESTOQUE_NAMESPACE, 'excluirCarro', innerXml)
}

const AUTH_ACTIONS = new Set(['autenticar', 'Autenticar', 'LoginSistemaRevendedor'])

// Tabela de códigos de retorno — fonte: manual oficial, seção 12
const CODIGO_RETORNO_MENSAGENS: Record<string, string> = {
  '500': 'Sucesso',
  '501': 'Erro de autenticação (hash expirado ou credenciais inválidas)',
  '502': 'Parâmetro obrigatório ausente ou vazio',
  '503': 'CodigoAnuncio ou ID de catálogo não encontrado',
  '504': 'Erro de validação (formato de campo ou ordem de tags incorreta)',
  '505': 'Erro interno da Webmotors (aplicar retry com backoff)',
  '506': 'Placa duplicada (converter para alterarCarro)',
  '507': 'Limite de anúncios do plano excedido',
}

export async function callSOAP(xml: string, action: string): Promise<SOAPResult> {
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
      body: JSON.stringify({ targetUrl, soapAction, xmlBody: xml }),
    })

    if (proxyRes.status === 401) {
      return { success: false, error: 'Proxy recusou a chamada: x-proxy-secret incorreto' }
    }
    if (proxyRes.status === 400) {
      const detail = await proxyRes.text()
      return { success: false, error: `Requisição inválida ao proxy: ${detail}` }
    }
    if (proxyRes.status === 502) {
      const detail = await proxyRes.text()
      return {
        success: false,
        error: `Proxy não conseguiu conectar à Webmotors: ${detail}`,
        networkError: true,
      }
    }

    const responseText = await proxyRes.text()

    if (responseText.includes('<faultcode>') || responseText.includes('Fault')) {
      const errorMsg = extractTag(responseText, 'faultstring') || 'SOAP fault occurred'
      return { success: false, error: errorMsg }
    }

    const codigoRetorno = extractTag(responseText, 'CodigoRetorno') || undefined
    const hash = extractTag(responseText, 'HashAutenticacao')
    const codigo = extractTag(responseText, 'CodigoAnuncio')

    if (codigoRetorno && codigoRetorno !== '500') {
      const msg = CODIGO_RETORNO_MENSAGENS[codigoRetorno] || 'Código de retorno desconhecido'
      return { success: false, error: `CodigoRetorno ${codigoRetorno}: ${msg}`, codigoRetorno }
    }

    if (isAuth) {
      if (!hash) {
        return {
          success: false,
          error: 'Hash não encontrado na resposta. Resposta bruta: ' + responseText.slice(0, 500),
        }
      }
      return { success: true, hashAutenticacao: hash, codigoRetorno }
    }

    if (action === 'incluirCarro' || action === 'IncluirMoto') {
      if (!codigo) {
        return {
          success: false,
          error: 'CodigoAnuncio não encontrado na resposta. Resposta bruta: ' + responseText.slice(0, 500),
        }
      }
      return { success: true, codigoAnuncio: codigo, codigoRetorno }
    }

    return { success: true, codigoRetorno }
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
