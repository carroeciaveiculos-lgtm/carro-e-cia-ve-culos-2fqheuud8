import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract portal name from url or header
    const url = new URL(req.url);
    const portal = url.searchParams.get('portal') || 'Desconhecido';
    const body = await req.json();

    // Map fields (skeleton mapping)
    const nome = body.name || body.cliente || 'Lead Portal';
    const telefone = body.phone || body.telefone || '';
    const email = body.email || '';
    const observacoes = JSON.stringify(body);

    const { error } = await supabase.from('leads').insert({
      nome,
      telefone,
      email,
      origem: `Portal - ${portal}`,
      tipo: 'comprador',
      status: 'novo',
      temperatura: 'morno',
      observacoes
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});
