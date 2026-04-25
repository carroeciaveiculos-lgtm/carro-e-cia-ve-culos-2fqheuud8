import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_API_URL = 'https://api.brevo.com/v3'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

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
    } = await req.json()

    if (!nome || !whatsapp) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando (nome e whatsapp)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const cleanTelefone = whatsapp.replace(/\D/g, '')

    // 1. Salvar no Supabase (Tabela leads unificada)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome,
        email: email || null,
        telefone: cleanTelefone,
        carro_modelo: modelo_veiculo || null,
        carro_ano: ano_veiculo || null,
        carro_km: km || null,
        observacoes: condicao ? `Condição do veículo: ${condicao}` : null,
        campanha: campanha || 'geral',
        origem: origem || `Site - ${campanha}`,
        tipo: 'vendedor',
        status: 'novo',
        temperatura: 'quente',
        utm_source,
        utm_medium,
        utm_campaign,
      })
      .select()
      .single()

    if (leadError) throw leadError

    // 2. Enviar para Brevo se tiver email
    let brevoContactId = null
    if (email && BREVO_API_KEY) {
      const listIdMap: Record<string, number> = {
        consignacao: 5,
        venda_segura: 8,
        venda_rapida: 9,
        troca_troco: 10,
      }

      const listId = listIdMap[campanha] || 5

      const firstName = nome.split(' ')[0]
      const lastName = nome.split(' ').slice(1).join(' ')

      const brevoResponse = await fetch(`${BREVO_API_URL}/contacts`, {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          email: email,
          firstName: firstName,
          lastName: lastName || undefined,
          attributes: {
            WHATSAPP: cleanTelefone,
            VEICULO: modelo_veiculo || '',
            ANO_VEICULO: ano_veiculo || '',
            KM_VEICULO: km || '',
            CONDICAO: condicao || '',
            CAMPANHA: campanha || '',
            DATA_LEAD: new Date().toISOString().split('T')[0],
          },
          listIds: [listId],
          updateEnabled: true,
        }),
      })

      if (brevoResponse.ok) {
        const brevoData = await brevoResponse.json().catch(() => ({}))
        brevoContactId = brevoData.id

        await supabase
          .from('leads')
          .update({
            brevo_contact_id: brevoContactId?.toString(),
            source_brevo: true,
          })
          .eq('id', lead.id)

        await supabase.from('lead_integracao_log').insert({
          lead_id: lead.id,
          ferramenta: 'brevo',
          acao: 'contato_criado',
          status_code: brevoResponse.status,
        })
      } else {
        const err = await brevoResponse.text()
        await supabase.from('lead_integracao_log').insert({
          lead_id: lead.id,
          ferramenta: 'brevo',
          acao: 'erro_criacao',
          status_code: brevoResponse.status,
          mensagem_erro: err,
        })
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
