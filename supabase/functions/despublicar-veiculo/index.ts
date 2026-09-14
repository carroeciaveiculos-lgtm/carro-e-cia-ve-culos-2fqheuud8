import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Botão "Despublicar" na lista de Estoque (pedido da Adriana, 14/09/2026):
// descobre em quais plataformas o veículo tem anúncio ativo e despublica de
// todas de uma vez, sem mudar o status do veículo (continua "disponível").
// Reaproveita os mesmos mecanismos já testados que o painel de Portais usa
// pra despublicar 1 plataforma por vez (Portais.tsx) e que publicar-manual
// (function antiga, orfã, sem uso real) já fazia — só que juntando as 3
// plataformas num botão só.
//
// Achado 14/09/2026: `estoque_publicacoes` pode ter VÁRIAS linhas pro mesmo
// veiculo_id+platform (sem unique constraint, é histórico de tentativas) —
// sempre pega a mais recente, nunca assume 1 linha só. wm-sync/napista-sync
// já fazem essa mesma escolha internamente quando chamadas com veiculo_id
// específico, então só precisamos marcar a linha certa como pending_close
// antes de chamar.

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (!caller) return jsonResponse({ error: 'Não autenticado' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerRow } = await admin
      .from('usuarios')
      .select('nivel')
      .eq('id', caller.id)
      .single()

    if (!callerRow || callerRow.nivel === 'bloqueado') {
      return jsonResponse({ error: 'Sem permissão' }, 403)
    }
    if (callerRow.nivel !== 'admin_master') {
      const { data: setorRow } = await admin
        .from('usuario_setores')
        .select('setor_id, setores!inner(nome)')
        .eq('usuario_id', caller.id)
        .eq('setores.nome', 'Estoque/Portais')
        .maybeSingle()
      if (!setorRow) {
        return jsonResponse({ error: 'Apenas o setor Estoque/Portais pode despublicar' }, 403)
      }
    }

    const { veiculo_id } = (await req.json()) as { veiculo_id?: string }
    if (!veiculo_id) return jsonResponse({ error: 'veiculo_id é obrigatório' }, 400)

    const { data: veiculo } = await admin
      .from('veiculos')
      .select('id')
      .eq('id', veiculo_id)
      .maybeSingle()
    if (!veiculo) return jsonResponse({ error: 'Veículo não encontrado' }, 404)

    const resultados: Record<string, { success: boolean; message: string }> = {}

    // Webmotors e NaPista: pega a linha MAIS RECENTE dessa plataforma com
    // post_id (anúncio de verdade), marca pending_close, chama o sync.
    for (const [platform, syncFn] of [
      ['webmotors', 'wm-sync'],
      ['napista', 'napista-sync'],
    ] as const) {
      const { data: pubRow } = await admin
        .from('estoque_publicacoes')
        .select('id, post_id, status')
        .eq('veiculo_id', veiculo_id)
        .eq('platform', platform)
        .not('post_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!pubRow || pubRow.status === 'pending_close') continue // nada publicado, ou já despublicando

      await admin
        .from('estoque_publicacoes')
        .update({
          status: 'pending_close',
          erro_msg: null,
          alterado_manualmente_por: caller.id,
          alterado_manualmente_em: new Date().toISOString(),
        })
        .eq('id', pubRow.id)

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${syncFn}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({ veiculo_id }),
        })
        resultados[platform] = {
          success: res.ok,
          message: res.ok ? 'despublicado' : `erro ${res.status} ao sincronizar`,
        }
      } catch (e: any) {
        resultados[platform] = { success: false, message: e.message }
      }
    }

    // Mercado Livre: estado real fica em ml_listings, nao em
    // estoque_publicacoes (achado 14/09/2026).
    const { data: mlListing } = await admin
      .from('ml_listings')
      .select('id, status')
      .eq('veiculo_id', veiculo_id)
      .eq('status', 'active')
      .maybeSingle()

    if (mlListing) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/sync-plataforma`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({ veiculo_id, platform: 'mercadolivre', action: 'unpublish' }),
        })
        const data = await res.json().catch(() => ({}))
        resultados.mercadolivre = {
          success: res.ok && data?.success !== false,
          message: data?.message || (res.ok ? 'despublicado' : `erro ${res.status}`),
        }
      } catch (e: any) {
        resultados.mercadolivre = { success: false, message: e.message }
      }
    }

    if (Object.keys(resultados).length === 0) {
      return jsonResponse({
        success: true,
        message: 'Este veículo não tinha anúncio ativo em nenhuma plataforma.',
        resultados: {},
      })
    }

    return jsonResponse({ success: true, resultados })
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Erro interno' }, 500)
  }
})
