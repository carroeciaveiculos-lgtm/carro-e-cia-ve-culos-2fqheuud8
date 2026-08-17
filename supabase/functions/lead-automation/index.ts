import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encontrarLeadAtivo, anexarNotaContato, normalizarTelefone } from '../_shared/lead-dedup.ts'
import { enviarContatoBrevo } from '../_shared/brevo.ts'

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    const {
      nome,
      email,
      whatsapp,
      modelo_veiculo,
      ano_veiculo,
      km,
      condicao,
      campanha,
      origem,
      utm_source,
      utm_medium,
      utm_campaign,
      gclid,
    } = await req.json()

    // Google Ads (auto-tagging ativado na conta, 17/08/2026) manda gclid em
    // vez de UTM — se veio um gclid, a origem é Google Ads de verdade,
    // independente do que o formulário mandou de origem padrão.
    const origemFinal = gclid ? 'google_ads' : origem

    if (!nome || !whatsapp) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando (nome e whatsapp)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const cleanTelefone = normalizarTelefone(whatsapp)

    // Trava de duplicidade (12/08/2026): mesmo telefone/e-mail com lead ainda
    // ativo reaproveita o lead existente em vez de criar outro solto.
    const leadExistente = await encontrarLeadAtivo(supabase, {
      telefone: cleanTelefone,
      email: email || null,
    })

    const condicaoNota = condicao ? `Condição do veículo: ${condicao}` : null
    let lead: any
    let leadError: any
    if (leadExistente) {
      const notaContato = anexarNotaContato(
        [leadExistente.observacoes, condicaoNota].filter(Boolean).join('\n') || null,
        origemFinal || `Site - ${campanha}`,
      )
      ;({ data: lead, error: leadError } = await supabase
        .from('leads')
        .update({
          carro_modelo: modelo_veiculo || null,
          carro_ano: ano_veiculo || null,
          carro_km: km || null,
          observacoes: notaContato,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadExistente.id)
        .select()
        .single())
    } else {
      // 1. Salvar no Supabase (Tabela leads unificada)
      ;({ data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          nome,
          email: email || null,
          telefone: cleanTelefone,
          carro_modelo: modelo_veiculo || null,
          carro_ano: ano_veiculo || null,
          carro_km: km || null,
          observacoes: condicaoNota,
          campanha: campanha || 'geral',
          origem: origemFinal || `Site - ${campanha}`,
          tipo: 'vendedor',
          status: 'novo',
          temperatura: 'quente',
          utm_source,
          utm_medium,
          utm_campaign,
          gclid: gclid || null,
        })
        .select()
        .single())
    }

    if (leadError) throw leadError

    // 2. Enviar para Brevo se tiver email — via helper compartilhado
    // (12/08/2026, ver _shared/brevo.ts) pra usar a mesma chave/log que
    // on-lead-created. A chave agora vem de configuracoes_api (banco), não
    // mais da env var BREVO_API_KEY — editável no admin sem deploy.
    if (email) {
      // Mapa de lista por campanha: legítimo ficar aqui (cada campanha tem
      // uma lista diferente de propósito), diferente da chave de API, que é
      // a mesma pra todo mundo e por isso foi centralizada.
      const listIdMap: Record<string, number> = {
        consignacao: 5,
        venda_segura: 8,
        venda_rapida: 9,
        troca_troco: 10,
      }
      const listId = listIdMap[campanha] || 5

      const resultado = await enviarContatoBrevo(supabase, lead.id, {
        email,
        nome,
        telefone: cleanTelefone,
        listId,
        attributes: {
          VEICULO: modelo_veiculo || '',
          ANO_VEICULO: ano_veiculo || '',
          KM_VEICULO: km || '',
          CONDICAO: condicao || '',
          CAMPANHA: campanha || '',
          DATA_LEAD: new Date().toISOString().split('T')[0],
        },
      })

      if (resultado.success) {
        await supabase
          .from('leads')
          .update({ brevo_contact_id: resultado.brevoContactId, source_brevo: true })
          .eq('id', lead.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead processado com sucesso',
        lead_id: lead.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    await supabase
      .from('lead_errors')
      .insert({
        lead_data: { source: 'lead-automation', timestamp: new Date().toISOString() },
        error_message: error.message,
      })
      .catch(() => {})
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
