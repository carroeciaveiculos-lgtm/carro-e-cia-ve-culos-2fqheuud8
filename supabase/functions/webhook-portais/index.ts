import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
};

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
    
    const bodyText = await req.text();
    let body: any = {};
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        console.error("Invalid JSON body", e);
      }
    }

    // Authentication for Google Meu Negocio
    if (portal === 'GoogleMeuNegocio') {
      const authHeader = req.headers.get('authorization');
      const apiKeyHeader = req.headers.get('x-api-key');
      const expectedKey = 'GMN_LEAD_CARROCIA_BF939';
      
      const hasValidToken = 
        authHeader === `Bearer ${expectedKey}` || 
        authHeader === expectedKey || 
        apiKeyHeader === expectedKey ||
        url.searchParams.get('key') === expectedKey ||
        body.google_key === expectedKey;

      if (!hasValidToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing Webhook Key.' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Map fields robustly
    let nome = body.name || body.displayName || body.cliente || '';
    let telefone = body.phoneNumber || body.phone || body.telefone || '';
    let email = body.email || '';

    // Mapeamento específico para Google Meu Negócio (user_column_data)
    if (body.user_column_data && Array.isArray(body.user_column_data)) {
      body.user_column_data.forEach((col: any) => {
        if (col.column_id === 'FULL_NAME') {
          nome = col.string_value || nome;
        } else if (col.column_id === 'EMAIL') {
          email = col.string_value || email;
        } else if (col.column_id === 'PHONE_NUMBER') {
          telefone = col.string_value || telefone;
        }
      });
    }

    if (!nome) nome = 'Lead Portal';

    const observacoes = JSON.stringify(body, null, 2);

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
