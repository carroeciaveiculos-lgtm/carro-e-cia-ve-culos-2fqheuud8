import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Não autorizado: token de autenticação ausente' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return json({ error: 'Não autorizado: token inválido' }, 401)
  }

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

    const { data: plataforma } = await supabase
      .from('plataformas')
      .select('id, slug, nome')
      .eq('slug', slug)
      .single()
    if (!plataforma) return json({ error: 'Plataforma não encontrada' }, 404)

    if (action === 'dashboard') {
      const colMap: Record<string, string> = {
        mercadolivre: 'publicado_mercadolivre',
        webmotors: 'publicado_webmotors',
        olx: 'publicado_olx',
        icarros: 'publicado_icarros',
        napista: 'publicado_napista',
      }
      const col = colMap[slug]
      const { count: ativos } = await supabase
        .from('veiculos')
        .select('*', { count: 'exact', head: true })
        .eq(col, true)
        .eq('status', 'disponivel')
      const { count: erros } = await supabase
        .from('sync_log')
        .select('*', { count: 'exact', head: true })
        .eq('plataforma_id', plataforma.id)
        .eq('status', 'erro')
      const { count: pendentes } = await supabase
        .from('sync_log')
        .select('*', { count: 'exact', head: true })
        .eq('plataforma_id', plataforma.id)
        .eq('status', 'pending')

      const { data: integracao } = await supabase
        .from('integracao_plataforma')
        .select('status, ultima_sincronizacao, ultimo_erro')
        .eq('plataforma_id', plataforma.id)
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
          const isExpired = mlCreds.expires_at && new Date(mlCreds.expires_at) < new Date()
          statusConexao = isExpired ? 'expirando' : 'conectado'
        } else {
          statusConexao = 'desconectado'
        }
      }

      if ((erros || 0) > 0 && statusConexao === 'conectado') {
        statusConexao = 'erro'
      }

      return json({
        ativos: ativos || 0,
        erros: erros || 0,
        pendentes: pendentes || 0,
        ultima_sincronizacao: integracao?.ultima_sincronizacao || null,
        ultimo_erro: integracao?.ultimo_erro || null,
        status_conexao: statusConexao,
      })
    }

    if (action === 'veiculos' && segments[2] !== 'publicar') {
      const page = body.page || 1
      const search = body.search || ''
      const pageSize = 24
      const offset = (page - 1) * pageSize
      let query = supabase
        .from('veiculos')
        .select(
          'id,marca,modelo,versao,ano_modelo,quilometragem,placa,preco_venda,fotos,publicado_mercadolivre,publicado_webmotors,publicado_olx,publicado_icarros,publicado_napista,status',
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

    if (action === 'sync' && segments[2] === 'forcar') {
      if (slug === 'mercadolivre') {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ml-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: '{}',
        })
      }

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-estoque`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ plataforma: slug }),
      })

      await supabase.from('sync_log').insert({
        plataforma_id: plataforma.id,
        acao: 'force_sync',
        status: 'success',
        mensagem: `Sincronização forçada pelo admin para ${plataforma.nome}`,
      })

      await supabase
        .from('integracao_plataforma')
        .update({
          status: 'conectado',
          ultima_sincronizacao: new Date().toISOString(),
          ultimo_erro: null,
        })
        .eq('plataforma_id', plataforma.id)

      return json({
        success: true,
        message: `Sincronização forçada iniciada para ${plataforma.nome}`,
      })
    }

    if (action === 'veiculos' && segments[2] === 'publicar') {
      const veiculoId = body.veiculo_id
      const publicar = body.publicar
      const colMap: Record<string, string> = {
        mercadolivre: 'publicado_mercadolivre',
        webmotors: 'publicado_webmotors',
        olx: 'publicado_olx',
        icarros: 'publicado_icarros',
        napista: 'publicado_napista',
      }
      const col = colMap[slug]
      const { error } = await supabase
        .from('veiculos')
        .update({ [col]: publicar })
        .eq('id', veiculoId)
      if (error) return json({ error: error.message }, 400)

      if (slug === 'mercadolivre') {
        if (publicar) {
          await supabase
            .from('ml_listings')
            .upsert(
              { veiculo_id: veiculoId, status: 'pending_create' },
              { onConflict: 'veiculo_id' },
            )
        } else {
          await supabase
            .from('ml_listings')
            .update({ status: 'pending_close' })
            .eq('veiculo_id', veiculoId)
        }
      }

      await supabase.from('sync_log').insert({
        plataforma_id: plataforma.id,
        veiculo_id: veiculoId,
        acao: publicar ? 'publish' : 'close',
        status: 'pending',
        mensagem: publicar ? 'Publicação solicitada' : 'Encerramento solicitado',
      })
      return json({ success: true })
    }

    return json({ error: 'Endpoint não encontrado' }, 404)
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
