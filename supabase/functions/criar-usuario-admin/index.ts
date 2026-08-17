import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization') ?? ''

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()

    if (!caller) return jsonResponse({ error: 'Não autenticado' }, 401)

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerRow } = await adminClient
      .from('usuarios')
      .select('nivel')
      .eq('id', caller.id)
      .single()

    if (callerRow?.nivel !== 'admin_master') {
      return jsonResponse({ error: 'Apenas administradores master podem criar usuários' }, 403)
    }

    const { nome, email, senha, nivel, setorIds } = await req.json()

    if (!nome || !email || !senha) {
      return jsonResponse({ error: 'Nome, e-mail e senha são obrigatórios' }, 400)
    }
    if (senha.length < 8) {
      return jsonResponse({ error: 'Senha precisa ter no mínimo 8 caracteres' }, 400)
    }

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    })

    if (createErr || !created.user) {
      return jsonResponse({ error: createErr?.message ?? 'Falha ao criar usuário' }, 400)
    }

    const { error: insertErr } = await adminClient.from('usuarios').insert({
      id: created.user.id,
      nome,
      email,
      nivel: nivel || 'operador',
    })

    if (insertErr) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      return jsonResponse({ error: 'Falha ao salvar permissões: ' + insertErr.message }, 400)
    }

    if (Array.isArray(setorIds) && setorIds.length > 0) {
      const { error: setorErr } = await adminClient
        .from('usuario_setores')
        .insert(setorIds.map((setor_id: string) => ({ usuario_id: created.user.id, setor_id })))
      if (setorErr) {
        // Usuário e permissões básicas já foram criados — não desfaz tudo por
        // causa só do vínculo de setor, só avisa pra corrigir manualmente.
        return jsonResponse({
          success: true,
          id: created.user.id,
          warning: 'Usuário criado, mas falha ao vincular setores: ' + setorErr.message,
        })
      }
    }

    return jsonResponse({ success: true, id: created.user.id })
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
