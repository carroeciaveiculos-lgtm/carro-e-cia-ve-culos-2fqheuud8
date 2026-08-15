import { createClient } from 'jsr:@supabase/supabase-js@2'

export type ThinkingLevel = 'minimal' | 'medium' | 'high'

export interface GeminiOptions {
  thinkingLevel?: ThinkingLevel
  temperature?: number
  jsonSchema?: Record<string, unknown>
  systemPrompt?: string
  functions?: Record<string, unknown>[]
  // Turnos anteriores da conversa (12/08/2026, pra Clara conseguir responder
  // a mensagens seguintes, não só a primeira) — `prompt` continua sendo o
  // turno mais recente do usuário, `history` é o que veio antes dele.
  history?: Array<{ role: 'user' | 'model'; text: string }>
}

export interface GeminiResult {
  text: string
  json: Record<string, unknown> | null
  functionCalls: Array<{ name: string; args: Record<string, unknown> }>
  tokenUsage: { input: number; output: number }
}

// Corrigido em 12/08/2026: 'gemini-1.5-flash' está descontinuado (404 em
// toda chamada, sempre caindo pro fallback Groq sem ninguém perceber — nunca
// tinha um log de sucesso do Gemini em logs_ia). Atual: gemini-3.6-flash.
const MODEL = 'gemini-3.6-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const THINKING_BUDGET: Record<ThinkingLevel, number> = {
  minimal: 0,
  medium: 8192,
  high: 24576,
}

// Corrigido em 12/08/2026: as funções abaixo eram declaradas pro Gemini mas
// NUNCA executadas em lugar nenhum (ai-sdr descartava functionCalls). Também
// tinha nome divergente do prompt (buscar_veiculos_estoque vs
// consultar_estoque, que o prompt já pedia) e enum de status que não batia
// com o Kanban real. Ver docs/leads-e-sdr.md.
export const CRM_FUNCTIONS = [
  {
    name: 'consultar_estoque',
    description: 'Buscar veiculos disponiveis no estoque da concessionaria',
    parameters: {
      type: 'OBJECT',
      properties: {
        marca: { type: 'STRING', description: 'Marca do veiculo' },
        modelo: { type: 'STRING', description: 'Modelo do veiculo' },
        preco_max: { type: 'NUMBER', description: 'Preco maximo' },
        limite: { type: 'INTEGER', description: 'Limite de resultados' },
      },
    },
  },
  {
    name: 'criar_lead_crm',
    description: 'Criar um novo lead no CRM',
    parameters: {
      type: 'OBJECT',
      properties: {
        nome: { type: 'STRING' },
        telefone: { type: 'STRING' },
        email: { type: 'STRING', description: 'E-mail do cliente, se ja informado' },
        veiculo_interesse: { type: 'STRING' },
        tipo: {
          type: 'STRING',
          description:
            'O que o cliente quer, de acordo com a conversa: comprador (quer comprar um veiculo do estoque), vendedor (quer vender o carro dele pra loja), troca (quer trocar o carro dele por outro), consignacao (quer deixar o carro na loja pra loja vender por ele), financiamento (quer financiar a compra de um veiculo), seguro_auto (quer contratar seguro de carro), consorcio (quer entrar em consorcio pra comprar veiculo)',
          enum: [
            'comprador',
            'vendedor',
            'troca',
            'consignacao',
            'financiamento',
            'seguro_auto',
            'consorcio',
          ],
        },
      },
      required: ['nome', 'telefone'],
    },
  },
  {
    name: 'salvar_email_lead',
    description:
      'Salvar ou atualizar o e-mail do cliente atual no cadastro do CRM, assim que ele informar durante a conversa',
    parameters: {
      type: 'OBJECT',
      properties: {
        email: { type: 'STRING', description: 'E-mail informado pelo cliente' },
      },
      required: ['email'],
    },
  },
  {
    name: 'agendar_visita',
    description:
      'Agendar visita/avaliacao presencial na loja para um lead, na data e horario escolhidos pelo cliente',
    parameters: {
      type: 'OBJECT',
      properties: {
        lead_id: { type: 'STRING' },
        data_hora: { type: 'STRING', description: 'Data e hora em ISO 8601' },
        veiculo_id: { type: 'STRING', description: 'Veiculo de interesse, se houver' },
        tipo: { type: 'STRING', enum: ['visita', 'avaliacao'] },
      },
      required: ['lead_id', 'data_hora'],
    },
  },
  {
    name: 'atualizar_estagio_lead',
    description:
      'Atualizar estagio do lead no funil de vendas e/ou a temperatura (qualificacao) dele. Pode chamar so com status, so com temperatura, ou os dois juntos.',
    parameters: {
      type: 'OBJECT',
      properties: {
        lead_id: { type: 'STRING' },
        status: {
          type: 'STRING',
          enum: ['novo', 'em_contato', 'agendamento', 'visita', 'fechado', 'perdido'],
        },
        temperatura: {
          type: 'STRING',
          description:
            'frio: cliente so curioso, sem decisao tomada ainda. morno: demonstrou interesse real mas ainda esta decidindo (comparando opcoes, sem pressa). quente: pronto pra avancar (quer agendar, fechar negocio, ou pediu pra falar com um humano). Reavalie sempre que o tom da conversa mudar.',
          enum: ['frio', 'morno', 'quente'],
        },
      },
      required: ['lead_id'],
    },
  },
  {
    name: 'solicitar_atendimento_humano',
    description:
      'Transferir a conversa para um vendedor humano quando o lead estiver qualificado ou pedir explicitamente para falar com uma pessoa',
    parameters: {
      type: 'OBJECT',
      properties: {
        lead_id: { type: 'STRING' },
        motivo: { type: 'STRING' },
      },
      required: ['lead_id'],
    },
  },
  {
    name: 'enviar_midia_veiculo',
    description:
      'Enviar fotos e/ou video de um veiculo do estoque pelo WhatsApp para o lead. IMPORTANTE: só chame esta funcao DEPOIS de ja ter o veiculo_id real, devolvido por uma chamada anterior de consultar_estoque nesta mesma conversa — nunca invente ou suponha um veiculo_id. Se ainda nao consultou o estoque, chame consultar_estoque primeiro e espere o resultado antes de enviar midia.',
    parameters: {
      type: 'OBJECT',
      properties: {
        lead_id: { type: 'STRING' },
        veiculo_id: { type: 'STRING', description: 'UUID real, obtido de consultar_estoque' },
        incluir_video: { type: 'BOOLEAN' },
      },
      required: ['lead_id', 'veiculo_id'],
    },
  },
]

