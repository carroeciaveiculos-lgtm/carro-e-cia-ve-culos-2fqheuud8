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

export interface AutonomiaLog {
  id: string
  action: string
  details: any
  result: string | null
  created_at: string
}

export async function fetchAutonomiaConfig(): Promise<AutonomiaConfig[]> {
  const { data, error } = await (supabase as any).from('autonomia_config').select('*').order('slug')
  if (error) throw error
  return (data || []) as AutonomiaConfig[]
}

export async function toggleAutonomiaConfig(slug: string, enabled: boolean): Promise<void> {
  const { error } = await (supabase as any)
    .from('autonomia_config')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('slug', slug)
  if (error) throw error
}

export async function fetchAutonomiaLogs(limit = 50): Promise<AutonomiaLog[]> {
  const { data, error } = await (supabase as any)
    .from('autonomia_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as AutonomiaLog[]
}

export async function isAutonomiaEnabled(slug: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from('autonomia_config')
    .select('enabled')
    .eq('slug', slug)
    .single()
  return data?.enabled ?? false
}

export async function logAutonomiaAction(
  action: string,
  details: Record<string, any>,
  result: string,
): Promise<void> {
  await (supabase as any).from('autonomia_log').insert({ action, details, result })
}
