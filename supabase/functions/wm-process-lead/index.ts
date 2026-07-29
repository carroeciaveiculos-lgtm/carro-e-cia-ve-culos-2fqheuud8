import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json()
    const { IdLead, CodigoCliente, Cnpj } = body

    console.log(`[wm-process-lead] Processando lead ${IdLead}`)

    if (!IdLead) {
      return new Response(JSON.stringify({ erro: 'IdLead é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hash = await getAuthHash()
    if (!hash) {
      return new Response(JSON.stringify({ erro: 'Falha na autenticação Webmotors' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const leadData = await consultarLeadWebmotors(hash, IdLead)

    if (!leadData) {
      console.log(`[wm-process-lead] Lead ${IdLead} não encontrado na Webmotors`)
      return new Response(JSON.stringify({ message: 'Lead não encontrado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[wm-process-lead] Lead ${IdLead} obtido:`, leadData.tipoLead)

    const { data: plataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .maybeSingle()

    const { data: leadInserido, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: leadData.nome || leadData.cliente?.nome || 'Lead Webmotors',
        email: leadData.email || leadData.cliente?.email || null,
        telefone: leadData.telefone || leadData.cliente?.telefone || null,
        cpf: leadData.cpf || leadData.cliente?.cpf || null,
        origem: 'webmotors',
        external_lead_id: String(IdLead),
        tipo: getIdTipoLead(leadData.tipoLead),
        status: 'novo',
        veiculo_interesse: formatarVeiculo(leadData),
        observacoes: leadData.mensagem || leadData.lead?.mensagem || '',
        valor_veiculo: leadData.valorProposta || leadData.anuncio?.preco || null,
      })
      .select()
      .single()

    if (leadError) {
      console.error('[wm-process-lead] Erro ao inserir lead:', leadError)
      return new Response(JSON.stringify({ erro: 'Erro ao salvar lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[wm-process-lead] Lead ${IdLead} inserido com ID: ${leadInserido.id}`)

    if (plataforma) {
      await supabase.from('sync_log').insert({
        plataforma_id: plataforma.id,
        acao: 'lead_recebido',
        status: 'sucesso',
        mensagem: `Lead ${IdLead} processado - Tipo: ${getIdTipoLead(leadData.tipoLead)}`,
        metadata: { leadCrmId: leadInserido.id, IdLead },
      })
    }

    const sdrResult = await dispararAISDR(leadInserido.id, leadData)

    return new Response(
      JSON.stringify({
        message: 'Lead processado com sucesso',
        leadCrmId: leadInserido.id,
        aiSdrDisparado: sdrResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[wm-process-lead] Erro:', error)
    return new Response(JSON.stringify({ erro: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function getAuthHash(): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const response = await fetch(`${supabaseUrl}/functions/v1/wm-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_hash' }),
    })
    const data = await response.json()
    return data.hashAutenticacao || null
  } catch (err) {
    console.error('[wm-process-lead] Erro ao obter hash de autenticação:', err)
    return null
  }
}

async function consultarLeadWebmotors(hash: string, idLead: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api-webmotors.sensedia.com/lead/v1/leads?id=${idLead}`, {
      headers: {
        Authorization: `Bearer ${hash}`,
        client_id: Deno.env.get('WM_CLIENT_ID')!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[wm-process-lead] API retornou ${response.status}`)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error('[wm-process-lead] Erro consulta:', err)
    return null
  }
}

function getIdTipoLead(tipo: number | string): string {
  const tipos: Record<string, string> = {
    '1': 'PhoneTracking',
    '2': 'Proposta',
    '3': 'PropostaZeroKm',
    '4': 'PropostaMoto',
    '11': 'WhatsappCTA',
    '12': 'WhatsAppCTAVeiculoInteresse',
  }
  return tipos[String(tipo)] || 'Desconhecido'
}

function formatarVeiculo(lead: any): string {
  const anuncio = lead.anuncio || lead
  const partes = [
    anuncio.marca,
    anuncio.modelo,
    anuncio.versao,
    anuncio.ano_modelo ? `${anuncio.ano_modelo}` : null,
  ].filter(Boolean)
  return partes.join(' ') || 'Não informado'
}

async function dispararAISDR(leadCrmId: string, leadData: any): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const response = await fetch(`${supabaseUrl}/functions/v1/lead-automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadCrmId,
        origem: 'webmotors',
        tipo: getIdTipoLead(leadData.tipoLead),
        contato: {
          nome: leadData.nome || leadData.cliente?.nome,
          email: leadData.email || leadData.cliente?.email,
          telefone: leadData.telefone || leadData.cliente?.telefone,
        },
        veiculo: formatarVeiculo(leadData),
        mensagem: leadData.mensagem || leadData.lead?.mensagem || '',
      }),
    })

    return response.ok
  } catch (err) {
    console.error('[wm-process-lead] Erro AI SDR:', err)
    return false
  }
}
