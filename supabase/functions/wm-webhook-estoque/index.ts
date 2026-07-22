import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    const body = await req.json()
    const { tipo, codigoAnuncio, lojaCnpj, dataSolicitacao } = body

    console.log(`[wm-webhook-estoque] Recebido:`, {
      tipo,
      codigoAnuncio,
      lojaCnpj,
      dataSolicitacao,
    })

    // 1. Validar payload
    if (!tipo || !codigoAnuncio) {
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

    // 3. Mapear ação
    const acoes: Record<string, string> = {
      publicar: 'publicar',
      atualizar: 'atualizar',
      despublicar: 'encerrar',
    }

    const acao = acoes[tipo] || 'desconhecida'

    // 4. Registrar log
    await supabase.from('sync_log').insert({
      plataforma_id: plataformaId,
      acao: `estoque_${acao}`,
      status: 'pendente',
      mensagem: `Solicitação de ${acao} do anúncio ${codigoAnuncio}`,
      metadata: { tipo, codigoAnuncio, lojaCnpj, dataSolicitacao },
    })

    // 5. Disparar wm-sync para processar (fire-and-forget)
    supabase.functions
      .invoke('wm-sync', {
        body: { trigger: 'callback', tipo, codigoAnuncio, lojaCnpj },
      })
      .catch((err) => console.error('Erro ao invocar wm-sync:', err))

    // 6. Retornar 200
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[wm-webhook-estoque] Erro:', error)
    return new Response(JSON.stringify({ erro: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
