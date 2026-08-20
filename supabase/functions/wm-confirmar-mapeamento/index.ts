import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { matchCatalogoExato } from '../_shared/wm-catalogo-match.ts'

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

    // Corrigido em 20/08/2026: esta function confirmava modelo/versão e já
    // marcava status_sincronizacao='mapeado', mas nunca preenchia
    // codigo_cor_wm/codigo_cambio_wm/codigo_combustivel_wm — o guard em
    // wm-sync bloqueia publicação sem esses 3 códigos, então o veículo saía
    // daqui "confirmado" e travava silenciosamente na primeira tentativa de
    // sincronizar (achado real: Honda City TCQ0B23, 5 tentativas falhas em
    // 20/08). Agora roda o mesmo match exato que wm-mapear-veiculo já usa
    // pros três campos antes de marcar como mapeado.
    const { data: veiculo } = await supabase
      .from('veiculos')
      .select('cor, cambio, combustivel')
      .eq('id', veiculo_id)
      .maybeSingle()

    const [corMatch, cambioMatch, combustivelMatch] = await Promise.all([
      matchCatalogoExato(supabase, 'wm_cores', veiculo?.cor),
      matchCatalogoExato(supabase, 'wm_cambios', veiculo?.cambio),
      matchCatalogoExato(supabase, 'wm_combustiveis', veiculo?.combustivel),
    ])

    const catalogosFaltando = [
      !corMatch && `cor ("${veiculo?.cor ?? ''}")`,
      !cambioMatch && `câmbio ("${veiculo?.cambio ?? ''}")`,
      !combustivelMatch && `combustível ("${veiculo?.combustivel ?? ''}")`,
    ].filter(Boolean)

    const updateFields: Record<string, any> = {
      confirmado_manualmente: true,
    }
    if (codigo_modelo_wm) updateFields.codigo_modelo_wm = codigo_modelo_wm
    if (codigo_versao_wm) updateFields.codigo_versao_wm = codigo_versao_wm
    if (corMatch) updateFields.codigo_cor_wm = corMatch.codigo_wm
    if (cambioMatch) updateFields.codigo_cambio_wm = cambioMatch.codigo_wm
    if (combustivelMatch) updateFields.codigo_combustivel_wm = combustivelMatch.codigo_wm

    if (catalogosFaltando.length > 0) {
      updateFields.status_sincronizacao = 'revisao_necessaria'
      updateFields.erro_msg = `Modelo/versão confirmados, mas sem correspondência exata no catálogo Webmotors para: ${catalogosFaltando.join(', ')}. Cadastre o valor equivalente em wm_cores/wm_cambios/wm_combustiveis ou ajuste o texto no veículo.`
    } else {
      updateFields.status_sincronizacao = 'mapeado'
      updateFields.erro_msg = null
    }

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

    return new Response(
      JSON.stringify({
        success: true,
        status: updateFields.status_sincronizacao,
        erro_msg: updateFields.erro_msg,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
