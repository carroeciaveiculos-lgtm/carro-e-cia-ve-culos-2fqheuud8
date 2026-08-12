import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { buildAuthXML, callSOAP, type WMCredentials } from '../_shared/wm-soap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Catálogos "Obter*" da Webmotors que não têm parâmetro além do hash de
// autenticação. Cada um vira uma consulta administrativa pontual (ex: achar o
// CodigoModalidade real de "Anúncio Básico") — não um mapeamento automático,
// que continua em wm-mapear-veiculo.
const CATALOGOS_SEM_PARAMETRO: Record<string, string> = {
  cores: 'ObterCores',
  modalidade: 'ObterModalidade',
  cambios: 'ObterCambio',
  combustiveis: 'ObterCombustivel',
  // Adicionado 12/08/2026 pra validar ObterEstoqueAtual isolado, contra a
  // homologação, antes de confiar nele na checagem de duplicidade do wm-sync
  // (ver docs/webmotors-integracao.md — "NÃO VERIFICADO AO VIVO").
  estoque_atual: 'ObterEstoqueAtual',
}

// ObterVersao precisa de pCodigoModelo + intervalo de datas — não se encaixa
// no mapa "sem parâmetro" acima. Adicionado especificamente para revalidar,
// com os parâmetros exatos que o suporte da Webmotors (Gabriel, 08/2026)
// pediu para testar: pCodigoModelo=730, pDataInicioAtualizacao=2010-01-01,
// pDataFimAtualizacao=2026-05-01.
function buildObterVersaoXML(hash: string, codigoModelo: string, dataInicio: string, dataFim: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ObterVersao xmlns="www.webmotors.com.br/wsEstoqueRevendedorWebMotors">
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pCodigoModelo>${codigoModelo}</pCodigoModelo>
      <pDataInicioAtualizacao>${dataInicio}</pDataInicioAtualizacao>
      <pDataFimAtualizacao>${dataFim}</pDataFimAtualizacao>
    </ObterVersao>
  </soap:Body>
</soap:Envelope>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const catalogo = body.catalogo || 'cores'
    const isVersao = catalogo === 'versao'
    const action = isVersao ? 'ObterVersao' : CATALOGOS_SEM_PARAMETRO[catalogo]
    if (!action) {
      return new Response(
        JSON.stringify({
          error: `catalogo "${catalogo}" desconhecido. Use um de: ${[...Object.keys(CATALOGOS_SEM_PARAMETRO), 'versao'].join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (isVersao && !body.codigo_modelo) {
      return new Response(
        JSON.stringify({ error: 'catalogo "versao" exige o parâmetro codigo_modelo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const creds: WMCredentials = {
      email: Deno.env.get('WM_EMAIL') || '',
      senha: Deno.env.get('WM_SENHA') || '',
      cnpj: Deno.env.get('WM_CNPJ') || '',
    }

    const authResult = await callSOAP(buildAuthXML(creds), 'autenticar')
    if (!authResult.success || !authResult.hashAutenticacao) {
      return new Response(
        JSON.stringify({ error: 'Auth failed', details: authResult.error }),
        {
          status: authResult.networkError ? 502 : 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
    const hash = authResult.hashAutenticacao

    const xml = isVersao
      ? buildObterVersaoXML(
          hash,
          String(body.codigo_modelo),
          body.data_inicio || '2010-01-01',
          body.data_fim || '2026-05-01',
        )
      : `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="www.webmotors.com.br/wsEstoqueRevendedorWebMotors">
      <pHashAutenticacao>${hash}</pHashAutenticacao>
    </${action}>
  </soap:Body>
</soap:Envelope>`

    const catalogResult = await callSOAP(xml, action, hash)
    if (!catalogResult.success) {
      return new Response(
        JSON.stringify({ error: catalogResult.error, raw: catalogResult.raw }),
        {
          status: catalogResult.networkError ? 502 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ success: true, raw: catalogResult.raw }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
