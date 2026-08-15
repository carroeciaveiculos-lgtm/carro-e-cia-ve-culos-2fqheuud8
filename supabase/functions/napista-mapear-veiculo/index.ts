import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidNapistaToken, matchAtributoNapista } from '../_shared/napista-client.ts'

const BASE = 'https://api.development.napista.com.br/seller-inventory-api'

// Mesmo limiar do wm-mapear-veiculo — ponto de partida pra trigram
// similarity em nomes curtos de veículo, calibrar com uso real.
const LIMIAR_CONFIANCA = 0.35

function normalizar(s: string | null | undefined): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

// Jaccard sobre trigramas — mesmo algoritmo do wm-mapear-veiculo, usado só
// pra versões (lista pequena, já filtrada por modelo, não precisa de SQL).
function similaridade(a: string, b: string): number {
  const trigramas = (s: string) => {
    const t = ` ${normalizar(s)} `
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

async function salvarPendencia(supabase: any, veiculoId: string, campos: Record<string, any>) {
  const { data: existing } = await supabase
    .from('napista_mapeamento_veiculos')
    .select('id')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  if (existing) {
    await supabase.from('napista_mapeamento_veiculos').update(campos).eq('id', existing.id)
  } else {
    await supabase.from('napista_mapeamento_veiculos').insert({ veiculo_id: veiculoId, ...campos })
  }

  if (campos.status_sincronizacao === 'revisao_necessaria') {
    await supabase.from('veiculos').update({ requires_review: true }).eq('id', veiculoId)
  } else if (campos.status_sincronizacao === 'mapeado') {
    await supabase.from('veiculos').update({ requires_review: false }).eq('id', veiculoId)
  }
}

function responder(body: Record<string, any>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
      .select('id, marca, modelo, versao, combustivel, cor, cambio, ano_modelo')
      .eq('id', veiculo_id)
      .single()
    if (veiculoErr || !veiculo) throw new Error('Veiculo nao encontrado')

    const textoModeloCompleto = [veiculo.modelo, veiculo.versao].filter(Boolean).join(' ')

    // 1) MARCA - trigram match contra napista_marcas
    const { data: marcaMatches } = await supabase.rpc('match_napista_marca', {
      texto_busca: veiculo.marca || '',
    })
    const melhorMarca = marcaMatches?.[0]
    const confiancaMarca = melhorMarca?.score ?? 0

    if (!melhorMarca || confiancaMarca < LIMIAR_CONFIANCA) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Marca "${veiculo.marca}" sem correspondência confiável no catálogo NaPista. Rode a sincronização de catálogo primeiro.`,
        confianca_marca: confiancaMarca,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'marca' })
    }

    // 2) MODELO - trigram match contra napista_modelos filtrado pela marca
    const { data: modeloMatches } = await supabase.rpc('match_napista_modelo', {
      texto_busca: textoModeloCompleto,
      p_marca_id: melhorMarca.id,
    })
    const melhorModelo = modeloMatches?.[0]
    const confiancaModelo = melhorModelo?.score ?? 0
    const candidatosModelo = (modeloMatches || []).slice(0, 3)

    if (!melhorModelo || confiancaModelo < LIMIAR_CONFIANCA) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Modelo "${textoModeloCompleto}" sem correspondência confiável`,
        napista_marca_id: melhorMarca.id,
        confianca_marca: confiancaMarca,
        confianca_modelo: confiancaModelo,
        candidatos_modelo: candidatosModelo,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'modelo' })
    }

    // 3) VERSAO - verifica cache PARA O ANO DO VEÍCULO; se vazio, busca ao
    // vivo na API do NaPista com o filtro modelYear. Achado testando ao vivo
    // (14/08/2026): o mesmo modelo tem conjuntos de versionId BEM diferentes
    // por ano — cachear sem separar por ano devolvia versão de outro ano,
    // que o NaPista rejeita no cadastro ("versionId invalid for the
    // informed modelYear").
    const anoModelo = Number(veiculo.ano_modelo) || null
    const { data: versoesCache } = await supabase
      .from('napista_versoes')
      .select('id, nome')
      .eq('modelo_id', melhorModelo.id)
      .eq('model_year', anoModelo)

    let versoes = versoesCache || []
    if (versoes.length === 0) {
      const { token, error: tokenError } = await getValidNapistaToken(supabase)
      if (!token) throw new Error(tokenError || 'Sem token válido do NaPista')

      const yearParam = anoModelo ? `&modelYear=${anoModelo}` : ''
      const res = await fetch(
        `${BASE}/catalog/versions/CAR?modelId=${encodeURIComponent(melhorModelo.id)}${yearParam}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error(`Falha ao buscar versões no NaPista: ${res.status}`)
      const data = await res.json()
      const novasVersoes = (data.items || [])
        .filter((v: any) => v.id)
        .map((v: any) => ({
          id: v.id,
          modelo_id: melhorModelo.id,
          marca_id: melhorMarca.id,
          nome: v.name,
          model_year: anoModelo,
          atualizado_em: new Date().toISOString(),
        }))
      if (novasVersoes.length > 0) {
        await supabase.from('napista_versoes').upsert(novasVersoes, { onConflict: 'id' })
        versoes = novasVersoes
      }
    }

    const versoesComScore = versoes
      .map((v: any) => ({ id: v.id, nome: v.nome, score: similaridade(textoModeloCompleto, v.nome || '') }))
      .sort((a: any, b: any) => b.score - a.score)

    const melhorVersao = versoesComScore[0]
    const confiancaVersao = melhorVersao?.score ?? 0
    const candidatosVersao = versoesComScore.slice(0, 3)

    if (!melhorVersao || confiancaVersao < LIMIAR_CONFIANCA) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Versão para "${textoModeloCompleto}" sem correspondência confiável`,
        napista_marca_id: melhorMarca.id,
        napista_modelo_id: melhorModelo.id,
        confianca_marca: confiancaMarca,
        confianca_modelo: confiancaModelo,
        confianca_versao: confiancaVersao,
        candidatos_modelo: candidatosModelo,
        candidatos_versao: candidatosVersao,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'versao' })
    }

    // 4) COR / CÂMBIO / COMBUSTÍVEL - match exato contra os enums fixos do
    // NaPista (napista_atributos.dados), populados por napista-sync-catalogo.
    const { data: atributosRow } = await supabase
      .from('napista_atributos')
      .select('dados')
      .eq('id', 'catalogo')
      .maybeSingle()
    const atributos = atributosRow?.dados || {}

    const codigoCor = matchAtributoNapista(atributos.colors?.items, veiculo.cor)
    const codigoCambio = matchAtributoNapista(atributos.transmissionTypes?.items, veiculo.cambio)
    const codigoCombustivel = matchAtributoNapista(atributos.fuelTypes?.items, veiculo.combustivel)

    const faltando = [
      !codigoCor && `cor ("${veiculo.cor ?? ''}")`,
      !codigoCambio && `câmbio ("${veiculo.cambio ?? ''}")`,
      !codigoCombustivel && `combustível ("${veiculo.combustivel ?? ''}")`,
    ].filter(Boolean)

    if (faltando.length > 0) {
      await salvarPendencia(supabase, veiculo_id, {
        status_sincronizacao: 'revisao_necessaria',
        erro_msg: `Sem correspondência exata no catálogo NaPista para: ${faltando.join(', ')}. Rode a sincronização de atributos (napista-sync-catalogo, action: sync_atributos) ou ajuste o texto no veículo.`,
        napista_marca_id: melhorMarca.id,
        napista_modelo_id: melhorModelo.id,
        napista_version_id: melhorVersao.id,
        confianca_marca: confiancaMarca,
        confianca_modelo: confiancaModelo,
        confianca_versao: confiancaVersao,
        candidatos_modelo: candidatosModelo,
        candidatos_versao: candidatosVersao,
      })
      return responder({ success: true, status: 'revisao_necessaria', motivo: 'catalogo_napista' })
    }

    // Tudo com confiança suficiente - mapeamento automático
    await salvarPendencia(supabase, veiculo_id, {
      status_sincronizacao: 'mapeado',
      napista_marca_id: melhorMarca.id,
      napista_modelo_id: melhorModelo.id,
      napista_version_id: melhorVersao.id,
      codigo_cor: codigoCor,
      codigo_cambio: codigoCambio,
      codigo_combustivel: codigoCombustivel,
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
