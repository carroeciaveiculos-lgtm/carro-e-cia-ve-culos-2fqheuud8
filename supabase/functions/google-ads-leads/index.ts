import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encontrarLeadAtivo, anexarNotaContato, normalizarTelefone } from '../_shared/lead-dedup.ts'

// Webhook de Lead Form Extension do Google Ads (formulário dentro do anúncio).
// Configurado no Google Ads: URL desta function + "Chave" (google_key).
// Formato do payload: https://developers.google.com/google-ads/webhook/docs/overview
const WEBHOOK_KEY = Deno.env.get('GOOGLE_ADS_LEAD_WEBHOOK_KEY') ?? ''

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

// Comparação em tempo constante, para não vazar a chave por diferença de tempo.
const chaveConfere = (recebida: unknown): boolean => {
  if (!WEBHOOK_KEY || typeof recebida !== 'string' || recebida.length !== WEBHOOK_KEY.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < recebida.length; i++) {
    diff |= recebida.charCodeAt(i) ^ WEBHOOK_KEY.charCodeAt(i)
  }
  return diff === 0
}

const coluna = (cols: any[], id: string): string =>
  (cols.find((c) => c?.column_id === id)?.string_value ?? '').toString().trim()

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  if (!chaveConfere(body?.google_key)) {
    return json({ error: 'Chave inválida' }, 401)
  }

  // "Enviar dados de teste" do Google Ads: confirma que o webhook responde,
  // mas não cria lead de verdade no CRM.
  if (body.is_test === true) {
    console.log('[google-ads-leads] teste recebido', body.form_id)
    return json({ success: true, teste: true })
  }

  const cols: any[] = Array.isArray(body.user_column_data) ? body.user_column_data : []
  const nomeCompleto = coluna(cols, 'FULL_NAME')
  const nome =
    nomeCompleto ||
    [coluna(cols, 'FIRST_NAME'), coluna(cols, 'LAST_NAME')].filter(Boolean).join(' ') ||
    'Lead Google Ads'
  const email = coluna(cols, 'EMAIL') || null
  const telefone = normalizarTelefone(coluna(cols, 'PHONE_NUMBER'))
  const cidade = coluna(cols, 'CITY')

  if (!telefone && !email) {
    return json({ error: 'Lead sem telefone nem e-mail' }, 400)
  }

  const leadIdGoogle = String(body.lead_id ?? '').replace(/[^A-Za-z0-9_-]/g, '')
  const gclid = body.gcl_id ? String(body.gcl_id) : null
  const marcaLeadId = leadIdGoogle ? `google_lead_id:${leadIdGoogle}` : null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    // O Google reenvia quando não recebe 200: o mesmo lead_id nunca vira dois leads.
    if (marcaLeadId) {
      const { data: jaExiste } = await supabase
        .from('leads')
        .select('id')
        .ilike('observacoes', `%${marcaLeadId}%`)
        .limit(1)
      if (jaExiste && jaExiste.length > 0) {
        return json({ success: true, duplicado: true })
      }
    }

    const detalhes = [
      marcaLeadId,
      body.campaign_id ? `campanha_google:${body.campaign_id}` : null,
      body.form_id ? `formulario_google:${body.form_id}` : null,
      cidade ? `cidade:${cidade}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    // Mesmo telefone/e-mail com lead ainda ativo reaproveita o lead (regra de 12/08/2026).
    const existente = await encontrarLeadAtivo(supabase, { telefone, email })
    if (existente) {
      const { error } = await supabase
        .from('leads')
        .update({
          observacoes: anexarNotaContato(
            [existente.observacoes, detalhes].filter(Boolean).join('\n') || null,
            'Google Ads (formulário do anúncio)',
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id)
      if (error) throw error
      return json({ success: true, reaproveitado: true })
    }

    const { error } = await supabase.from('leads').insert({
      nome,
      email,
      telefone,
      origem: 'google_ads',
      tipo: 'comprador',
      status: 'novo',
      temperatura: 'quente',
      campanha: body.campaign_id ? `google_${body.campaign_id}` : 'google_ads',
      gclid,
      observacoes: detalhes || null,
    })
    if (error) throw error

    return json({ success: true })
  } catch (err: any) {
    // 500 faz o Google tentar de novo mais tarde, o que é o desejado se o banco falhou.
    console.error('[google-ads-leads] erro', err?.message ?? err)
    return json({ error: 'Falha ao salvar o lead' }, 500)
  }
})
