import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // We use the anon key since this is a public feed for available vehicles
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel');

    if (error) {
      throw error;
    }

    if (!veiculos || veiculos.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        status: 200,
      });
    }

    const mappedData = veiculos.map((v: any) => {
      let opcionais = '';
      if (Array.isArray(v.caracteristicas)) {
        opcionais = v.caracteristicas.join(', ');
      } else if (typeof v.caracteristicas === 'string') {
        opcionais = v.caracteristicas;
      }

      let fotos: string[] = [];
      if (Array.isArray(v.fotos)) {
        fotos = v.fotos;
      } else if (typeof v.fotos === 'string') {
        try {
          fotos = JSON.parse(v.fotos);
        } catch {
          fotos = v.fotos ? [v.fotos] : [];
        }
      }

      return {
        id: v.id,
        marca: v.marca,
        modelo: v.modelo,
        versao: v.versao,
        ano_fab: v.ano_fabricacao,
        ano_mod: v.ano_modelo,
        cor: v.cor,
        km: v.quilometragem,
        cambio: v.cambio,
        combustivel: v.combustivel,
        portas: v.portas,
        valor: v.preco_venda,
        placa: v.placa,
        fotos: fotos,
        opcionais: opcionais,
        observacao: v.descricao,
      };
    });

    return new Response(JSON.stringify(mappedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      },
      status: 500,
    });
  }
});
