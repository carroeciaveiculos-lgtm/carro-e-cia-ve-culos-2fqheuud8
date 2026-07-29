import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP } from '../_shared/rate-limiter.ts'
import { getValidMLToken, fetchWithBackoff } from '../_shared/ml-client.ts'
import { populateAttributeCache, populateCityCache } from '../_shared/ml-cache.ts'
import { syncVehicleToML } from '../_shared/ml-sync-core.ts'
import { withSupabase } from 'npm:@supabase/server'

const colMap: Record<string, string> = {
  mercadolivre: 'publicado_mercadolivre',
  webmotors: 'publicado_webmotors',
  olx: 'publicado_olx',
  icarros: 'publicado_icarros',
  napista: 'publicado_napista',
}

export default {
  fetch: withSupabase({ auth: ['user', 'secret'] }, async (req: Request, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const ip = getClientIP(req)
    if (!checkRateLimit(ip)) return json({ error: 'Too many requests' }, 429)

    // ctx.authMode:
    // - 'user'  => ctx.supabase (RLS ativa)
    // - 'secret' => ctx.supabaseAdmin (bypass RLS)
    const supabase = ctx.authMode === 'secret' ? ctx.supabaseAdmin : ctx.supabase

    try {
      const body = await req.json().catch(() => ({}))
      const path = body.path || ''
      const segments = path.split('/').filter(Boolean)
      const slug = segments[0]
      const action = segments[1]

      if (!slug || slug === 'plataformas') {
        const { data } = await supabase
          .from('plataformas')
          .select('*')
          .eq('ativo', true)
          .order('nome')
        return json({ plataformas: data || [] })
      }

      if (slug === 'logs') {
        return await handleLogs(supabase, body)
      }

      if (slug === 'cache' && action === 'populate') {
        // Se você quiser PROIBIR populate para user JWT (recomendado),
        // descomente:
        // if (ctx.authMode !== 'secret') return json({ error: 'Forbidden' }, 403)

        return await handleCachePopulate(supabase)
      }

      const { data: plataforma } = await supabase
        .from('plataformas')
        .select('id, slug, nome')
        .eq('slug', slug)
        .single()

      if (!plataforma) return json({ error: 'Plataforma não encontrada' }, 404)

      if (action === 'dashboard') return await handleDashboard(supabase, slug, plataforma.id)
      if (action === 'sync') return await handleSync(supabase, body)
      if (action === 'veiculos' && segments[2] !== 'publicar')
        return await handleVeiculos(supabase, body)
      if (action === 'veiculos' && segments[2] === 'publicar') {
        return await handlePublish(supabase, slug, plataforma.id, body)
      }
      if (action === 'status') return await handleStatus(supabase, body)
      if (action === 'sync' && segments[2] === 'forcar') {
        return await handleForceSync(supabase, slug, plataforma)
      }

      return json({ error: 'Endpoint não encontrado' }, 404)
    } catch (err: any) {
      return json({ error: err?.message ?? String(err) }, 500)
    }
  }),
}

async function handleLogs(supabase: any, body: any) {
  const page = body.page || 1
  const pageSize = 20

  let query = supabase
    .from('sync_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (body.acao) query = query.eq('acao', body.acao)
  if (body.status) query = query.eq('status', body.status)

  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count } = await query
  return json({ logs: data || [], total: count || 0, page })
}

async function handleCachePopulate(supabase: any) {
  const { token, error: tokenError } = await getValidMLToken(supabase)
  if (tokenError || !token) return json({ error: tokenError || 'No ML token' }, 401)

  const attrResult = await populateAttributeCache(supabase, token)
  const cityResult = await populateCityCache(supabase, token)

  return json({ attributes: attrResult, cities: cityResult })
}

async function handleSync(supabase: any, body: any) {
  if (body.veiculo_id) {
    const result = await syncVehicleToML(supabase, body.veiculo_id)
    return json(result, result.success ? 200 : 400)
  }

  const { data: vehicles } = await supabase
    .from('veiculos')
    .select('id, marca, modelo')
    .eq('status', 'disponivel')
    .eq('exibir_no_site', true)
    .eq('elegivel_portais', true)
    .limit(body.batch_size || 50)

  if (!vehicles) return json({ error: 'No vehicles found' })

  const results: any[] = []
  for (const v of vehicles) {
    const r = await syncVehicleToML(supabase, v.id)
    results.push({ veiculo_id: v.id, marca: v.marca, modelo: v.modelo, ...r })
  }

  return json({ total: results.length, results })
}

