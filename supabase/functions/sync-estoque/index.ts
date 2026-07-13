import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json().catch(() => ({}))
    const veiculoId = body.veiculo_id

    const { data: configs } = await supabase.from('configuracoes_api').select('*').eq('ativo', true)

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma API ativa configurada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let query = supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)
    if (veiculoId) {
      query = query.eq('id', veiculoId)
    }
    const { data: veiculos } = await query

    if (!veiculos || veiculos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum veículo válido encontrado para sincronização.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: plataformas } = await supabase
      .from('plataformas')
      .select('id, slug')
      .eq('ativo', true)

    const allResults: any[] = []
    const logsToInsert: any[] = []
    const syncLogsToInsert: any[] = []

    const colMap: Record<string, string> = {
      mercadolivre: 'publicado_mercadolivre',
      webmotors: 'publicado_webmotors',
      olx: 'publicado_olx',
      icarros: 'publicado_icarros',
      napista: 'publicado_napista',
    }

    for (const veiculo of veiculos) {
      const results = await Promise.allSettled(
        configs.map(async (config) => {
          const payload = {
            placa: veiculo.placa,
            marca: veiculo.marca,
            modelo: veiculo.modelo,
            ano: veiculo.ano_fabricacao,
            combustivel: veiculo.combustivel,
            cor: veiculo.cor,
            quilometragem: veiculo.quilometragem,
            preco: veiculo.preco_venda,
            descricao: veiculo.descricao,
            fotos: veiculo.fotos,
            opcionais: veiculo.diferenciais,
            caracteristicas: veiculo.caracteristicas,
          }
          return {
            portal: config.portal,
            veiculo_id: veiculo.id,
            status: 'sucesso',
            payload_enviado: payload,
          }
        }),
      )

      results.forEach((res, idx) => {
        const portal = configs[idx].portal
        if (res.status === 'rejected') {
          logsToInsert.push({
            veiculo_id: veiculo.id,
            portal,
            status: 'falha',
            payload_erro: { error: res.reason?.message || 'Unknown error' },
          })
        } else {
          logsToInsert.push({
            veiculo_id: veiculo.id,
            portal,
            status: 'sucesso',
            payload_erro: null,
          })
          allResults.push(res.value)
        }
      })

      if (plataformas) {
        for (const p of plataformas) {
          const col = colMap[p.slug]
          if (col && (veiculo as any)[col]) {
            syncLogsToInsert.push({
              plataforma_id: p.id,
              veiculo_id: veiculo.id,
              acao: 'sync',
              status: 'success',
              mensagem: 'Veículo sincronizado via sync-estoque',
            })
          }
        }
      }
    }

    if (logsToInsert.length > 0) {
      await supabase.from('logs_integracao').insert(logsToInsert)
    }
    if (syncLogsToInsert.length > 0) {
      await supabase.from('sync_log').insert(syncLogsToInsert)
    }

    return new Response(
      JSON.stringify({ success: true, synced: allResults.length, results: allResults }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
