import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// A Auth e o Postgres devolvem mensagem em inglês — traduz os casos comuns
// pra quem está usando o painel não ver um erro em código (achado 17/08/2026).
function traduzErro(msg: string | undefined): string {
  if (!msg) return 'Falha ao criar usuário. Tente novamente.'
  const m = msg.toLowerCase()
  if (m.includes('already been registered') || m.includes('already registered')) {
    return 'Já existe um usuário cadastrado com esse e-mail.'
  }
  if (m.includes('usuarios_email_key') || m.includes('duplicate key')) {
    return 'Já existe um usuário cadastrado com esse e-mail.'
  }
  if (m.includes('password should be at least') || m.includes('password is too short')) {
    return 'Senha muito curta — use pelo menos 8 caracteres.'
  }
  if (m.includes('unable to validate email') || m.includes('invalid email') || m.includes('invalid format')) {
    return 'E-mail em formato inválido.'
  }
  if (m.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo — aguarde um minuto e tente de novo.'
  }
  return msg
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
      return jsonResponse({ error: traduzErro(createErr?.message) }, 400)
    }

    const { error: insertErr } = await adminClient.from('usuarios').insert({
      id: created.user.id,
      nome,
      email,
      nivel: nivel || 'operador',
    })

    if (insertErr) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      return jsonResponse({ error: traduzErro(insertErr.message) }, 400)
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
    return jsonResponse({ error: traduzErro(e instanceof Error ? e.message : String(e)) }, 500)
  }
})
