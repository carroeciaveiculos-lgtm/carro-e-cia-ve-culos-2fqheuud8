import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  fetchUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notificacao,
} from '@/services/notificacoes'

const ICON_MAP: Record<string, string> = {
  quota_baixa: '⚠️',
  qualidade_baixa: '📉',
  performance_baixa: '🚨',
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notificacao[]>([])
  const unreadCount = notifications.length

  useEffect(() => {
    const loadNotifications = async () => {
      const data = await fetchUnreadNotifications()
      setNotifications(data)
    }
    loadNotifications()

    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload: any) => {
          setNotifications((prev) => [payload.new as Notificacao, ...prev].slice(0, 20))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificacoes' },
        (payload: any) => {
          if (payload.new.lida === true) {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.new.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications([])
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Agora mesmo'
    if (diffMin < 60) return `${diffMin} min atrás`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-white/80 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C62828] text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
          <h4 className="font-semibold text-sm text-[#0D47A1]">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-800"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 border-b text-sm hover:bg-muted/50 group relative">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{ICON_MAP[n.tipo] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1565C0] text-xs">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.mensagem}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatTime(n.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-green-600 shrink-0"
                    title="Marcar como lida"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
