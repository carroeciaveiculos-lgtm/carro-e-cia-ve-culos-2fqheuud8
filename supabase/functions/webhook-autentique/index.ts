import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    if (payload?.event === 'document_signed') {
      const autentique_document_id = payload?.document?.id;
      const signed_pdf_url = payload?.document?.signed_file;

      if (!autentique_document_id) {
         throw new Error('ID do documento Autentique não fornecido no webhook.');
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: contrato, error: fetchError } = await supabase
        .from('contratos_consignacao')
        .select('id, proprietario_email')
        .eq('assinatura_id_externo', autentique_document_id)
        .single();

      if (fetchError || !contrato) {
        throw new Error('Contrato não encontrado para o ID do Autentique: ' + autentique_document_id);
      }

      const contrato_id = contrato.id;

      await supabase
        .from('contratos_consignacao')
        .update({
          assinatura_status: 'assinado',
          assinatura_data: new Date().toISOString(),
          pdf_assinado_url: signed_pdf_url
        })
        .eq('id', contrato_id);

      await supabase.from('assinatura_historico').insert({
        contrato_id,
        evento: 'assinado_autentique',
        detalhes: { autentique_id: autentique_document_id, signed_url: signed_pdf_url, webhook_payload: payload }
      });

      return new Response(JSON.stringify({ success: true, message: 'Webhook Autentique processado com sucesso.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Evento Autentique recebido, mas não processado (não é document_signed).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});
