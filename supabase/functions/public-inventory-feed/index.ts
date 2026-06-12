import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('id, marca, modelo, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cor, placa, chassi, renavam, descricao, fotos, categoria, diferenciais, caracteristicas, is_consignado')
      .eq('status', 'disponivel')

    if (error) throw error

    const feed = veiculos.map(v => ({
      id: v.id,
      marca: v.marca,
      modelo: v.modelo,
      ano_fabricacao: v.ano_fabricacao,
      ano_modelo: v.ano_modelo,
      preco: v.preco_venda,
      quilometragem: v.quilometragem,
      combustivel: v.combustivel,
      cor: v.cor,
      placa: v.placa,
      chassi: v.chassi,
      renavam: v.renavam,
      descricao: v.descricao,
      fotos: v.fotos,
      categoria: v.categoria,
      is_consignado: v.is_consignado,
      tipo_estoque: v.is_consignado ? 'consignado' : 'proprio',
      opcionais: [...(v.diferenciais || []), ...(v.caracteristicas || [])]
    }))

    return new Response(JSON.stringify({
      estoque: feed,
      total: feed.length,
      updated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
