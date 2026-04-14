import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const unreadCount = notifications.length

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) {
        setNotifications(
          data.map((lead) => ({
            id: lead.id,
            text: `Novo lead: ${lead.nome}`,
            time: new Date(lead.created_at).toLocaleTimeString(),
          })),
        )
      }
    }
    fetchNotifications()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const lead = payload.new as any
        setNotifications((prev) =>
          [
            {
              id: lead.id,
              text: `Novo lead: ${lead.nome}`,
              time: 'Agora mesmo',
            },
            ...prev,
          ].slice(0, 10),
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-white/80 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C62828] text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="bg-muted px-4 py-2 border-b">
          <h4 className="font-semibold text-sm text-[#0D47A1]">Notificações</h4>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-4 border-b text-sm hover:bg-muted/50 cursor-pointer">
                <p className="font-medium text-[#1565C0]">{n.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
