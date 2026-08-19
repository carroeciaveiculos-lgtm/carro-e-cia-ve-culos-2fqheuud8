import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidNapistaToken } from '../_shared/napista-client.ts'

// Produção desde 18/08/2026 — ver docs/integracao-napista.md.
const BASE = 'https://api.napista.com.br/seller-inventory-api'

function buildOfferPayload(veiculo: any, mapeamento: any) {
  return {
    versionId: mapeamento.napista_version_id,
    description: veiculo.descricao || `${veiculo.marca} ${veiculo.modelo}`,
    modelYear: Number(veiculo.ano_modelo) || Number(veiculo.ano_fabricacao),
    manufacturedYear: Number(veiculo.ano_fabricacao) || Number(veiculo.ano_modelo),
    mileage: Math.round(Number(veiculo.quilometragem) || 0),
    armoured: false,
    price: Math.round(Number(veiculo.preco_venda) || 0),
    plate: veiculo.placa || undefined,
    fuelType: mapeamento.codigo_combustivel,
    color: mapeamento.codigo_cor,
    transmissionType: mapeamento.codigo_cambio,
    numberOfDoors: veiculo.portas ? Number(veiculo.portas) : undefined,
  }
}

async function enviarFotos(
  token: string,
  sellerId: string,
  offerId: string,
  fotos: string[],
): Promise<{ enviadas: number; error?: string }> {
  // Limite real do NaPista: 10 fotos por anúncio — não documentado, achado
  // testando ao vivo (14/08/2026). Acima disso, a API rejeita a lista
  // INTEIRA com 412 "The maximum number of photos in this Offer has been
  // reached!", não só as fotos excedentes.
  const list = fotos
    .filter((url) => typeof url === 'string' && url)
    .slice(0, 10)
    .map((url, order) => ({ url, order }))
  if (list.length === 0) return { enviadas: 0 }
  const res = await fetch(`${BASE}/seller/${sellerId}/offer/${offerId}/photos/url`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ list }),
  })
  if (!res.ok) return { enviadas: 0, error: `Fotos: HTTP ${res.status} — ${await res.text()}` }
  return { enviadas: list.length }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const specificVeiculoId = body.veiculo_id

    const { token, sellerId, error: tokenError } = await getValidNapistaToken(supabase)
    if (!token || !sellerId) {
      return new Response(JSON.stringify({ error: tokenError || 'Sem token/sellerId do NaPista' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: napistaPlataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'napista')
      .maybeSingle()

    let pubQuery = supabase
      .from('estoque_publicacoes')
      .select('id, veiculo_id, platform, status, post_id')
      .eq('platform', 'napista')
      .in('status', ['agendado', 'pending_create', 'pending_update', 'pending_close'])

    if (specificVeiculoId) pubQuery = pubQuery.eq('veiculo_id', specificVeiculoId)

    const { data: pendingPubs } = await pubQuery.limit(50)
    if (!pendingPubs || pendingPubs.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any[] = []
    for (const pub of pendingPubs) {
      const { data: veiculo } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', pub.veiculo_id)
        .maybeSingle()

      if (!veiculo) {
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: 'Veículo não encontrado' })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: 'Veículo não encontrado' })
        continue
      }

      const { data: mapeamento } = await supabase
        .from('napista_mapeamento_veiculos')
        .select('*')
        .eq('veiculo_id', veiculo.id)
        .maybeSingle()

      if (!mapeamento || mapeamento.status_sincronizacao !== 'mapeado') {
        const msg =
          'Veículo sem mapeamento de catálogo NaPista confirmado (marca/modelo/versão/cor/câmbio/combustível). Publicação bloqueada até mapear — ver aba NaPista em /admin/portais.'
        await supabase.from('estoque_publicacoes').update({ status: 'error', erro_msg: msg }).eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: msg })
        continue
      }

      const payload = buildOfferPayload(veiculo, mapeamento)
      const fotosVeiculo: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []

      try {
        if (pub.status === 'pending_create' || pub.status === 'agendado') {
          const res = await fetch(`${BASE}/seller/${sellerId}/offer`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.id) {
            await supabase
              .from('napista_mapeamento_veiculos')
              .update({ napista_offer_id: data.id })
              .eq('id', mapeamento.id)
            await supabase
              .from('estoque_publicacoes')
              .update({
                status: 'publicado',
                post_id: data.id,
                publicado_em: new Date().toISOString(),
                erro_msg: null,
              })
              .eq('id', pub.id)
            await supabase.from('veiculos').update({ publicado_napista: true }).eq('id', veiculo.id)
            const fotosResultado = await enviarFotos(token, sellerId, data.id, fotosVeiculo)
            results.push({ id: pub.id, status: 'created', offerId: data.id, fotos: fotosResultado })
          } else {
            const msg = `HTTP ${res.status} — ${JSON.stringify(data)}`
            await supabase.from('estoque_publicacoes').update({ status: 'error', erro_msg: msg }).eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: msg })
          }
        } else if (pub.status === 'pending_update' && pub.post_id) {
          const res = await fetch(`${BASE}/seller/${sellerId}/offer/${pub.post_id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (res.ok) {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'publicado', erro_msg: null })
              .eq('id', pub.id)
            // Sempre reenvia — o endpoint de fotos sobrescreve a lista inteira,
            // então "atualizar" significa mandar a lista atual de novo, não só
            // as novas (diferente do wm-sync, que só manda se a Webmotors não
            // tiver nenhuma foto ainda).
            const fotosResultado = await enviarFotos(token, sellerId, pub.post_id, fotosVeiculo)
            results.push({ id: pub.id, status: 'updated', fotos: fotosResultado })
          } else {
            const errText = await res.text()
            const msg = `HTTP ${res.status} — ${errText}`
            await supabase.from('estoque_publicacoes').update({ status: 'error', erro_msg: msg }).eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: msg })
          }
        } else if (pub.status === 'pending_close' && pub.post_id) {
          const res = await fetch(`${BASE}/seller/${sellerId}/offer/${pub.post_id}/UNPUBLISHED`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            await supabase.from('estoque_publicacoes').update({ status: 'despublicado' }).eq('id', pub.id)
            const { count: outrasPublicadas } = await supabase
              .from('estoque_publicacoes')
              .select('id', { count: 'exact', head: true })
              .eq('veiculo_id', veiculo.id)
              .eq('platform', 'napista')
              .eq('status', 'publicado')
              .neq('id', pub.id)
            if (!outrasPublicadas) {
              await supabase.from('veiculos').update({ publicado_napista: false }).eq('id', veiculo.id)
            }
            results.push({ id: pub.id, status: 'closed' })
          } else {
            const errText = await res.text()
            results.push({ id: pub.id, status: 'error', error: `HTTP ${res.status} — ${errText}` })
          }
        }
      } catch (err: any) {
        results.push({ id: pub.id, status: 'error', error: err.message })
      }
    }

    if (napistaPlataforma) {
      const logs = results.map((r) => ({
        plataforma_id: napistaPlataforma.id,
        veiculo_id: pendingPubs.find((p) => p.id === r.id)?.veiculo_id,
        acao:
          r.status === 'created' ? 'create' : r.status === 'updated' ? 'update' : r.status === 'closed' ? 'close' : 'error',
        status: r.status === 'error' ? 'erro' : 'success',
        mensagem: r.error || `NaPista sync ${r.status}`,
        metadata: { offerId: r.offerId },
      }))
      if (logs.length > 0) await supabase.from('sync_log').insert(logs)
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
