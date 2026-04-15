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

    // 1. Load APIs configured
    const { data: configs } = await supabase.from('configuracoes_api').select('*').eq('ativo', true)

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma API ativa configurada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Load stock (single vehicle or all)
    let query = supabase.from('veiculos').select('*').eq('status', 'disponivel')
    if (veiculoId) {
      query = query.eq('id', veiculoId)
    }
    const { data: veiculos } = await query

    if (!veiculos || veiculos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum veículo válido encontrado para sincronização.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 3. Sync to each portal for each vehicle
    const logsToInsert: any[] = []

    for (const veiculo of veiculos) {
      const results = await Promise.allSettled(
        configs.map(async (config) => {
          // Here we would call the real portal APIs (Webmotors, iCarros, etc.)
          // via cURL logic, mounting the JSON/XML payload.

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

          // Simulate API call
          // if (Math.random() > 0.8) throw new Error("Simulated API failure for " + config.portal);

          return {
            portal: config.portal,
            veiculo_id: veiculo.id,
            status: 'sucesso',
            payload_enviado: payload,
          }
        }),
      )

      // 4. Log responses
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          logsToInsert.push({
            veiculo_id: veiculo.id,
            portal: configs[idx].portal,
            status: 'falha',
            payload_erro: { error: res.reason?.message || 'Unknown error' },
          })
        } else {
          logsToInsert.push({
            veiculo_id: veiculo.id,
            portal: configs[idx].portal,
            status: 'sucesso',
            payload_erro: null,
          })
        }
      })
    }

    if (logsToInsert.length > 0) {
      await supabase.from('logs_integracao').insert(logsToInsert)
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
