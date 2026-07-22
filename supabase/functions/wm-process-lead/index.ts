import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  try {
    const body = await req.json()
    const { IdLead, CodigoCliente, Cnpj } = body

    console.log(`[wm-process-lead] Processando lead ${IdLead}`)

    // 1. Validar payload
    if (!IdLead) {
      return new Response(JSON.stringify({ erro: 'IdLead é obrigatório' }), { status: 400 })
    }

    // 2. Obter token de acesso Webmotors
    const token = await getAccessToken()
    if (!token) {
      return new Response(JSON.stringify({ erro: 'Falha na autenticação' }), { status: 401 })
    }

    // 3. Consultar lead completo na Webmotors Leads API
    const leadData = await consultarLeadWebmotors(token, IdLead)

    if (!leadData) {
      console.log(`[wm-process-lead] Lead ${IdLead} não encontrado na Webmotors`)
      return new Response(JSON.stringify({ message: 'Lead não encontrado' }), { status: 200 })
    }

    console.log(`[wm-process-lead] Lead ${IdLead} obtido:`, leadData.tipoLead)

    // 4. Buscar plataforma Webmotors
    const { data: plataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .single()

    // 5. Buscar ou criar contato no CRM
    const contatoId = await upsertContato({
      nome: leadData.nome || leadData.cliente?.nome,
      email: leadData.email || leadData.cliente?.email,
      telefone: leadData.telefone || leadData.cliente?.telefone,
      cpf: leadData.cpf || leadData.cliente?.cpf,
      origem: 'webmotors',
    })

    // 6. Inserir lead na tabela de leads do CRM
    const { data: leadInserido, error: leadError } = await supabase
      .from('leads')
      .insert({
        contato_id: contatoId,
        plataforma_id: plataforma?.id,
        origem: 'webmotors',
        id_externo: String(IdLead),
        tipo_lead: getIdTipoLead(leadData.tipoLead),
        status_lead: getIdStatusLead(leadData.statusLead),
        mensagem: leadData.mensagem || leadData.lead?.mensagem || '',
        veiculo_interesse: formatarVeiculo(leadData),
        valor_proposta: leadData.valorProposta || leadData.anuncio?.preco,
        metadata: leadData,
        data_recebimento: new Date().toISOString(),
      })
      .select()
      .single()

    if (leadError) {
      console.error('[wm-process-lead] Erro ao inserir lead:', leadError)
      return new Response(JSON.stringify({ erro: 'Erro ao salvar lead' }), { status: 500 })
    }

    console.log(`[wm-process-lead] Lead ${IdLead} inserido no CRM com ID: ${leadInserido.id}`)

    // 7. Registrar log
    await supabase.from('sync_log').insert({
      plataforma_id: plataforma?.id,
      acao: 'lead_recebido',
      status: 'sucesso',
      mensagem: `Lead ${IdLead} processado - Tipo: ${getIdTipoLead(leadData.tipoLead)}`,
      metadata: { leadCrmId: leadInserido.id, IdLead },
    })

    // 8. Disparar AI SDR para interagir com o lead
    const sdrResult = await dispararAISDR(leadInserido.id, leadData)

    return new Response(
      JSON.stringify({
        message: 'Lead processado com sucesso',
        leadCrmId: leadInserido.id,
        aiSdrDisparado: sdrResult,
      }),
      { status: 200 },
    )
  } catch (error) {
    console.error('[wm-process-lead] Erro:', error)
    return new Response(JSON.stringify({ erro: error.message }), { status: 500 })
  }
})

// ─── Funções auxiliares ─────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/wm-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_token' }),
    })
    const data = await response.json()
    return data.access_token || null
  } catch (err) {
    console.error('[wm-process-lead] Erro token:', err)
    return null
  }
}

async function consultarLeadWebmotors(token: string, idLead: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api-webmotors.sensedia.com/lead/v1/leads?id=${idLead}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

async function upsertContato(dados: any): Promise<string> {
  const { nome, email, telefone, cpf, origem } = dados

  // Buscar por email ou telefone
  let { data: contato } = await supabase
    .from('contatos')
    .select('id')
    .or(`email.eq.${email},telefone.eq.${telefone}`)
    .maybeSingle()

  if (contato) {
    // Atualizar contato existente
    await supabase
      .from('contatos')
      .update({
        ultima_origem: origem,
        ultimo_contato: new Date().toISOString(),
      })
      .eq('id', contato.id)

    return contato.id
  }

  // Criar novo contato
  const { data: novo, error } = await supabase
    .from('contatos')
    .insert({
      nome,
      email,
      telefone,
      cpf,
      origem,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return novo.id
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

function getIdStatusLead(status: number | string): string {
  const statuses: Record<string, string> = {
    '1': 'Nova proposta',
    '2': 'Em negociação',
    '3': 'Aguardando visita',
    '4': 'Visita realizada',
    '5': 'Venda realizada',
    '6': 'Venda não realizada',
    '7': 'Negociação recusada',
  }
  return statuses[String(status)] || 'Novo'
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
    // Invocar a função lead-automation (AI SDR) que já existe no Supabase
    const response = await fetch(
      `https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/lead-automation`,
      {
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
      },
    )

    return response.ok
  } catch (err) {
    console.error('[wm-process-lead] Erro AI SDR:', err)
    return false
  }
}
