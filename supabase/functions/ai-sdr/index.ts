import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GeminiClient, CRM_FUNCTIONS } from '../_shared/gemini-client.ts'
import { COLUNAS_VEICULO_SEGURAS } from '../_shared/veiculo-safe-fields.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const gemini = new GeminiClient()
const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
const waPhoneId =
  Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID') || 'default_id'

async function getSystemPrompt() {
  const { data } = await supabase
    .from('social_configuracoes')
    .select('ai_system_prompt, whatsapp_number')
    .maybeSingle()

  const { data: promptConfig } = await supabase
    .from('ai_prompts_config')
    .select('prompt_text')
    .eq('slug', 'sdr_whatsapp')
    .maybeSingle()
  const basePrompt =
    promptConfig?.prompt_text ||
    data?.ai_system_prompt ||
    'Você é a Clara, SDR digital da Carro e Cia Motors.'
  const waNumber = data?.whatsapp_number || ''

  // Filtrado por categoria (12/08/2026) — antes pegava as 10 entradas mais
  // recentes de qualquer assunto, incluindo regras de SEO de blog sem nada a
  // ver com atendimento de vendas.
  const { data: brainKnowledge } = await supabase
    .from('brain_ia_knowledge')
    .select('titulo, conteudo, tipo')
    .in('categoria', ['sdr', 'geral'])
    .limit(10)

  let memoryContext = ''
  if (brainKnowledge && brainKnowledge.length > 0) {
    memoryContext =
      '\nConhecimento (Memória Ativa):\n' +
      brainKnowledge.map((k: any) => `[${k.titulo}]: ${k.conteudo || k.tipo}`).join('\n')
  }

  // O prompt principal (versão 1.1, ver docs/clara-prompt.md) já cobre tom,
  // objetivos e fluxo de atendimento em detalhe — só some aqui o que é
  // dinâmico (memória, número da loja) e o lembrete técnico de quais
  // ferramentas usar, com os nomes reais das funções declaradas.
  // Data/hora atual (12/08/2026, achado em teste ao vivo): sem isso, a IA
  // não tem como saber que dia é "hoje" e inventa datas erradas quando o
  // cliente diz "amanhã"/"sexta"/etc — aconteceu de verdade num teste
  // (agendou pra 2024 em vez do dia real). America/Sao_Paulo pra bater com o
  // fuso da loja (Uberaba, MG).
  const agora = new Date()
  const agoraBR = agora.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${basePrompt}${memoryContext}
Data e hora atuais (horário de Brasília): ${agoraBR}. Use isso pra calcular datas relativas como "amanhã", "sexta-feira" etc — nunca invente uma data sem se basear nisso. Ao chamar agendar_visita, sempre mande data_hora em ISO 8601 com o fuso de Brasília (-03:00).
${waNumber ? `O número oficial de WhatsApp da loja é: ${waNumber}. Se for necessário enviar um link direto, use https://wa.me/${waNumber}` : ''}
Ferramentas disponíveis: use consultar_estoque pra verificar veículos disponíveis antes de falar sobre eles; use agendar_visita quando o cliente confirmar dia e horário de visita/avaliação; use enviar_midia_veiculo quando fizer sentido mandar foto ou vídeo de um veículo específico já consultado; use solicitar_atendimento_humano quando o lead estiver qualificado e pronto pra avançar, ou pedir explicitamente para falar com uma pessoa; use atualizar_estagio_lead pra refletir o andamento da conversa no funil.`
}

// Execução de verdade das funções que o Gemini decide chamar — corrigido em
// 12/08/2026 (padrão copiado de supabase/functions/ai-agents/index.ts, que já
// fazia isso certo). Antes, `functionCalls` do Gemini eram sempre descartados
// aqui: a Clara "decidia" agendar visita, mas nada era salvo.
async function executeFunction(name: string, args: any, leadId: string): Promise<any> {
  if (name === 'consultar_estoque') {
    // CRÍTICO (achado em teste ao vivo, 12/08/2026): era `select('*')`, que
    // manda pro Gemini — e por tabela, pro cliente na resposta — todos os
    // dados do PROPRIETÁRIO do veículo (CPF, telefone, endereço, data de
    // nascimento, nome da mãe). Só as colunas relevantes pra um cliente
    // final a partir daqui.
    let q = supabase.from('veiculos').select(COLUNAS_VEICULO_SEGURAS).eq('status', 'disponivel')
    if (args.marca) q = q.ilike('marca', `%${args.marca}%`)
    if (args.modelo) q = q.ilike('modelo', `%${args.modelo}%`)
    if (args.preco_max) q = q.lte('preco_venda', args.preco_max)
    const { data, error } = await q.limit(args.limite || 5)
    if (error) return { error: error.message }
    return { veiculos: data }
  }

  if (name === 'agendar_visita') {
    const dataHora = args.data_hora
    if (!dataHora) return { error: 'data_hora obrigatória' }
    // Trava de sanidade (12/08/2026, achado em teste ao vivo): a IA já
    // inventou uma data no passado (2024) quando não sabia que dia era hoje.
    // Isso foi corrigido injetando a data atual no prompt, mas mantém essa
    // checagem como segunda linha de defesa.
    const dataParsed = new Date(dataHora)
    if (isNaN(dataParsed.getTime()) || dataParsed.getTime() < Date.now() - 60 * 60 * 1000) {
      return { error: `data_hora inválida ou no passado: ${dataHora}. Confirme a data certa com o cliente e tente de novo.` }
    }
    const { data, error } = await supabase
      .from('agendamentos_visita')
      .insert({
        lead_id: leadId,
        veiculo_id: args.veiculo_id || null,
        data_hora: dataHora,
        tipo: args.tipo || 'visita',
      })
      .select()
      .single()
    if (error) return { error: error.message }
    await supabase.from('leads').update({ status: 'agendamento' }).eq('id', leadId)
    return { agendamento: data }
  }

  if (name === 'atualizar_estagio_lead') {
    const status = args.status
    const permitidos = ['novo', 'em_contato', 'agendamento', 'visita', 'fechado', 'perdido']
    if (!permitidos.includes(status)) return { error: `status inválido: ${status}` }
    const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)
    if (error) return { error: error.message }
    return { ok: true, status }
  }

  if (name === 'solicitar_atendimento_humano') {
    const { error } = await supabase.from('leads').update({ ai_enabled: false }).eq('id', leadId)
    if (error) return { error: error.message }
    return { ok: true, motivo: args.motivo || null }
  }

  if (name === 'enviar_midia_veiculo') {
    if (!args.veiculo_id) return { error: 'veiculo_id obrigatório' }
    const { data: veiculo, error } = await supabase
      .from('veiculos')
      .select('marca, modelo, fotos, videos, placa')
      .eq('id', args.veiculo_id)
      .maybeSingle()
    if (error || !veiculo) return { error: error?.message || 'Veículo não encontrado' }

    const { data: lead } = await supabase
      .from('leads')
      .select('telefone')
      .eq('id', leadId)
      .maybeSingle()
    if (!lead?.telefone) return { error: 'Lead sem telefone' }

    const fotos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos.slice(0, 5) : []
    const videos: string[] = args.incluir_video && Array.isArray(veiculo.videos) ? veiculo.videos.slice(0, 1) : []
    let enviados = 0
    for (const url of fotos) {
      const res = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'image', to: lead.telefone, documentUrl: url, leadId, text: `${veiculo.marca} ${veiculo.modelo}` },
      })
      if (!res.error) enviados++
    }
    for (const url of videos) {
      const res = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'video', to: lead.telefone, documentUrl: url, leadId },
      })
      if (!res.error) enviados++
    }
    return { enviados, total: fotos.length + videos.length }
  }

  if (name === 'criar_lead_crm') {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: args.nome,
        telefone: args.telefone,
        veiculo_interesse: args.veiculo_interesse || null,
        origem: 'clara',
        status: 'novo',
      })
      .select()
      .single()
    if (error) return { error: error.message }
    return { lead: data }
  }

  return { error: `Função desconhecida: ${name}` }
}

// Roda o Gemini com histórico + funções; se ele decidir chamar alguma
// função, executa de verdade e continua chamando o Gemini (com as funções
// ainda disponíveis) enquanto ele quiser encadear mais chamadas — até um
// limite — antes de pedir a resposta final em linguagem natural. Sem isso,
// "tem a Hilux? manda foto" numa mensagem só nunca funcionava: ela buscava o
// estoque mas não tinha uma segunda rodada pra decidir mandar a mídia com o
// ID que acabou de descobrir (só via texto solto, sem ID, na resposta
// seguinte). Máximo de 3 rodadas — suficiente pra buscar+agir, evita loop
// infinito se o modelo insistir em chamar função à toa.
const MAX_RODADAS_FUNCOES = 3

async function runGemini(
  history: Array<{ role: 'user' | 'model'; text: string }>,
  novaMensagem: string,
  leadId: string,
) {
  const systemPrompt = await getSystemPrompt()
  const todosResultados: Array<{ name: string; result: any }> = []
  let contextoAtual = novaMensagem
  let historicoAtual = history

  for (let rodada = 0; rodada < MAX_RODADAS_FUNCOES; rodada++) {
    const result = await gemini.generate(contextoAtual, {
      systemPrompt,
      thinkingLevel: 'medium',
      functions: CRM_FUNCTIONS,
      history: historicoAtual,
    })

    if (result.functionCalls.length === 0) {
      return { text: result.text, functionResults: todosResultados }
    }

    const rodadaResultados = await Promise.all(
      result.functionCalls.map(async (fc) => ({
        name: fc.name,
        result: await executeFunction(fc.name, fc.args, leadId),
      })),
    )
    todosResultados.push(...rodadaResultados)

    historicoAtual = [...historicoAtual, { role: 'user', text: contextoAtual }]
    contextoAtual = `Resultado das ferramentas chamadas:\n${JSON.stringify(rodadaResultados, null, 2)}\n\nSe precisar chamar outra função com base nesse resultado (ex: agora que tem o veiculo_id, mandar mídia dele), chame. Senão, responda ao cliente com base no que já tem, seguindo o mesmo tom e as mesmas regras de mensagem curta.`
  }

  // Esgotou as rodadas ainda chamando função — força uma resposta em texto.
  const followUp = await gemini.generate(contextoAtual, {
    systemPrompt,
    thinkingLevel: 'medium',
    history: historicoAtual,
  })
  return { text: followUp.text, functionResults: todosResultados }
}

async function sendWhatsApp(to: string, text: string) {
  if (!waToken) return console.log('Mocked WA to:', to, 'Msg:', text)
  await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text },
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()

    if (body.action === 'init_conversation') {
      const { lead_id, source, veiculo } = body

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .maybeSingle()

      if (leadError) console.error('Erro ao carregar dados do lead:', leadError)

      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead não localizado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const nome = lead.nome || 'Cliente'
      const v = veiculo || 'nosso estoque'
      const initText = `Novo lead recebido do portal ${source}. O cliente se chama ${nome} e tem interesse no veículo: ${v}. Inicie a conversa se apresentando como Clara e puxe assunto para entender o que ele procura, seguindo o fluxo de atendimento.`

      const aiRes = await runGemini([], initText, lead.id)
      const responseText =
        aiRes.text ||
        `Olá ${nome}! Sou a Clara, consultora digital da Carro e Cia. Vi que você tem interesse no ${v}. Como posso te ajudar hoje?`

      await supabase
        .from('conversation_history')
        .insert({ lead_id: lead.id, sender: 'bot', message_text: responseText })

      if (lead.telefone) {
        await sendWhatsApp(lead.telefone, responseText)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Reativado em 12/08/2026 — antes não existia NENHUMA action que
    // processasse a resposta de um cliente depois da primeira mensagem; a
    // Clara mandava a mensagem inicial e nunca mais respondia. Chamado por
    // receive-leads quando chega mensagem nova de WhatsApp e
    // leads.ai_enabled != false.
    if (body.action === 'continue_conversation') {
      const { lead_id, mensagem } = body
      if (!lead_id || !mensagem) {
        return new Response(JSON.stringify({ error: 'lead_id e mensagem são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: lead } = await supabase
        .from('leads')
        .select('id, nome, telefone, ai_enabled')
        .eq('id', lead_id)
        .maybeSingle()
      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead não localizado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (lead.ai_enabled === false) {
        // Humano já assumiu essa conversa — Clara não responde por cima.
        return new Response(JSON.stringify({ success: true, skipped: 'ai_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: historico } = await supabase
        .from('conversation_history')
        .select('sender, message_text, created_at')
        .eq('lead_id', lead_id)
        .order('created_at', { ascending: true })
        .limit(30)

      const history = (historico || [])
        .filter((h: any) => h.message_text && h.sender !== 'internal_note')
        .map((h: any) => ({
          role: h.sender === 'bot' ? ('model' as const) : ('user' as const),
          text: h.message_text,
        }))

      const aiRes = await runGemini(history, mensagem, lead.id)

      await supabase
        .from('conversation_history')
        .insert({ lead_id: lead.id, sender: 'bot', message_text: aiRes.text })

      if (lead.telefone) {
        await sendWhatsApp(lead.telefone, aiRes.text)
      }

      return new Response(
        JSON.stringify({ success: true, functionResults: aiRes.functionResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
