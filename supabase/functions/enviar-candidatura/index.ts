import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const RH_EMAIL = 'rh@carroeciamotors.com.br'
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

// Endpoint público (sem login) — quem preenche o formulário "Trabalhe Conosco"
// não tem conta no site. Por isso o upload do currículo acontece aqui dentro,
// direto pro R2 com a chave de serviço, em vez de usar get-r2-presigned-url
// (que exige JWT de usuário autenticado). Validação de tipo/tamanho de
// arquivo é feita aqui, já que é a única barreira antes do R2 num endpoint
// público.
async function uploadCurriculoParaR2(file: File): Promise<string> {
  const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
  const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
  const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
  const R2_BUCKET = Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens'

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
    throw new Error('R2 não configurado')
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    forcePathStyle: true,
  })

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `candidaturas/${Date.now()}_${sanitizedFileName}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: 'application/pdf',
    }),
  )

  return `${R2_PUBLIC_BASE}/${key}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const formData = await req.formData()
    const nome = String(formData.get('nome') || '').trim()
    const telefone = String(formData.get('telefone') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const informacoesAdicionais = String(formData.get('informacoes_adicionais') || '').slice(
      0,
      20000,
    )
    const vagaId = String(formData.get('vaga_id') || '').trim() || null
    const curriculo = formData.get('curriculo')

    if (!nome || !telefone || !email) {
      return new Response(
        JSON.stringify({ error: 'Nome, telefone e e-mail são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!(curriculo instanceof File) || curriculo.size === 0) {
      return new Response(JSON.stringify({ error: 'Currículo é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (curriculo.type !== 'application/pdf' && !curriculo.name.toLowerCase().endsWith('.pdf')) {
      return new Response(JSON.stringify({ error: 'Currículo precisa ser um arquivo PDF' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (curriculo.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Currículo excede o limite de 8MB' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const curriculoUrl = await uploadCurriculoParaR2(curriculo)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: candidatura, error: insertError } = await supabase
      .from('candidaturas')
      .insert({
        nome,
        telefone,
        email,
        informacoes_adicionais: informacoesAdicionais || null,
        curriculo_url: curriculoUrl,
        curriculo_nome_arquivo: curriculo.name,
        vaga_id: vagaId,
      })
      .select()
      .single()

    if (insertError) throw insertError

    let vagaTitulo = 'Candidatura espontânea'
    if (vagaId) {
      const { data: vaga } = await supabase.from('vagas').select('titulo').eq('id', vagaId).maybeSingle()
      if (vaga?.titulo) vagaTitulo = vaga.titulo
    }

    // Diagnóstico (15/08/2026): a versão anterior fazia `fetch(...).catch(...)`
    // sem checar `res.ok` — um erro HTTP do Resend (ex: chave inválida, "só
    // pode mandar pro seu próprio e-mail em modo sandbox") resolvia a promise
    // normalmente e passava batido, sem log nenhum. A candidatura em si
    // continua sendo salva mesmo se o e-mail falhar — só o diagnóstico virou
    // visível na resposta e no log.
    let emailStatus: { enviado: boolean; motivo?: string } = { enviado: false }
    if (RESEND_API_KEY) {
      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#C0392B;padding:20px;text-align:center">
            <h1 style="color:white;margin:0">Carro e Cia Veículos</h1>
            <p style="color:#fff;margin:5px 0">Nova candidatura - Trabalhe Conosco</p>
          </div>
          <div style="padding:30px;background:#f9f9f9">
            <p><b>Vaga:</b> ${vagaTitulo}</p>
            <p><b>Nome:</b> ${nome}</p>
            <p><b>Telefone:</b> ${telefone}</p>
            <p><b>E-mail:</b> ${email}</p>
            <p><b>Informações adicionais:</b><br>${(informacoesAdicionais || 'Não informado').replace(/\n/g, '<br>')}</p>
            <p><b>Currículo:</b> <a href="${curriculoUrl}">${curriculoUrl}</a></p>
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
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Carro e Cia Veículos <rh@carroeciamotors.com.br>',
            to: RH_EMAIL,
            subject: `Nova candidatura - ${nome}`,
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
        console.error('Falha de rede ao enviar e-mail pro RH:', err)
      }
    } else {
      emailStatus = { enviado: false, motivo: 'RESEND_API_KEY não configurada' }
      console.error('RESEND_API_KEY não configurada — candidatura salva mas e-mail não enviado')
    }

    return new Response(JSON.stringify({ success: true, candidatura, emailStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Erro ao processar candidatura:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro ao enviar candidatura' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