// Achado em auditoria (13/08/2026, captura real de conversa com cliente):
// às vezes o modelo escreve a chamada de função como texto solto dentro da
// própria resposta (ex: <function=consultar_estoque>{"marca":"Toyota"}
// </function>) em vez de usar o mecanismo de function-calling de verdade —
// e isso ia direto pro cliente, sem filtro nenhum. Rede de segurança: limpa
// qualquer coisa nesse formato do texto antes de devolver, não importa qual
// provedor (Gemini ou Groq) gerou. Não resolve a causa (o modelo não devia
// fazer isso), só impede que vaze pro cliente de novo enquanto isso não é
// investigado a fundo.
function limparTextoDeChamadasDeFuncao(texto: string): string {
  return texto
    .replace(/<function[=:][^>]*>[\s\S]*?<\/function>/gi, '')
    .replace(/<function[=:][^>]*\/>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Converte declaração de função no formato Gemini (types em MAIÚSCULO, ex.
// 'OBJECT'/'STRING') pro formato OpenAI/Groq (types em minúsculo), usado no
// fallback. Groq só entende JSON Schema padrão.
function toGroqTools(functions: Record<string, any>[]): any[] {
  const lowerTypes = (schema: any): any => {
    if (!schema || typeof schema !== 'object') return schema
    const out: any = { ...schema }
    if (typeof out.type === 'string') out.type = out.type.toLowerCase()
    if (out.properties) {
      out.properties = Object.fromEntries(
        Object.entries(out.properties).map(([k, v]) => [k, lowerTypes(v)]),
      )
    }
    return out
  }
  return functions.map((fn) => ({
    type: 'function',
    function: {
      name: fn.name,
      description: fn.description,
      parameters: lowerTypes(fn.parameters) || { type: 'object', properties: {} },
    },
  }))
}

export class GeminiClient {
  private apiKey: string | null
  private groqKey: string | null
  private supabase: ReturnType<typeof createClient>

  constructor() {
    // GEMINI_APY_KEY: nome do secret configurado de verdade no projeto (erro
    // de digitação histórico — "APY" em vez de "API"). Aceita os dois nomes
    // pra não depender de renomear o secret. Descoberto em 12/08/2026: o
    // GeminiClient nunca funcionou nenhuma vez desde que existe (zero
    // registros de sucesso em logs_ia pra acao='gemini_generate') porque só
    // procurava GEMINI_API_KEY.
    this.apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_APY_KEY') || null
    this.groqKey = Deno.env.get('GROQ_API_KEY') || null
    if (!this.apiKey && !this.groqKey) {
      throw new Error('Nem GEMINI_API_KEY/GEMINI_APY_KEY nem GROQ_API_KEY estão configurados')
    }
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
  }

  async generate(prompt: string, options: GeminiOptions = {}): Promise<GeminiResult> {
    if (this.apiKey) {
      try {
        return await this.generateViaGemini(prompt, options)
      } catch (err) {
        if (!this.groqKey) throw err
        console.error('Gemini falhou, caindo pro Groq:', err)
      }
    }
    if (!this.groqKey) throw new Error('Nenhum provedor de IA disponível')
    return await this.generateViaGroq(prompt, options)
  }

  private async generateViaGemini(prompt: string, options: GeminiOptions): Promise<GeminiResult> {
    const thinkingLevel = options.thinkingLevel ?? 'medium'
    const contents = [
      ...(options.history || []).map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: prompt }] },
    ]
    const generationConfig: Record<string, unknown> = {
      temperature: options.temperature ?? 0.7,
      thinkingConfig: { thinkingBudget: THINKING_BUDGET[thinkingLevel] },
    }
    if (options.jsonSchema) {
      generationConfig.responseMimeType = 'application/json'
      generationConfig.responseSchema = options.jsonSchema
    }
    const body: Record<string, unknown> = { contents, generationConfig }
    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] }
    }
    if (options.functions) {
      body.tools = [{ functionDeclarations: options.functions }]
    }

    const url = `${API_BASE}/${MODEL}:generateContent?key=${this.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API ${res.status}: ${errText}`)
    }
    const data = await res.json()
    const candidate = data.candidates?.[0]
    const text = limparTextoDeChamadasDeFuncao(candidate?.content?.parts?.[0]?.text ?? '')
    let json: Record<string, unknown> | null = null
    if (options.jsonSchema && text) {
      try {
        json = JSON.parse(text)
      } catch {
        json = null
      }
    }
    const functionCalls = (candidate?.content?.parts ?? [])
      .filter((p: any) => p.functionCall)
      .map((p: any) => ({ name: p.functionCall.name, args: p.functionCall.args }))
    const tokenUsage = {
      input: data.usageMetadata?.promptTokenCount ?? 0,
      output: data.usageMetadata?.candidatesTokenCount ?? 0,
    }

    await this.logUso('google', MODEL, thinkingLevel, tokenUsage)
    return { text, json, functionCalls, tokenUsage }
  }

  // Plano B (12/08/2026, pedido da Adriana): se o Gemini falhar (chave,
  // quota, indisponibilidade), tenta de novo via Groq antes de desistir.
  // Function-calling é traduzido pro formato OpenAI/Groq (ver toGroqTools).
  private async generateViaGroq(prompt: string, options: GeminiOptions): Promise<GeminiResult> {
    const messages = [
      ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      ...(options.history || []).map((h) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text,
      })),
      { role: 'user', content: prompt },
    ]
    const body: Record<string, unknown> = {
      model: GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
    }
    if (options.functions) body.tools = toGroqTools(options.functions)
    if (options.jsonSchema) body.response_format = { type: 'json_object' }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Groq API ${res.status}: ${errText}`)
    }
    const data = await res.json()
    const message = data.choices?.[0]?.message
    const text = limparTextoDeChamadasDeFuncao(message?.content ?? '')
    let json: Record<string, unknown> | null = null
    if (options.jsonSchema && text) {
      try {
        json = JSON.parse(text)
      } catch {
        json = null
      }
    }
    const functionCalls = (message?.tool_calls || []).map((tc: any) => ({
      name: tc.function?.name,
      args: (() => {
        try {
          return JSON.parse(tc.function?.arguments || '{}')
        } catch {
          return {}
        }
      })(),
    }))
    const tokenUsage = {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    }

    await this.logUso('groq', GROQ_MODEL, options.thinkingLevel ?? 'medium', tokenUsage)
    return { text, json, functionCalls, tokenUsage }
  }

  private async logUso(
    provider: string,
    modelo: string,
    thinkingLevel: ThinkingLevel,
    tokenUsage: { input: number; output: number },
  ) {
    await this.supabase
      .from('logs_ia')
      .insert({
        acao: 'gemini_generate',
        provider,
        modelo,
        status: 'sucesso',
        tokens_input: tokenUsage.input,
        tokens_output: tokenUsage.output,
        certeza_reportada: `thinking:${thinkingLevel} | Input: ${tokenUsage.input}, Output: ${tokenUsage.output}`,
      })
      .then(
        () => {},
        () => {},
      )
  }

  async generateStructured(
    prompt: string,
    schema: Record<string, unknown>,
    options: Omit<GeminiOptions, 'jsonSchema'> = {},
  ): Promise<GeminiResult> {
    return this.generate(prompt, { ...options, jsonSchema: schema })
  }
}
