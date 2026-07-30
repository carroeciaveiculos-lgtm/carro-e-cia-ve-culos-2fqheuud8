import { supabase } from '@/lib/supabase/client'

export interface AIPromptConfig {
  id: string
  slug: string
  name: string
  prompt_text: string
  description: string | null
  default_prompt: string
  updated_at: string | null
}

export async function fetchAIPrompts(): Promise<AIPromptConfig[]> {
  const { data, error } = await supabase.from('ai_prompts_config').select('*').order('name')
  if (error) throw error
  return (data || []) as AIPromptConfig[]
}

export async function updateAIPrompt(slug: string, promptText: string): Promise<void> {
  const { error } = await supabase
    .from('ai_prompts_config')
    .update({ prompt_text: promptText, updated_at: new Date().toISOString() })
    .eq('slug', slug)
  if (error) throw error
}

export async function restoreDefaultPrompt(slug: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('ai_prompts_config')
    .select('default_prompt')
    .eq('slug', slug)
    .single()
  if (fetchError) throw fetchError
  const { error } = await supabase
    .from('ai_prompts_config')
    .update({ prompt_text: data.default_prompt, updated_at: new Date().toISOString() })
    .eq('slug', slug)
  if (error) throw error
}
