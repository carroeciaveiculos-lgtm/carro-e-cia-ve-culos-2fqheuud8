import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

// Post orgânico diário na página do Facebook (22/09/2026, pedido da
// Adriana). Escolhe 1 veículo do estoque por dia (o que ficou mais tempo sem
// aparecer aqui, pra rodar o estoque inteiro antes de repetir), gera a
// legenda reaproveitando gerar-conteudo-social (mesma function usada no
// editor manual) e grava em social_posts como Rascunho — NÃO publica
// sozinho. Adriana decidiu esperar aprovação manual (SocialApprovalDashboard)
// antes de ir pro ar, então publicar-social-cron-job (que só publica
// status='Agendado') nunca vê esse post até ela aprovar.
const CONTENT_TYPE = 'post_organico_diario'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Já existe rascunho/agendado de hoje esperando aprovação? Não gera
    // outro (evita acumular rascunho se a Adriana ainda não aprovou o de
    // ontem, ou se o cron rodar mais de uma vez no dia por algum motivo).
    const inicioHoje = new Date()
    inicioHoje.setHours(0, 0, 0, 0)
    const { data: rascunhoHoje } = await supabase
      .from('social_posts')
      .select('id')
      .eq('content_type', CONTENT_TYPE)
      .in('status', ['Rascunho', 'Agendado'])
      .gte('criado_em', inicioHoje.toISOString())
      .limit(1)
      .maybeSingle()
    if (rascunhoHoje) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, motivo: 'já existe post orgânico de hoje' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: veiculos, error: errorVeiculos } = await supabase
      .from('veiculos')
      .select('id, marca, modelo, fotos')
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)
    if (errorVeiculos) throw errorVeiculos

    const disponiveis = (veiculos || []).filter((v) => Array.isArray(v.fotos) && v.fotos.length > 0)
    if (disponiveis.length === 0) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, motivo: 'nenhum veículo disponível com foto' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Rotaciona o estoque: prioriza quem nunca apareceu, depois quem
    // apareceu há mais tempo.
    const { data: ultimosPosts } = await supabase
      .from('social_posts')
      .select('veiculo_id, criado_em')
      .eq('content_type', CONTENT_TYPE)
      .not('veiculo_id', 'is', null)
      .order('criado_em', { ascending: false })

    const ultimaVezPorVeiculo = new Map<string, string>()
    for (const p of ultimosPosts || []) {
      if (!ultimaVezPorVeiculo.has(p.veiculo_id)) ultimaVezPorVeiculo.set(p.veiculo_id, p.criado_em)
    }

    disponiveis.sort((a, b) => {
      const da = ultimaVezPorVeiculo.get(a.id)
      const db = ultimaVezPorVeiculo.get(b.id)
      if (!da && !db) return 0
      if (!da) return -1
      if (!db) return 1
      return new Date(da).getTime() - new Date(db).getTime()
    })
    const escolhido = disponiveis[0]

    const { data: legendaRes, error: legendaError } = await supabase.functions.invoke(
      'gerar-conteudo-social',
      { body: { veiculo_id: escolhido.id, platform: 'Facebook' } },
    )
    if (legendaError || !legendaRes?.success) {
      throw new Error(legendaRes?.error || legendaError?.message || 'Falha ao gerar legenda')
    }

    const { error: insertError } = await supabase.from('social_posts').insert({
      redes: ['facebook'],
      texto: legendaRes.text,
      imagem: escolhido.fotos[0],
      veiculo_id: escolhido.id,
      content_type: CONTENT_TYPE,
      status: 'Rascunho',
      data_agendamento: new Date().toISOString(),
    })
    if (insertError) throw insertError

    return new Response(
      JSON.stringify({
        success: true,
        veiculo_id: escolhido.id,
        veiculo: `${escolhido.marca} ${escolhido.modelo}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('Erro em post-organico-diario-cron:', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
