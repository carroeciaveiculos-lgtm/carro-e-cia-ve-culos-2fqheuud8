import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildAuthXML, callSOAP, type WMCredentials } from '../_shared/wm-soap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const WM_ESTOQUE_NAMESPACE = 'www.webmotors.com.br/wsEstoqueRevendedorWebMotors'

// Único CodigoModalidade contratado nessa conta ("Anúncio Básico") — confirmado
// em 07/08/2026 via ObterModalidade (wm-catalog-fetch, catalogo=modalidade):
// resposta real da Webmotors, CodigoRetorno 500. Se a conta contratar uma
// segunda modalidade no futuro, isso precisa virar um mapeamento por tier
// (veiculos.ad_types.webmotors), não mais uma constante única.
const CODIGO_MODALIDADE_ANUNCIO_BASICO = '2943'

// Limiar de confianca (0 a 1). Abaixo disso, vai para revisao humana.
// Ponto de partida razoavel para trigram similarity em nomes curtos de veiculo;
// deve ser calibrado com dados reais de uso.
const LIMIAR_CONFIANCA = 0.35

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

// Match exato (case-insensitive) contra o catálogo já usado por wm-sync pra
// montar CodigoCor/CodigoCambio/CodigoCombustivel — essas 3 tabelas têm
// vocabulário mais padronizado que marca/modelo, então não precisam do trigram
// fuzzy-match usado ali embaixo; se não achar, vai pra revisão manual igual
// marca/modelo, em vez de deixar o código vazio (o guard em wm-sync bloqueia
// publicação sem esses códigos).
// Compara contra as DUAS colunas de nome, não só nome_wm:
//   nome_wm  = termo da Webmotors ("Automática", "Preto", "Gasolina e álcool")
//   nome_crm = termo equivalente no CRM ("Automático", "Preta", "Flex")
// Verificado em 10/08/2026: dos 26 disponíveis, ZERO casavam olhando só nome_wm.
// Precisa das duas porque o CRM tem grafias concorrentes para a mesma cor —
// "PRETA" (11 veículos) casa por nome_crm e "preto" (1) casa por nome_wm.
// A comparação é feita em memória: as três tabelas são minúsculas (17 cores,
// 6 câmbios, 11 combustíveis) e assim se evita montar filtro com valor vindo
// do banco, que quebraria em texto com vírgula (ex.: "Gasolina, álcool e gás
// natural").
async function matchCatalogoExato(
  supabase: any,
  tabela: string,
  valor: string | null | undefined,
): Promise<{ codigo_wm: string; nome_wm: string } | null> {
  if (!valor) return null
  const alvo = valor.trim().toLowerCase()
  if (!alvo) return null
  const { data } = await supabase.from(tabela).select('codigo_wm, nome_wm, nome_crm')
  const achado = (data || []).find(
    (r: any) =>
      (r.nome_crm || '').trim().toLowerCase() === alvo ||
      (r.nome_wm || '').trim().toLowerCase() === alvo,
  )
  // Devolve sempre o nome_wm: é ele que vai no XML da Webmotors (CorExterna,
  // Cambio, DescricaoCombustivel). Mandar o termo do CRM seria erro de dado.
  return achado ? { codigo_wm: achado.codigo_wm, nome_wm: achado.nome_wm } : null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { veiculo_id } = await req.json()
    if (!veiculo_id) throw new Error('veiculo_id obrigatorio')

    const { data: veiculo, error: veiculoErr } = await supabase
      .from('veiculos')
      .select('id, marca, modelo, versao, combustivel, cor, cambio')
      .eq('id', veiculo_id)
      .single()
    if (veiculoErr || !veiculo) throw new Error('Veiculo nao encontrado')

    const textoModeloCompleto = [veiculo.modelo, veiculo.versao].filter(Boolean).join(' ')

    // 1) MARCA - trigram match contra wm_marcas
    const { data: marcaMatches } = await supabase.rpc('match_wm_marca', {
      texto_busca: veiculo.marca || '',
    })
    const melhorMarca = marcaMatches?.[0]
    const confiancaMarca = melhorMarca?.score ?? 0

    if (!melhorMarca || confiancaMarca < LIMIAR_CONFIANCA) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Marca "${veiculo.marca}" sem correspondencia confiavel no catalogo Webmotors`,
        confianca_marca: confiancaMarca,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'marca' })
    }

    // 2) MODELO - trigram match contra wm_modelos filtrado pela marca encontrada
    const { data: modeloMatches } = await supabase.rpc('match_wm_modelo', {
      texto_busca: textoModeloCompleto,
      p_codigo_marca_wm: melhorMarca.codigo_wm,
    })
    const melhorModelo = modeloMatches?.[0]
    const confiancaModelo = melhorModelo?.score ?? 0
    const candidatosModelo = (modeloMatches || []).slice(0, 3)

    if (!melhorModelo || confiancaModelo < LIMIAR_CONFIANCA) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Modelo "${textoModeloCompleto}" sem correspondencia confiavel`,
        codigo_marca_wm: melhorMarca.codigo_wm,
        confianca_marca: confiancaMarca,
        confianca_modelo: confiancaModelo,
        candidatos_modelo: candidatosModelo,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'modelo' })
    }

    // 3) VERSAO - verifica cache; se vazio para esse modelo, busca ao vivo na Webmotors
    const { data: versoesCache } = await supabase
      .from('wm_versoes')
      .select('codigo_wm, nome_wm')
      .eq('codigo_modelo_wm', melhorModelo.codigo_wm)

    let versoes = versoesCache || []
    if (versoes.length === 0) {
      const hash = await autenticar()
      // O ObterVersao exige o intervalo de atualização além do pCodigoModelo —
      // indicado pelo suporte da Webmotors (Gabriel, 08/2026). Até aqui essa
      // chamada mandava só o código do modelo. A data final é calculada na hora,
      // e não fixada no 2026-05-01 do exemplo dele, senão versões lançadas depois
      // dessa data parariam de aparecer conforme o código envelhecesse.
      const dataFimAtualizacao = new Date().toISOString().slice(0, 10)
      const obterVersaoXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ObterVersao xmlns="${WM_ESTOQUE_NAMESPACE}">
      <pHashAutenticacao>${hash}</pHashAutenticacao>
      <pCodigoModelo>${melhorModelo.codigo_wm}</pCodigoModelo>
      <pDataInicioAtualizacao>2010-01-01</pDataInicioAtualizacao>
      <pDataFimAtualizacao>${dataFimAtualizacao}</pDataFimAtualizacao>
    </ObterVersao>
  </soap:Body>
</soap:Envelope>`
      const versaoResult = await callSOAP(obterVersaoXml, 'ObterVersao', hash)
      if (!versaoResult.success) {
        throw new Error(versaoResult.error || 'Falha ao obter versões da Webmotors')
      }
      const xml = versaoResult.raw || ''
      // A tag do item é <Versao>, NÃO <VersaoWM>. Verificado no XML real em
      // 10/08/2026: 21 ocorrências de <Versao> e zero de <VersaoWM>. O sufixo
      // WM existe nessa API (o ObterModelo devolve <ModeloWM>, e aqui mesmo há
      // <AnoModeloWM> aninhado), mas não no item de versão — a API é
      // inconsistente. Com 'VersaoWM' o parser não achava nada e a falha era
      // silenciosa: wm_versoes ficava vazia e todo veículo caía em
      // revisao_necessaria com motivo "versao", sem erro registrado.
      const itens = parseItems(xml, 'Versao')
      const novasVersoes = itens
        .filter((v) => v.CodigoVersao)
        .map((v) => ({
          codigo_modelo_wm: melhorModelo.codigo_wm,
          nome_crm: v.NomeVersao || `Versao_${v.CodigoVersao}`,
          nome_wm: v.NomeVersao || null,
          codigo_wm: v.CodigoVersao,
        }))
      if (novasVersoes.length > 0) {
        await supabase.from('wm_versoes').insert(novasVersoes)
        versoes = novasVersoes.map((v) => ({ codigo_wm: v.codigo_wm, nome_wm: v.nome_wm }))
      }
    }

    // Match aproximado em memoria (poucas versoes por modelo, nao precisa de SQL)
    const versoesComScore = versoes
      .map((v: any) => ({
        codigo_wm: v.codigo_wm,
        nome_wm: v.nome_wm,
        score: similaridade(textoModeloCompleto, v.nome_wm || ''),
      }))
      .sort((a, b) => b.score - a.score)

    const melhorVersao = versoesComScore[0]
    const confiancaVersao = melhorVersao?.score ?? 0
    const candidatosVersao = versoesComScore.slice(0, 3)

    if (!melhorVersao || confiancaVersao < LIMIAR_CONFIANCA) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Versao para "${textoModeloCompleto}" sem correspondencia confiavel`,
        codigo_marca_wm: melhorMarca.codigo_wm,
        codigo_modelo_wm: melhorModelo.codigo_wm,
        confianca_marca: confiancaMarca,
        confianca_modelo: confiancaModelo,
        confianca_versao: confiancaVersao,
        candidatos_modelo: candidatosModelo,
        candidatos_versao: candidatosVersao,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'versao' })
    }

    // 4) COR / CÂMBIO / COMBUSTÍVEL - match exato contra o catálogo (mesmas
    // tabelas que wm-sync já usa pra montar Codigo/Descricao no XML). Sem
    // esses 3 códigos o guard em wm-sync bloqueia a publicação, então trata
    // como pendência de revisão igual marca/modelo/versão, em vez de mandar
    // o veículo pra "mapeado" com códigos faltando.
    const [corMatch, cambioMatch, combustivelMatch] = await Promise.all([
      matchCatalogoExato(supabase, 'wm_cores', veiculo.cor),
      matchCatalogoExato(supabase, 'wm_cambios', veiculo.cambio),
      matchCatalogoExato(supabase, 'wm_combustiveis', veiculo.combustivel),
    ])

    const catalogosFaltando = [
      !corMatch && `cor ("${veiculo.cor ?? ''}")`,
      !cambioMatch && `câmbio ("${veiculo.cambio ?? ''}")`,
      !combustivelMatch && `combustível ("${veiculo.combustivel ?? ''}")`,
    ].filter(Boolean)

    if (catalogosFaltando.length > 0) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Sem correspondência exata no catálogo Webmotors para: ${catalogosFaltando.join(', ')}. Cadastre o valor equivalente em wm_cores/wm_cambios/wm_combustiveis ou ajuste o texto no veículo.`,
        codigo_marca_wm: melhorMarca.codigo_wm,
        codigo_modelo_wm: melhorModelo.codigo_wm,
        codigo_versao_wm: melhorVersao.codigo_wm,
        confianca_marca: confiancaMarca,
        confianca_modelo: confiancaModelo,
        confianca_versao: confiancaVersao,
        candidatos_modelo: candidatosModelo,
        candidatos_versao: candidatosVersao,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'catalogo_wm' })
    }

    // Tudo com confianca suficiente - mapeamento automatico
    await salvarPendencia(supabase, veiculo_id, {
      status_sincronizacao: 'mapeado',
      codigo_marca_wm: melhorMarca.codigo_wm,
      codigo_modelo_wm: melhorModelo.codigo_wm,
      codigo_versao_wm: melhorVersao.codigo_wm,
      codigo_cor_wm: corMatch!.codigo_wm,
      codigo_cambio_wm: cambioMatch!.codigo_wm,
      codigo_combustivel_wm: combustivelMatch!.codigo_wm,
      codigo_modalidade_wm: CODIGO_MODALIDADE_ANUNCIO_BASICO,
      confianca_marca: confiancaMarca,
      confianca_modelo: confiancaModelo,
      confianca_versao: confiancaVersao,
      erro_msg: null,
    })

    return responder({ success: true, status: 'mapeado' })
  } catch (err: any) {
    return responder({ success: false, error: err.message })
  }
})

function similaridade(a: string, b: string): number {
  // Jaccard sobre trigramas em JS - usado só para a lista pequena de versões (já filtrada por modelo)
  const trigramas = (s: string) => {
    const t = ` ${s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')} `
    const set = new Set<string>()
    for (let i = 0; i < t.length - 2; i++) set.add(t.slice(i, i + 3))
    return set
  }
  const ta = trigramas(a)
  const tb = trigramas(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const g of ta) if (tb.has(g)) inter++
  return inter / (ta.size + tb.size - inter)
}

async function salvarPendencia(supabase: any, veiculo_id: string, campos: Record<string, any>) {
  const { data: existing } = await supabase
    .from('wm_mapeamento_veiculos')
    .select('id')
    .eq('veiculo_id', veiculo_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('wm_mapeamento_veiculos').update(campos).eq('id', existing.id)
  } else {
    await supabase.from('wm_mapeamento_veiculos').insert({ veiculo_id, ...campos })
  }

  if (campos.status_sincronizacao === 'revisao_necessaria') {
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculo_id)
  } else if (campos.status_sincronizacao === 'mapeado') {
    // Corrigido em 12/08/2026: só wm-confirmar-mapeamento limpava requires_review.
    // Quando o auto-match acerta de primeira (sem precisar de revisão manual),
    // o veículo ficava com requires_review=true pra sempre, mesmo mapeado.
    await supabase.from('veiculos').update({ requires_review: false }).eq('id', veiculo_id)
  }
}

function responder(body: Record<string, any>) {
  return new Response(JSON.stringify(body), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  })
}
