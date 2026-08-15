import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { matchAtributoNapista } from '../_shared/napista-client.ts'

// Recebe a escolha do humano na tela de revisão e aplica o mapeamento
// confirmado. Espera: { veiculo_id, napista_modelo_id?, napista_version_id? }
// — vêm dos botões de candidato que o front mostra. Espelha
// wm-confirmar-mapeamento, com duas diferenças:
// 1) checa pendência tanto em napista_mapeamento_veiculos quanto em
//    wm_mapeamento_veiculos antes de liberar requires_review (o WM só olha
//    a própria tabela — se um veículo tiver pendência nas duas plataformas
//    ao mesmo tempo, confirmar só a do WM lá liberaria o flag cedo demais).
// 2) Achado testando ao vivo (14/08/2026): quando a pendência é de
//    modelo/versão, cor/câmbio/combustível NUNCA foram checados (o
//    napista-mapear-veiculo para antes de chegar lá) — sem refazer esse
//    passo aqui, o veículo virava "mapeado" com os 3 campos vazios,
//    pronto pra "publicar" sem dado nenhum de cor/câmbio/combustível.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { veiculo_id, napista_modelo_id, napista_version_id } = await req.json()
    if (!veiculo_id) throw new Error('veiculo_id obrigatorio')

    const { data: mapeamento } = await supabase
      .from('napista_mapeamento_veiculos')
      .select('id, napista_marca_id, napista_modelo_id, codigo_cor, codigo_cambio, codigo_combustivel')
      .eq('veiculo_id', veiculo_id)
      .maybeSingle()

    if (!mapeamento) throw new Error('Nenhum mapeamento pendente encontrado para esse veiculo')

    const updateFields: Record<string, any> = {
      confirmado_manualmente: true,
    }
    if (napista_modelo_id) updateFields.napista_modelo_id = napista_modelo_id
    if (napista_version_id) updateFields.napista_version_id = napista_version_id

    // Se cor/câmbio/combustível ainda não foram resolvidos (pendência era de
    // marca/modelo/versão, então essa etapa nunca rodou), tenta agora.
    let codigoCor = mapeamento.codigo_cor
    let codigoCambio = mapeamento.codigo_cambio
    let codigoCombustivel = mapeamento.codigo_combustivel
    if (!codigoCor || !codigoCambio || !codigoCombustivel) {
      const [{ data: veiculo }, { data: atributosRow }] = await Promise.all([
        supabase.from('veiculos').select('cor, cambio, combustivel').eq('id', veiculo_id).single(),
        supabase.from('napista_atributos').select('dados').eq('id', 'catalogo').maybeSingle(),
      ])
      const atributos = atributosRow?.dados || {}
      codigoCor = codigoCor || matchAtributoNapista(atributos.colors?.items, veiculo?.cor)
      codigoCambio = codigoCambio || matchAtributoNapista(atributos.transmissionTypes?.items, veiculo?.cambio)
      codigoCombustivel =
        codigoCombustivel || matchAtributoNapista(atributos.fuelTypes?.items, veiculo?.combustivel)
      updateFields.codigo_cor = codigoCor
      updateFields.codigo_cambio = codigoCambio
      updateFields.codigo_combustivel = codigoCombustivel
    }

    const faltando = [!codigoCor && 'cor', !codigoCambio && 'câmbio', !codigoCombustivel && 'combustível'].filter(
      Boolean,
    )
    if (faltando.length > 0) {
      updateFields.status_sincronizacao = 'revisao_necessaria'
      updateFields.erro_msg = `Modelo/versão confirmados, mas ainda falta no catálogo NaPista: ${faltando.join(', ')}. Rode a sincronização de atributos ou ajuste o texto no veículo.`
    } else {
      updateFields.status_sincronizacao = 'mapeado'
      updateFields.erro_msg = null
    }

    await supabase.from('napista_mapeamento_veiculos').update(updateFields).eq('id', mapeamento.id)

    if (updateFields.status_sincronizacao === 'revisao_necessaria') {
      return new Response(
        JSON.stringify({ success: true, status: 'revisao_necessaria', motivo: 'catalogo_napista' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const [{ count: napistaPendente }, { count: wmPendente }] = await Promise.all([
      supabase
        .from('napista_mapeamento_veiculos')
        .select('id', { count: 'exact', head: true })
        .eq('veiculo_id', veiculo_id)
        .eq('status_sincronizacao', 'revisao_necessaria'),
      supabase
        .from('wm_mapeamento_veiculos')
        .select('id', { count: 'exact', head: true })
        .eq('veiculo_id', veiculo_id)
        .eq('status_sincronizacao', 'revisao_necessaria'),
    ])

    if (!napistaPendente && !wmPendente) {
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
