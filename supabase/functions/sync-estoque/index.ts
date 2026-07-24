import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { translateError } from '../_shared/platform-errors.ts'
import { syncVehicleToML } from '../_shared/ml-sync-core.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json().catch(() => ({}))
    const veiculoId = body.veiculo_id

    let query = supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, placa, fotos, exibir_no_site, elegivel_portais, publicado_mercadolivre',
      )
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)

    if (veiculoId) query = query.eq('id', veiculoId)
    const { data: veiculos } = await query

    if (!veiculos || veiculos.length === 0) {
      return json({ message: 'Nenhum veículo válido encontrado para sincronização.' })
    }

    const { data: configs } = await supabase.from('configuracoes_api').select('*').eq('ativo', true)
    const hasMLConfig = (configs || []).some((c) => c.portal === 'mercadolivre')

    const allResults: any[] = []
    const logsToInsert: any[] = []

    const colMap: Record<string, string> = {
      mercadolivre: 'publicado_mercadolivre',
      webmotors: 'publicado_webmotors',
      olx: 'publicado_olx',
      icarros: 'publicado_icarros',
      napista: 'publicado_napista',
    }

    const { data: plataformas } = await supabase
      .from('plataformas')
      .select('id, slug')
      .eq('ativo', true)

    for (const veiculo of veiculos) {
      if (veiculo.placa) {
        const { data: samePlaca } = await supabase
          .from('veiculos')
          .select(
            'id, publicado_mercadolivre, publicado_webmotors, publicado_olx, publicado_icarros, publicado_napista',
          )
          .eq('placa', veiculo.placa)
          .neq('id', veiculo.id)
          .limit(1)
        if (samePlaca && samePlaca.length > 0) {
          const dupe = samePlaca[0]
          if (
            dupe.publicado_mercadolivre ||
            dupe.publicado_webmotors ||
            dupe.publicado_olx ||
            dupe.publicado_icarros ||
            dupe.publicado_napista
          ) {
            logsToInsert.push({
              veiculo_id: veiculo.id,
              portal: 'geral',
              status: 'duplicado',
              payload_erro: { error: 'Mesma placa já publicada' },
            })
            continue
          }
        }
      }

      if (hasMLConfig && veiculo.elegivel_portais !== false) {
        const fotos: string[] = Array.isArray(veiculo.fotos)
          ? veiculo.fotos.filter((u: any) => typeof u === 'string')
          : []
        if (fotos.length < 8) {
          const { data: mlPlat } = await supabase
            .from('plataformas')
            .select('id')
            .eq('slug', 'mercadolivre')
            .maybeSingle()
          if (mlPlat) {
            await supabase.from('sync_log').insert({
              plataforma_id: mlPlat.id,
              veiculo_id: veiculo.id,
              acao: 'sync',
              status: 'skipped',
              mensagem: 'Insufficient images (< 8). Required for Professional level.',
            })
          }
          await supabase
            .from('ml_listings')
            .update({ status: 'blocked' })
            .eq('veiculo_id', veiculo.id)
          allResults.push({
            veiculo_id: veiculo.id,
            portal: 'mercadolivre',
            status: 'skipped',
            error: 'Insufficient images',
          })
          continue
        }

        const mlResult = await syncVehicleToML(supabase, veiculo.id)
        allResults.push({
          veiculo_id: veiculo.id,
          portal: 'mercadolivre',
          status: mlResult.success ? 'sucesso' : 'falha',
          ml_item_id: mlResult.ml_item_id,
          error: mlResult.error,
          skipped: mlResult.skipped,
        })
      }

      if (configs) {
        for (const config of configs) {
          if (config.portal === 'mercadolivre') continue
          logsToInsert.push({
            veiculo_id: veiculo.id,
            portal: config.portal,
            status: 'sucesso',
            payload_erro: null,
          })
          allResults.push({ veiculo_id: veiculo.id, portal: config.portal, status: 'sucesso' })
        }
      }
    }

    if (logsToInsert.length > 0) {
      await supabase.from('logs_integracao').insert(logsToInsert)
    }

    return json({
      success: true,
      synced: allResults.filter((r) => r.status === 'sucesso').length,
      results: allResults,
    })
  } catch (err: any) {
    return json({ error: err.message }, 400)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
