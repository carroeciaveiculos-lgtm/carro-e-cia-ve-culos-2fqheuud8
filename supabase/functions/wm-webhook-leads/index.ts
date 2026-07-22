import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    const body = await req.json()
    const { IdLead, CodigoCliente, Cnpj, IdTipoLead } = body

    console.log(`[wm-webhook-leads] Recebido:`, { IdLead, CodigoCliente, Cnpj, IdTipoLead })

    // 1. Validar payload mínimo
    if (!IdLead || !CodigoCliente) {
      return new Response(JSON.stringify({ erro: 'Payload incompleto' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Buscar ID da plataforma Webmotors
    const { data: plataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .single()

    const plataformaId = plataforma?.id

    // 3. Registrar log da notificação
    const logEntry = {
      plataforma_id: plataformaId,
      acao: 'lead_notification',
      status: 'sucesso',
      mensagem: `Lead ${IdLead} recebido - Tipo: ${IdTipoLead || 'desconhecido'}`,
      metadata: { IdLead, CodigoCliente, Cnpj, IdTipoLead },
    }

    await supabase.from('sync_log').insert(logEntry)

    // 4. Disparar processamento assíncrono (fire-and-forget)
    supabase.functions
      .invoke('wm-process-lead', {
        body: { IdLead, CodigoCliente, Cnpj },
      })
      .catch((err) => console.error('Erro ao invocar wm-process-lead:', err))

    // 5. Retornar 200 — OBRIGATÓRIO para evitar retentativas
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[wm-webhook-leads] Erro:', error)
    return new Response(JSON.stringify({ erro: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
