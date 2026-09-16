import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const WHATSAPP_WABA_ID = Deno.env.get('WHATSAPP_WABA_ID') || '1530053735172401'
const CATEGORIAS_PERMITIDAS = ['MARKETING', 'UTILITY']

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Etapa 3 do plano de templates (15/09/2026, pedido da Adriana) — botão
// "+ Novo Template" no chat, submete direto pra aprovação da Meta. Restrito
// a admin_master ou setor "Marketing" (mesmo padrão de checagem do
// despublicar-veiculo): submeter template mexe na conta de WhatsApp
// Business da empresa (categoria errada pode gerar custo indevido ou até
// risco de restrição da conta pela Meta), não é ação de qualquer atendente.
// AUTHENTICATION não é oferecida aqui de propósito — é categoria de OTP,
// com regras próprias que não se aplicam ao uso comercial de hoje.
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
        .eq('setores.nome', 'Marketing')
        .maybeSingle()
      if (!setorRow) {
        return jsonResponse({ error: 'Apenas o setor Marketing pode criar template' }, 403)
      }
    }

    const { nome, categoria, corpo, exemplos } = (await req.json()) as {
      nome?: string
      categoria?: string
      corpo?: string
      exemplos?: string[]
    }

    if (!nome || !/^[a-z0-9_]+$/.test(nome)) {
      return jsonResponse(
        { error: 'Nome deve ter só letras minúsculas, números e underscore (ex: aviso_promocao)' },
        400,
      )
    }
    if (!categoria || !CATEGORIAS_PERMITIDAS.includes(categoria)) {
      return jsonResponse({ error: 'Categoria deve ser MARKETING ou UTILITY' }, 400)
    }
    if (!corpo || corpo.trim().length < 5) {
      return jsonResponse({ error: 'Corpo da mensagem é obrigatório' }, 400)
    }

    const variaveis = [...corpo.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))
    if (variaveis.length > 0 && (!exemplos || exemplos.length !== variaveis.length)) {
      return jsonResponse({ error: 'Falta exemplo de preenchimento pra alguma variável' }, 400)
    }

    const token = Deno.env.get('WHATSAPP_TOKEN')
    if (!token) throw new Error('WHATSAPP_TOKEN não configurado')

    const bodyComponent: Record<string, unknown> = { type: 'BODY', text: corpo }
    if (variaveis.length > 0) {
      bodyComponent.example = { body_text: [exemplos] }
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_WABA_ID}/message_templates`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome,
          category: categoria,
          language: 'pt_BR',
          components: [bodyComponent],
        }),
      },
    )
    const data = await res.json()

    if (!res.ok) {
      return jsonResponse(
        { error: data?.error?.error_user_msg || data?.error?.message || 'Erro na Meta' },
        400,
      )
    }

    await admin.from('whatsapp_templates').upsert(
      {
        nome,
        idioma: 'pt_BR',
        categoria,
        status: data.status || 'PENDING',
        corpo,
        variaveis,
        meta_data: data,
      },
      { onConflict: 'nome,idioma' },
    )

    return jsonResponse({ success: true, status: data.status || 'PENDING', id: data.id })
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500)
  }
})
