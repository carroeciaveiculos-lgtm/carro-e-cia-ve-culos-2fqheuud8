import { supabase } from '@/lib/supabase/client'

export interface WMMarca {
  id: string
  nome_crm: string
  nome_wm: string | null
  codigo_wm: string | null
}

export interface WMModelo {
  id: string
  nome_crm: string
  nome_wm: string | null
  codigo_wm: string | null
  codigo_marca_wm: string | null
}

export interface WMCor {
  id: string
  nome_crm: string
  nome_wm: string | null
  codigo_wm: string | null
}

export async function fetchWMMarcas(): Promise<WMMarca[]> {
  const { data, error } = await supabase.from('wm_marcas').select('*').order('nome_crm')
  if (error) throw error
  return data || []
}

export async function fetchWMModelos(): Promise<WMModelo[]> {
  const { data, error } = await supabase.from('wm_modelos').select('*').order('nome_crm')
  if (error) throw error
  return data || []
}

export async function fetchWMCores(): Promise<WMCor[]> {
  const { data, error } = await supabase.from('wm_cores').select('*').order('nome_crm')
  if (error) throw error
  return data || []
}

export async function syncWMCatalogue(): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('wm-catalogue', {
    body: { action: 'sync_all' },
  })
  if (error) throw error
  return data
}
