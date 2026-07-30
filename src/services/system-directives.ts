import { supabase } from '@/lib/supabase/client'

export interface SystemDirective {
  id: string
  title: string
  content: string
  active: boolean
  created_at: string
  updated_at: string
}

export async function fetchDirectives(): Promise<SystemDirective[]> {
  const { data, error } = await (supabase as any)
    .from('system_directives')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []) as SystemDirective[]
}

export async function createDirective(
  title: string,
  content: string,
  active: boolean,
): Promise<SystemDirective> {
  const { data, error } = await (supabase as any)
    .from('system_directives')
    .insert({ title, content, active })
    .select()
    .single()
  if (error) throw error
  return data as SystemDirective
}

export async function updateDirective(
  id: string,
  updates: Partial<Pick<SystemDirective, 'title' | 'content' | 'active'>>,
): Promise<void> {
  const { error } = await (supabase as any)
    .from('system_directives')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteDirective(id: string): Promise<void> {
  const { error } = await (supabase as any).from('system_directives').delete().eq('id', id)
  if (error) throw error
}

export async function fetchActiveDirective(): Promise<SystemDirective | null> {
  const { data, error } = await (supabase as any)
    .from('system_directives')
    .select('*')
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data || null) as SystemDirective | null
}
