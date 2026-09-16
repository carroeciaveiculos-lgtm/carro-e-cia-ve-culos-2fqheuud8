import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WHATSAPP_WABA_ID = Deno.env.get('WHATSAPP_WABA_ID') || '1530053735172401'

// Etapa 1 do plano de templates (15/09/2026, pedido da Adriana) — puxa os
// WhatsApp Message Templates aprovados/pendentes/rejeitados na Meta e
// atualiza a tabela `whatsapp_templates`, que sempre existiu mas nunca foi
// alimentada (o botão "Templates" do chat lia dela e sempre via lista
// vazia). Sem trava de autenticação: só sincroniza um catálogo de
// mensagens padrão (não é dado de cliente), e é chamada tanto pelo botão
// "Atualizar" do chat (usuário logado) quanto pelo cron diário — mesmo
// padrão de acesso público usado pelas outras functions de cron do
// projeto (ver lembrete-agendamento-cron).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('WHATSAPP_TOKEN')
    if (!token) throw new Error('WHATSAPP_TOKEN não configurado')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_WABA_ID}/message_templates?fields=name,status,category,language,components&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || 'Erro na Graph API')

    const templates = data?.data || []
    let atualizados = 0

    for (const t of templates) {
      const corpo = t.components?.find((c: any) => c.type === 'BODY')?.text || ''
      const variaveis = [...corpo.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))

      const { error } = await supabase.from('whatsapp_templates').upsert(
        {
          nome: t.name,
          idioma: t.language,
          categoria: t.category,
          status: t.status,
          corpo,
          variaveis,
          meta_data: t,
        },
        { onConflict: 'nome,idioma' },
      )
      if (!error) atualizados++
    }

    return new Response(JSON.stringify({ total: templates.length, atualizados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
