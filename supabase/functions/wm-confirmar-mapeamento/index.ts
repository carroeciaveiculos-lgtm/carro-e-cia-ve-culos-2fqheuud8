import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Recebe a escolha do humano na tela de pendências e aplica o mapeamento confirmado.
// Espera: { veiculo_id, codigo_modelo_wm, codigo_versao_wm } - os dois últimos
// vêm dos botões de candidato que o front mostra (ou de busca manual, se nenhum bateu).
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { veiculo_id, codigo_modelo_wm, codigo_versao_wm } = await req.json()
    if (!veiculo_id) throw new Error('veiculo_id obrigatorio')

    const { data: mapeamento } = await supabase
      .from('wm_mapeamento_veiculos')
      .select('id, codigo_marca_wm')
      .eq('veiculo_id', veiculo_id)
      .maybeSingle()

    if (!mapeamento) throw new Error('Nenhum mapeamento pendente encontrado para esse veiculo')

    const updateFields: Record<string, any> = {
      status_sincronizacao: 'mapeado',
      erro_msg: null,
      confirmado_manualmente: true,
    }
    if (codigo_modelo_wm) updateFields.codigo_modelo_wm = codigo_modelo_wm
    if (codigo_versao_wm) updateFields.codigo_versao_wm = codigo_versao_wm

    await supabase.from('wm_mapeamento_veiculos').update(updateFields).eq('id', mapeamento.id)

    // Se não houver mais nenhuma pendência (Webmotors ou outras plataformas futuras),
    // libera o veiculo da fila de revisão.
    const { count } = await supabase
      .from('wm_mapeamento_veiculos')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculo_id)
      .eq('status_sincronizacao', 'revisao_necessaria')

    if (!count || count === 0) {
      await supabase.from('veiculos').update({ requires_review: false }).eq('id', veiculo_id)
    }

    return new Response(JSON.stringify({ success: true, status: 'mapeado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
