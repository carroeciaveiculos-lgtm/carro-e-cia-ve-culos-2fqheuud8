import { createClient } from 'jsr:@supabase/supabase-js@2'

export type ThinkingLevel = 'minimal' | 'medium' | 'high'

export interface GeminiOptions {
  thinkingLevel?: ThinkingLevel
  temperature?: number
  jsonSchema?: Record<string, unknown>
  systemPrompt?: string
  functions?: Record<string, unknown>[]
}

export interface GeminiResult {
  text: string
  json: Record<string, unknown> | null
  functionCalls: Array<{ name: string; args: Record<string, unknown> }>
  tokenUsage: { input: number; output: number }
}

const MODEL = 'gemini-3.5-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const THINKING_BUDGET: Record<ThinkingLevel, number> = {
  minimal: 0,
  medium: 8192,
  high: 24576,
}

export const CRM_FUNCTIONS = [
  {
    name: 'buscar_veiculos_estoque',
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
        veiculo_interesse: { type: 'STRING' },
      },
      required: ['nome', 'telefone'],
    },
  },
  {
    name: 'agendar_test_drive',
    description: 'Agendar test drive para um lead',
    parameters: {
      type: 'OBJECT',
      properties: {
        lead_id: { type: 'STRING' },
        data: { type: 'STRING' },
        veiculo_id: { type: 'STRING' },
      },
      required: ['lead_id', 'data'],
    },
  },
  {
    name: 'atualizar_estagio_lead',
    description: 'Atualizar estagio do lead no funil de vendas',
    parameters: {
      type: 'OBJECT',
      properties: {
        lead_id: { type: 'STRING' },
        status: {
          type: 'STRING',
          enum: ['novo', 'contatado', 'qualificado', 'negociacao', 'fechado', 'perdido'],
        },
      },
      required: ['lead_id', 'status'],
    },
  },
]

export class GeminiClient {
  private apiKey: string
  private supabase: ReturnType<typeof createClient>

  constructor() {
    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) throw new Error('GEMINI_API_KEY not configured')
    this.apiKey = key
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
  }

  async generate(prompt: string, options: GeminiOptions = {}): Promise<GeminiResult> {
    const thinkingLevel = options.thinkingLevel ?? 'medium'
    const contents = [{ role: 'user', parts: [{ text: prompt }] }]
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
    const text = candidate?.content?.parts?.[0]?.text ?? ''
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

    await this.supabase
      .from('logs_ia')
      .insert({
        acao: 'gemini_generate',
        provider: 'google',
        modelo: MODEL,
        status: 'sucesso',
        tokens_input: tokenUsage.input,
        tokens_output: tokenUsage.output,
        certeza_reportada: `thinking:${thinkingLevel} | Input: ${tokenUsage.input}, Output: ${tokenUsage.output}`,
      })
      .then(
        () => {},
        () => {},
      )

    return { text, json, functionCalls, tokenUsage }
  }

  async generateStructured(
    prompt: string,
    schema: Record<string, unknown>,
    options: Omit<GeminiOptions, 'jsonSchema'> = {},
  ): Promise<GeminiResult> {
    return this.generate(prompt, { ...options, jsonSchema: schema })
  }
}