async function handleStatus(supabase: any, body: any) {
  const mlItemId = body.ml_item_id
  if (!mlItemId) return json({ error: 'ml_item_id required' }, 400)

  const { token, error } = await getValidMLToken(supabase)
  if (error || !token) return json({ error: error || 'No token' }, 401)

  const res = await fetchWithBackoff(`https://api.mercadolibre.com/items/${mlItemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const mlData = await res.json()

  const { data: localListing } = await supabase
    .from('ml_listings')
    .select('*')
    .eq('ml_item_id', mlItemId)
    .maybeSingle()

  return json({
    ml: { id: mlData.id, status: mlData.status, price: mlData.price, title: mlData.title },
    local: localListing,
    diff: {
      status_mismatch: mlData.status !== localListing?.status,
      price_mismatch: mlData.price !== undefined && localListing?.status !== mlData.status,
    },
  })
}

async function handleDashboard(supabase: any, slug: string, plataformaId: string) {
  const col = colMap[slug]

  const { count: ativos } = await supabase
    .from('veiculos')
    .select('*', { count: 'exact', head: true })
    .eq(col, true)
    .eq('status', 'disponivel')

  const { count: erros } = await supabase
    .from('sync_log')
    .select('*', { count: 'exact', head: true })
    .eq('plataforma_id', plataformaId)
    .eq('status', 'erro')

  const { count: pendentes } = await supabase
    .from('sync_log')
    .select('*', { count: 'exact', head: true })
    .eq('plataforma_id', plataformaId)
    .eq('status', 'pending')

  const { data: integracao } = await supabase
    .from('integracao_plataforma')
    .select('status, ultima_sincronizacao, ultimo_erro')
    .eq('plataforma_id', plataformaId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let statusConexao = integracao?.status || 'desconectado'

  if (slug === 'mercadolivre') {
    const { data: mlCreds } = await supabase
      .from('ml_credentials')
      .select('access_token, expires_at')
      .limit(1)
      .maybeSingle()

    if (mlCreds?.access_token) {
      statusConexao =
        mlCreds.expires_at && new Date(mlCreds.expires_at) < new Date() ? 'expirando' : 'conectado'
    } else statusConexao = 'desconectado'
  }

  if ((erros || 0) > 0 && statusConexao === 'conectado') statusConexao = 'erro'

  return json({
    ativos: ativos || 0,
    erros: erros || 0,
    pendentes: pendentes || 0,
    ultima_sincronizacao: integracao?.ultima_sincronizacao || null,
    ultimo_erro: integracao?.ultimo_erro || null,
    status_conexao: statusConexao,
  })
}

async function handleVeiculos(supabase: any, body: any) {
  const page = body.page || 1
  const search = body.search || ''
  const pageSize = 24
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('veiculos')
    .select(
      'id,marca,modelo,versao,ano_modelo,quilometragem,placa,preco_venda,fotos,publicado_mercadolivre,publicado_webmotors,publicado_olx,publicado_icarros,publicado_napista,status,ml_listing_type',
      { count: 'exact' },
    )
    .eq('status', 'disponivel')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (search)
    query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,placa.ilike.%${search}%`)

  const { data, count } = await query
  return json({ veiculos: data || [], total: count || 0 })
}

async function handlePublish(supabase: any, slug: string, plataformaId: string, body: any) {
  const veiculoId = body.veiculo_id
  const publicar = body.publicar

  if (slug === 'mercadolivre' && publicar) {
    const { data: veiculo } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id', veiculoId)
      .single()
    if (!veiculo) return json({ error: 'Veículo não encontrado' }, 404)

    const fotos = Array.isArray(veiculo.fotos)
      ? veiculo.fotos.filter((u: any) => typeof u === 'string')
      : []
    if (fotos.length < 8)
      return json({ error: 'Mínimo de 8 fotos required para publicação no ML' }, 400)
  }

  const col = colMap[slug]
  const { error } = await supabase
    .from('veiculos')
    .update({ [col]: publicar })
    .eq('id', veiculoId)
  if (error) return json({ error: error.message }, 400)

  if (slug === 'mercadolivre') {
    if (publicar) {
      const result = await syncVehicleToML(supabase, veiculoId)
      if (!result.success) return json({ error: result.error, ml_item_id: result.ml_item_id }, 400)
      return json({ success: true, ml_item_id: result.ml_item_id })
    } else {
      await supabase
        .from('ml_listings')
        .update({ status: 'pending_close' })
        .eq('veiculo_id', veiculoId)
    }
  }

  await supabase.from('sync_log').insert({
    plataforma_id: plataformaId,
    veiculo_id: veiculoId,
    acao: publicar ? 'publish' : 'close',
    status: 'pending',
    mensagem: publicar ? 'Publicação solicitada' : 'Encerramento solicitado',
  })

  return json({ success: true })
}

async function handleForceSync(supabase: any, slug: string, plataforma: any) {
  // Recomendação: garantir chamadas internas com secret key em apikey,
  // mas aqui mantive sua ideia original do fetch.
  // Ajuste fino depende de como suas outras funções estão configuradas (verify_jwt etc).
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

  // ✅ Para compatibilidade com legacy, você pode usar SERVICE_ROLE_KEY.
  // Se você estiver migrado para new keys, troque isso para SUPABASE_SECRET_KEYS['default'].
  const serviceRoleLegacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (slug === 'mercadolivre') {
    await fetch(`${SUPABASE_URL}/functions/v1/ml-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ⚠️ idealmente seria apikey (secret key) e não Authorization.
        // Mantive legado para não quebrar seu sistema atual:
        Authorization: `Bearer ${serviceRoleLegacy}`,
      },
      body: '{}',
    })
  }

  await fetch(`${SUPABASE_URL}/functions/v1/sync-estoque`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleLegacy}`,
    },
    body: JSON.stringify({ plataforma: slug }),
  })

  await supabase.from('sync_log').insert({
    plataforma_id: plataforma.id,
    acao: 'force_sync',
    status: 'success',
    mensagem: `Sincronização forçada para ${plataforma.nome}`,
  })

  await supabase
    .from('integracao_plataforma')
    .update({
      status: 'conectado',
      ultima_sincronizacao: new Date().toISOString(),
      ultimo_erro: null,
    })
    .eq('plataforma_id', plataforma.id)

  return json({ success: true, message: `Sincronização forçada iniciada para ${plataforma.nome}` })
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
