import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildAuthXML, callSOAP, type WMCredentials } from '../_shared/wm-soap.ts'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const WM_ESTOQUE_NAMESPACE = 'www.webmotors.com.br/wsEstoqueRevendedorWebMotors'

async function autenticar(): Promise<string> {
  const creds: WMCredentials = {
    email: Deno.env.get('WM_EMAIL') || '',
    senha: Deno.env.get('WM_SENHA') || '',
    cnpj: Deno.env.get('WM_CNPJ') || '',
  }
  const result = await callSOAP(buildAuthXML(creds), 'autenticar')
  if (!result.success || !result.hashAutenticacao) {
    throw new Error(result.error || 'Falha na autenticação Webmotors')
  }
  return result.hashAutenticacao
}

function parseItems(xml: string, itemTag: string): Record<string, string>[] {
  const items: Record<string, string>[] = []
  const regex = new RegExp(`<(?:\\w+:)?${itemTag}>([\\s\\S]*?)</(?:\\w+:)?${itemTag}>`, 'g')
  let match
  while ((match = regex.exec(xml)) !== null) {
    const inner = match[1]
    const item: Record<string, string> = {}
    const fieldRegex = /<(?:\w+:)?(\w+)>([^<]*)<\/(?:\w+:)?\1>/g
    let f
    while ((f = fieldRegex.exec(inner)) !== null) item[f[1]] = f[2].trim()
    items.push(item)
  }
  return items
}

async function callCatalogo(action: string, extraFields: string, hash: string): Promise<string> {
  const innerXml = `<pHashAutenticacao>${hash}</pHashAutenticacao>${extraFields}`
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="${WM_ESTOQUE_NAMESPACE}">
      ${innerXml}
    </${action}>
  </soap:Body>
</soap:Envelope>`
  const result = await callSOAP(xml, action, hash)
  if (!result.success) throw new Error(result.error || `Falha ao chamar ${action}`)
  return result.raw || ''
}

// Job de carga em lote — pensado pra rodar fora do navegador (cron/manual),
// por isso a proteção é o secret interno, não uma sessão de admin.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({ action: 'sync_all' }))
    const action = body.action
    const offset = body.offset || 0
    const limit = body.limit || 20
    const results: Record<string, any> = {}

    const hash = await autenticar()
    results.hash_obtido = true

    if (action === 'sync_modelos_batch') {
      const { data: marcas, count } = await supabase
        .from('wm_marcas')
        .select('codigo_wm, nome_crm', { count: 'exact' })
        .order('codigo_wm')
        .range(offset, offset + limit - 1)

      let totalModelos = 0
      const erros: any[] = []
      for (const marca of marcas || []) {
        try {
          const xml = await callCatalogo(
            'ObterModelo',
            `\n      <pCodigoMarca>${marca.codigo_wm}</pCodigoMarca>`,
            hash,
          )
          const modelos = parseItems(xml, 'ModeloWM')
          for (const m of modelos) {
            if (!m.CodigoModelo) continue
            const { error } = await supabase.from('wm_modelos').upsert(
              {
                codigo_marca_wm: marca.codigo_wm,
                nome_crm: m.NomeModelo || `Modelo_${m.CodigoModelo}`,
                nome_wm: m.NomeModelo || null,
                codigo_wm: m.CodigoModelo,
              },
              { onConflict: 'codigo_wm' },
            )
            if (!error) totalModelos++
            else erros.push({ marca: marca.nome_crm, erro: error.message })
          }
        } catch (e: any) {
          erros.push({ marca: marca.nome_crm, erro: e.message })
        }
      }
      results.batch = {
        offset,
        limit,
        marcas_processadas: marcas?.length || 0,
        total_marcas: count,
        proximo_offset: offset + limit,
        concluido: offset + limit >= (count || 0),
        modelos_salvos: totalModelos,
        erros: erros.slice(0, 5),
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
