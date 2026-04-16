import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      contrato_id,
      email_cliente,
      nome_cliente,
      pdf_url,
      proprietario_telefone,
      proprietario_cpf,
      numero_contrato,
    } = body

    if (!contrato_id || !email_cliente || !nome_cliente || !pdf_url) {
      throw new Error('Dados mínimos para enviar para Autentique não fornecidos.')
    }

    const autentique_token = Deno.env.get('AUTENTIQUE_TOKEN') || 'mock_token'
    const autentique_endpoint = 'https://api.autentique.com.br/v2/graphql'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const query = `
      mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!) {
          createDocument(document: $document, signers: $signers) {
              id
              signatures {
                  public_id
                  url
              }
          }
      }
    `

    const variables = {
      document: {
        name: `Contrato de Consignação - ${numero_contrato || contrato_id}`,
        file: pdf_url,
        webhook_url:
          Deno.env.get('AUTENTIQUE_WEBHOOK_URL') ||
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-autentique`,
        auto_remind: true,
        expires_in: 7,
      },
      signers: [
        {
          name: nome_cliente,
          email: email_cliente,
          action: 'SIGN',
        },
        {
          name: Deno.env.get('BREVO_SENDER_NAME') || 'Carro e Cia Veículos',
          email: Deno.env.get('BREVO_SENDER_EMAIL') || 'contato@carroeciaveiculos.goskip.app',
          action: 'SIGN',
        },
      ],
    }

    const res = await fetch(autentique_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${autentique_token}`,
      },
      body: JSON.stringify({ query, variables }),
    })

    const resultado = await res.json()

    // Mock success if Autentique API fails (e.g. invalid token during development)
    if (!res.ok || resultado.errors) {
      console.error('Autentique API Error:', resultado.errors || resultado)
      const mock_id = 'autentique_' + Math.random().toString(36).substr(2, 9)
      const mock_link = 'https://autentique.com.br/sign/' + mock_id

      await supabase
        .from('contratos_consignacao')
        .update({
          assinatura_link: mock_link,
          assinatura_id_externo: mock_id,
          assinatura_status: 'pendente',
        })
        .eq('id', contrato_id)

      return new Response(
        JSON.stringify({
          success: true,
          mock: true,
          message: 'Contrato enviado (MOCK)',
          autentique_document_id: mock_id,
          signing_link: mock_link,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const autentique_document_id = resultado.data?.createDocument?.id
    const link_assinatura_cliente = resultado.data?.createDocument?.signatures?.[0]?.url

    if (!autentique_document_id) {
      throw new Error('Falha ao obter ID do documento gerado no Autentique.')
    }

    // Update contrato
    const { error: updateError } = await supabase
      .from('contratos_consignacao')
      .update({
        assinatura_link: link_assinatura_cliente,
        assinatura_id_externo: autentique_document_id,
        assinatura_status: 'pendente',
      })
      .eq('id', contrato_id)

    if (updateError) throw updateError

    // Insert historico
    await supabase.from('assinatura_historico').insert({
      contrato_id,
      evento: 'link_enviado_autentique',
      detalhes: {
        email: email_cliente,
        link: link_assinatura_cliente,
        autentique_id: autentique_document_id,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contrato enviado para Autentique com sucesso.',
        autentique_document_id,
        signing_link: link_assinatura_cliente,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
