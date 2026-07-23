import { supabase } from '@/lib/supabase/client'

export interface Notificacao {
  id: string
  usuario_id: string | null
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  created_at: string
}

export async function fetchUnreadNotifications(): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('lida', false)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return (data || []) as Notificacao[]
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await supabase.from('notificacoes').update({ lida: true }).eq('lida', false)
}
