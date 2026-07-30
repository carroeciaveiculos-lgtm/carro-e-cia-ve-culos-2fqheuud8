import { createClient } from 'npm:@supabase/supabase-js@2'

const WM_SOAP_URL = 'https://www.webmotors.com.br/integracao/ws/EstoqueV2.asmx'
const WM_CONTENT_TYPE = 'text/xml; charset=utf-8'

function buildSoapEnvelope(action: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="http://tempuri.org/">
      ${body}
    </${action}>
  </soap:Body>
</soap:Envelope>`
}

function buildCredentials(): string {
  const email = Deno.env.get('WM_EMAIL') || ''
  const senha = Deno.env.get('WM_SENHA') || ''
  const cnpj = Deno.env.get('WM_CNPJ') || ''
  return `<credencial><Email>${email}</Email><Senha>${senha}</Senha><Cnpj>${cnpj}</Cnpj></credencial>`
}

async function callSoap(action: string, body: string): Promise<string> {
  const envelope = buildSoapEnvelope(action, body)
  const response = await fetch(WM_SOAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': WM_CONTENT_TYPE,
      SOAPAction: `http://tempuri.org/${action}`,
    },
    body: envelope,
  })
  if (!response.ok) {
    throw new Error(`WM SOAP error ${response.status}: ${await response.text()}`)
  }
  return await response.text()
}

function parseXmlItems(xml: string, itemTag: string): any[] {
  const items: any[] = []
  const regex = new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, 'g')
  let match
  while ((match = regex.exec(xml)) !== null) {
    const itemXml = match[1]
    const item: Record<string, string> = {}
    const fieldRegex = /<(\w+)>([\s\S]*?)<\/\1>/g
    let fieldMatch
    while ((fieldMatch = fieldRegex.exec(itemXml)) !== null) {
      item[fieldMatch[1]] = fieldMatch[2].trim()
    }
    items.push(item)
  }
  return items
}

export async function fetchAndStoreMarcas(supabase: any): Promise<number> {
  const xml = await callSoap('BuscarMarcas', buildCredentials())
  const marcas = parseXmlItems(xml, 'Marca')
  let count = 0
  for (const m of marcas) {
    const { error } = await supabase.from('wm_marcas').upsert(
      {
        nome_crm: m.Nome || m.nome || `Marca_${m.Codigo || count}`,
        nome_wm: m.Nome || m.nome || null,
        codigo_wm: m.Codigo || m.codigo || null,
      },
      { onConflict: 'nome_crm' },
    )
    if (!error) count++
  }
  return count
}

export async function fetchAndStoreModelos(supabase: any): Promise<number> {
  const xml = await callSoap('BuscarModelos', buildCredentials())
  const modelos = parseXmlItems(xml, 'Modelo')
  let count = 0
  for (const m of modelos) {
    const { error } = await supabase.from('wm_modelos').upsert(
      {
        nome_crm: m.Nome || m.nome || `Modelo_${m.Codigo || count}`,
        nome_wm: m.Nome || m.nome || null,
        codigo_wm: m.Codigo || m.codigo || null,
        codigo_marca_wm: m.CodigoMarca || m.codigo_marca || null,
      },
      { onConflict: 'nome_crm' },
    )
    if (!error) count++
  }
  return count
}

export async function fetchAndStoreCores(supabase: any): Promise<number> {
  const xml = await callSoap('BuscarCores', buildCredentials())
  const cores = parseXmlItems(xml, 'Cor')
  let count = 0
  for (const c of cores) {
    const { error } = await supabase.from('wm_cores').upsert(
      {
        nome_crm: c.Nome || c.nome || `Cor_${c.Codigo || count}`,
        nome_wm: c.Nome || c.nome || null,
        codigo_wm: c.Codigo || c.codigo || null,
      },
      { onConflict: 'nome_crm' },
    )
    if (!error) count++
  }
  return count
}

export function createSupabaseClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}
