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
}

const WM_SOAP_URL = 'https://integration.webmotors.com.br/Integracao/Service.asmx'

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]*)</(?:\\w+:)?${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function wrapSOAP(action: string, innerXml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="http://tempuri.org/">
      ${innerXml}
    </${action}>
  </soap:Body>
</soap:Envelope>`
}

export function buildAuthXML(creds: WMCredentials): string {
  const innerXml = `
      <usuario>${creds.email}</usuario>
      <senha>${creds.senha}</senha>
      <cnpj>${creds.cnpj}</cnpj>`
  return wrapSOAP('LoginSistemaRevendedor', innerXml)
}

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

  const action = categoria === 'Moto' ? 'IncluirMoto' : 'IncluirCarro'
  return wrapSOAP(action, innerXml)
}

export function buildAlterarCarroXML(veiculo: any, hash: string, codigoAnuncio: string): string {
  const innerXml = `
      <hashAutenticacao>${hash}</hashAutenticacao>
      <codigoAnuncio>${codigoAnuncio}</codigoAnuncio>
      <preco>${veiculo.preco_venda || 0}</preco>
      <km>${veiculo.quilometragem || 0}</km>
      <observacao>${veiculo.descricao || ''}</observacao>`
  return wrapSOAP('AlterarCarro', innerXml)
}

export function buildExcluirCarroXML(hash: string, codigoAnuncio: string): string {
  const innerXml = `
      <hashAutenticacao>${hash}</hashAutenticacao>
      <codigoAnuncio>${codigoAnuncio}</codigoAnuncio>`
  return wrapSOAP('ExcluirCarro', innerXml)
}

const AUTH_ACTIONS = new Set(['Autenticar', 'LoginSistemaRevendedor'])

export async function callSOAP(xml: string, action: string): Promise<SOAPResult> {
  try {
    const res = await fetch(`${WM_SOAP_URL}?op=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: `http://tempuri.org/${action}`,
      },
      body: xml,
    })

    const responseText = await res.text()

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${responseText.substring(0, 500)}` }
    }

    if (responseText.includes('<faultcode>') || responseText.includes('Fault')) {
      const errorMsg = extractTag(responseText, 'faultstring') || 'SOAP fault occurred'
      return { success: false, error: errorMsg }
    }

    const hash =
      extractTag(responseText, 'hashAutenticacao') ||
      extractTag(responseText, 'AutenticarResult') ||
      extractTag(responseText, 'LoginSistemaRevendedorResult')
    const codigo =
      extractTag(responseText, 'codigoAnuncio') || extractTag(responseText, 'IncluirCarroResult')

    if (AUTH_ACTIONS.has(action)) {
      if (!hash) {
        return { success: false, error: 'No hash returned from authentication' }
      }
      return { success: true, hashAutenticacao: hash }
    }

    if (action.startsWith('Incluir')) {
      if (!codigo) {
        return { success: false, error: 'No codigoAnuncio returned from inclusion' }
      }
      return { success: true, codigoAnuncio: codigo }
    }

    return { success: true }
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
