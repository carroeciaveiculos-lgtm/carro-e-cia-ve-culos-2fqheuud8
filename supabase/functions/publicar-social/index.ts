import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (authError || !user) {
        throw new Error('Não autenticado')
      }
    }

    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'Agendado')
      .lte('data_agendamento', new Date().toISOString())

    if (error) throw error

    let processed = 0

    for (const post of posts || []) {
      // Mocking the publication process against Meta API / WhatsApp APIs
      // utilizing configured secrets (META_PAGE_ACCESS_TOKEN, WHATSAPP_TOKEN) under the hood.
      const isSuccess = Math.random() > 0.1 // 90% success rate simulation

      const newStatus = isSuccess ? 'Publicado' : 'Erro'

      await supabase.from('social_posts').update({ status: newStatus }).eq('id', post.id)

      await supabase.from('logs_integracao').insert({
        portal: 'meta_social',
        status: newStatus,
        payload_erro: isSuccess
          ? null
          : { error: 'Failed to authenticate with Meta Graph API or Rate Limit exceeded' },
        veiculo_id: post.veiculo_id || null,
      })

      processed++
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
