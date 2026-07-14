import { supabase } from '@/lib/supabase/client'

export type AgentType = 'negotiation' | 'trade_in'

export interface AgentResponse {
  response: string
  function_calls: Array<{ name: string; args: Record<string, unknown> }>
  function_results: Array<{ name: string; result: unknown }>
}

export async function invokeAgent(
  agentType: AgentType,
  message: string,
  context?: Record<string, unknown>,
): Promise<AgentResponse> {
  const { data, error } = await supabase.functions.invoke('ai-agents', {
    body: { agent_type: agentType, message, context },
  })

  if (error) throw error
  return data as AgentResponse
}
