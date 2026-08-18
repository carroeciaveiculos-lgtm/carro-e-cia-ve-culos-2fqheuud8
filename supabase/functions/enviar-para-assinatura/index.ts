import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Reescrito em 18/08/2026 — achado real (não era o AUTENTIQUE_TOKEN, a
// Adriana confirmou que já estava configurado): a chamada nunca poderia
// funcionar porque (1) o campo `file` do Autentique é do tipo `Upload!` —
// exige upload de arquivo de verdade via multipart/form-data
// (graphql-multipart-request-spec), não uma URL como texto dentro de
// `document.file`; e (2) o campo pedido na resposta era `signatures { url }`,
// que não existe no schema deles — o campo certo é `signatures { link {
// short_link } }`. Confirmado na documentação oficial:
// https://docs.autentique.com.br/api/mutations/criando-um-documento
// Também removido o modo mock silencioso (gravava link falso e reportava
// sucesso quando a chamada falhava) — foi o que escondeu esse bug por 4
// meses (contrato CTR-41, achado 18/08/2026). Agora erro de verdade
// devolve `success: false` de verdade.
//
// enviar_email (18/08/2026): quando true, dispara e-mail real pro cliente
// via Resend com o link de assinatura — antes o botão "Enviar E-mail" da
// tela só gerava o link e mentia dizendo que tinha enviado.
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
      numero_contrato,
      tipo_documento,
      enviar_email,
    } = body

    if (!contrato_id || !email_cliente || !nome_cliente || !pdf_url) {
      throw new Error('Dados mínimos para enviar para Autentique não fornecidos.')
    }

    const autentique_token = Deno.env.get('AUTENTIQUE_TOKEN')
    if (!autentique_token) {
      throw new Error('AUTENTIQUE_TOKEN não configurado nos Secrets do Supabase.')
    }
    const autentique_endpoint = 'https://api.autentique.com.br/v2/graphql'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Baixa os bytes reais do PDF (pdf_url pode ser uma URL assinada
    // temporária do bucket privado contratos-consignacao) pra subir como
    // arquivo de verdade no Autentique.
    const pdfRes = await fetch(pdf_url)
    if (!pdfRes.ok) {
      throw new Error(`Falha ao baixar o PDF pra enviar (${pdf_url}): HTTP ${pdfRes.status}`)
    }
    const pdfBlob = await pdfRes.blob()

    const docNames: Record<string, string> = {
      consignacao: 'Contrato de Consignação',
      venda: 'Contrato de Venda',
      compra: 'Contrato de Compra',
      termo_entrega: 'Termo de Entrega',
    }
    // Busca tipo_documento no banco em vez de confiar só no que o cliente
    // manda — fonte única de verdade é o registro já gravado por
    // gerar-pdf-contrato.
    let tipoReal = tipo_documento
    if (!tipoReal) {
      const { data: contratoRow } = await supabase
        .from('contratos_consignacao')
        .select('tipo_documento')
        .eq('id', contrato_id)
        .maybeSingle()
      tipoReal = contratoRow?.tipo_documento
    }
    const docName = docNames[tipoReal || 'consignacao'] || docNames.consignacao

    const query = `
      mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
        createDocument(document: $document, signers: $signers, file: $file) {
          id
          signatures {
            public_id
            name
            email
            link { short_link }
          }
        }
      }
    `

    // webhook_url/auto_remind/expires_in NÃO existem em DocumentInput de
    // verdade (achado 18/08/2026 testando ao vivo — a suposição original do
    // código estava errada). Webhook de conclusão é configurado uma vez no
    // painel da conta Autentique, não por chamada de API.
    //
    // BREVO_SENDER_EMAIL é pro remetente do Brevo (marketing) — a Adriana
    // confirmou 18/08/2026 que documento transacional como este deve usar
    // o domínio do Resend (e-mails internos), não o do Brevo. Fixo em
    // vendas@carroeciamotors.com.br (domínio já verificado no Resend).
    //
    // Cliente é adicionado só por NOME, sem e-mail — achado na
    // documentação oficial do Autentique: o campo `link` (o link de
    // assinatura) só vem preenchido quando o assinante NÃO tem e-mail;
    // com e-mail, é o próprio Autentique quem manda o convite direto, e
    // não devolve link nenhum pra gente repassar. Como a Adriana quer
    // controlar o envio (WhatsApp ou e-mail via Resend), precisamos do
    // link em mãos — por isso o e-mail do cliente não vai pro Autentique,
    // só é usado aqui do nosso lado (Resend, se for enviar por e-mail).
    const variables = {
      document: {
        name: `${docName} - ${numero_contrato || contrato_id}`,
      },
      signers: [
        { name: nome_cliente, action: 'SIGN' },
        {
          name: 'Carro e Cia Veículos',
          email: 'vendas@carroeciamotors.com.br',
          action: 'SIGN',
        },
      ],
      file: null,
    }

    // multipart/form-data conforme graphql-multipart-request-spec — Deno
    // suporta FormData/Blob nativamente, sem precisar de lib externa.
    const form = new FormData()
    form.append('operations', JSON.stringify({ query, variables }))
    form.append('map', JSON.stringify({ file: ['variables.file'] }))
    form.append('file', pdfBlob, `${numero_contrato || contrato_id}.pdf`)

    const res = await fetch(autentique_endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${autentique_token}` },
      body: form,
    })

    const resultado = await res.json()

    if (!res.ok || resultado.errors) {
      console.error('Autentique API Error:', JSON.stringify(resultado.errors || resultado))
      throw new Error(
        resultado.errors?.[0]?.message || `Erro na API do Autentique (HTTP ${res.status})`,
      )
    }

    const autentique_document_id = resultado.data?.createDocument?.id
    // Achado 18/08/2026, testado ao vivo: a conta da Adriana é adicionada
    // automaticamente como 1º signatário/aprovador pelo Autentique — o
    // cliente NÃO é sempre signatures[0]. Busca pelo nome certo em vez de
    // por posição.
    const signaturesResp: any[] = resultado.data?.createDocument?.signatures || []
    const assinaturaCliente = signaturesResp.find((s) => s.name === nome_cliente)
    const link_assinatura_cliente = assinaturaCliente?.link?.short_link

    if (!autentique_document_id) {
      throw new Error('Falha ao obter ID do documento gerado no Autentique.')
    }

    // Envio real de e-mail via Resend, só quando o botão "Enviar E-mail"
    // pede (enviar_email: true) — antes o botão só gerava o link e fingia
    // ter enviado. Mesmo padrão de remetente/checagem de erro já usado em
    // enviar-candidatura/esqueci-senha.
    let emailStatus: { enviado: boolean; motivo?: string } = { enviado: false }
    if (enviar_email && link_assinatura_cliente) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (!resendApiKey) {
        emailStatus = { enviado: false, motivo: 'RESEND_API_KEY não configurada' }
        console.error('RESEND_API_KEY não configurada — link gerado mas e-mail não enviado')
      } else {
        const htmlBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#C0392B;padding:20px;text-align:center">
              <h1 style="color:white;margin:0">Carro e Cia Veículos</h1>
              <p style="color:#fff;margin:5px 0">Documento para assinatura</p>
            </div>
            <div style="padding:30px;background:#f9f9f9">
              <p>Olá, ${nome_cliente}!</p>
              <p>Segue o link para assinar o <b>${docName}</b>${numero_contrato ? ` (${numero_contrato})` : ''} eletronicamente:</p>
              <p style="text-align:center;margin:25px 0">
                <a href="${link_assinatura_cliente}" style="background:#C0392B;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Assinar documento</a>
              </p>
              <p style="font-size:12px;color:#888">Se o botão não funcionar, copie e cole este link no navegador:<br>${link_assinatura_cliente}</p>
            </div>
            <div style="background:#1A1A1A;padding:15px;text-align:center">
              <p style="color:#888;font-size:12px;margin:0">Carro e Cia Veículos - Uberaba, MG</p>
            </div>
          </div>
        `
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Carro e Cia Veículos <vendas@carroeciamotors.com.br>',
              to: email_cliente,
              subject: `Documento para assinatura — ${docName}`,
              html: htmlBody,
            }),
          })
          const emailData = await emailRes.json().catch(() => ({}))
          if (emailRes.ok) {
            emailStatus = { enviado: true }
          } else {
            emailStatus = { enviado: false, motivo: JSON.stringify(emailData) }
            console.error('Resend recusou o e-mail:', emailRes.status, emailData)
          }
        } catch (err: any) {
          emailStatus = { enviado: false, motivo: err.message }
          console.error('Falha de rede ao enviar e-mail pro cliente:', err)
        }
      }
    }

    const { error: updateError } = await supabase
      .from('contratos_consignacao')
      .update({
        assinatura_link: link_assinatura_cliente,
        assinatura_id_externo: autentique_document_id,
        assinatura_status: 'pendente',
      })
      .eq('id', contrato_id)

    if (updateError) throw updateError

    await supabase.from('assinatura_historico').insert({
      contrato_id,
      evento: emailStatus.enviado ? 'link_enviado_email' : 'link_enviado_autentique',
      detalhes: {
        email: email_cliente,
        link: link_assinatura_cliente,
        autentique_id: autentique_document_id,
        email_status: emailStatus,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contrato enviado para Autentique com sucesso.',
        autentique_document_id,
        signing_link: link_assinatura_cliente,
        email_status: emailStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
