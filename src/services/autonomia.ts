import { supabase } from '@/lib/supabase/client'

export interface AutonomiaConfig {
  id: string
  slug: string
  label: string
  enabled: boolean
  rule: string | null
  created_at: string
  updated_at: string
}

export async function fetchAutonomiaConfig(): Promise<AutonomiaConfig[]> {
  const { data, error } = await (supabase as any).from('autonomia_config').select('*').order('slug')
  if (error) throw error
  return (data || []) as AutonomiaConfig[]
}
