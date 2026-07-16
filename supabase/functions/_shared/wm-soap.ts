export interface WMCredentials {
  email: string
  senha: string
  cnpj: string
  clienteId: string
}

export interface SOAPResult {
  success: boolean
  hashAutenticacao?: string
  codigoAnuncio?: string
  error?: string
}

const WM_ENDPOINT = 'https://www.webmotors.com.br/webservice/'

export function buildAuthXML(creds: WMCredentials): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Autenticar xmlns="http://tempuri.org/">
      <Email>${creds.email}</Email>
      <Senha>${creds.senha}</Senha>
      <Cnpj>${creds.cnpj}</Cnpj>
      <ClienteId>${creds.clienteId}</ClienteId>
    </Autenticar>
  </soap:Body>
</soap:Envelope>`
}

export function buildIncluirCarroXML(vehicle: any, hash: string, categoria: string): string {
  const acao = categoria === 'Moto' ? 'IncluirMoto' : 'IncluirCarro'
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${acao} xmlns="http://tempuri.org/">
      <HashAutenticacao>${hash}</HashAutenticacao>
      <Marca>${vehicle.marca || ''}</Marca>
      <Modelo>${vehicle.modelo || ''}</Modelo>
      <AnoModelo>${vehicle.ano_modelo || ''}</AnoModelo>
      <AnoFabricacao>${vehicle.ano_fabricacao || ''}</AnoFabricacao>
      <Combustivel>${vehicle.combustivel || ''}</Combustivel>
      <Cor>${vehicle.cor || ''}</Cor>
      <Quilometragem>${vehicle.quilometragem || 0}</Quilometragem>
      <Preco>${vehicle.preco_venda || 0}</Preco>
      <Placa>${vehicle.placa || ''}</Placa>
      <Observacao>${(vehicle.descricao || '').replace(/[<>&]/g, '')}</Observacao>
      <Fotos>${JSON.stringify(vehicle.fotos || [])}</Fotos>
    </${acao}>
  </soap:Body>
</soap:Envelope>`
}

export function buildAlterarCarroXML(vehicle: any, hash: string, codigoAnuncio: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <AlterarCarro xmlns="http://tempuri.org/">
      <HashAutenticacao>${hash}</HashAutenticacao>
      <CodigoAnuncio>${codigoAnuncio}</CodigoAnuncio>
      <Preco>${vehicle.preco_venda || 0}</Preco>
      <Quilometragem>${vehicle.quilometragem || 0}</Quilometragem>
      <Observacao>${(vehicle.descricao || '').replace(/[<>&]/g, '')}</Observacao>
    </AlterarCarro>
  </soap:Body>
</soap:Envelope>`
}

export function buildExcluirCarroXML(hash: string, codigoAnuncio: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ExcluirCarro xmlns="http://tempuri.org/">
      <HashAutenticacao>${hash}</HashAutenticacao>
      <CodigoAnuncio>${codigoAnuncio}</CodigoAnuncio>
    </ExcluirCarro>
  </soap:Body>
</soap:Envelope>`
}

export async function callSOAP(
  xml: string,
  action: string,
  maxRetries = 3
): Promise<SOAPResult> {
  let lastError = ''
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(WM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `http://tempuri.org/${action}`,
        },
        body: xml,
      })
      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${await res.text()}`
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt))
          continue
        }
        return { success: false, error: lastError }
      }
      const responseText = await res.text()
      const hashMatch = responseText.match(/<HashAutenticacao>([^<]+)<\/HashAutenticacao>/)
      const codigoMatch = responseText.match(/<CodigoAnuncio>([^<]+)<\/CodigoAnuncio>/)
      if (responseText.includes('<Error>') || responseText.includes('erro')) {
        const errorMatch = responseText.match(/<Error>([^<]+)<\/Error>/)
        return { success: false, error: errorMatch?.[1] || 'Unknown SOAP error' }
      }
      return {
        success: true,
        hashAutenticacao: hashMatch?.[1],
        codigoAnuncio: codigoMatch?.[1],
      }
    } catch (err: any) {
      lastError = err.message
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt))
        continue
      }
    }
  }
  return { success: false, error: lastError }
}
