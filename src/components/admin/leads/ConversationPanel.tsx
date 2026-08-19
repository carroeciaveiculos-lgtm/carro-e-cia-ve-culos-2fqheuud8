import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  MessageCircle,
  Phone,
  Send,
  Kanban,
  FilePlus,
  Calendar as CalendarIcon,
  Target,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { useAuth } from '@/hooks/use-auth'
import { getOriginIcon } from '@/lib/lead-origin'

interface ConversationPanelProps {
  lead: any
  usuariosMap: Record<string, string>
  onBack?: () => void
}

// Extraído de src/pages/admin/Leads.tsx (Fase 4 do plano "Clara ponta a
// ponta") pra ser reaproveitado também pela tela /admin/conversas, sem
// duplicar a lógica de chat.
export function ConversationPanel({ lead, usuariosMap, onBack }: ConversationPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [message, setMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [conversation, setConversation] = useState<any[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [followupDate, setFollowupDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (lead?.id) {
      loadConversation(lead.id)
      marcarComoLida(lead.id)
    }
  }, [lead?.id])

  useEffect(() => {
    if (!lead?.id) return

    const messagesChannel = supabase
      .channel(`conversation-panel-${lead.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_history',
          filter: `lead_id=eq.${lead.id}`,
        },
        (payload) => {
          setConversation((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new],
          )
          marcarComoLida(lead.id)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [lead?.id])

  useEffect(() => {
    if (isTemplateModalOpen) {
      supabase
        .from('whatsapp_templates')
        .select('*')
        .then(({ data }) => {
          if (data) setTemplates(data)
        })
    }
  }, [isTemplateModalOpen])

  const loadConversation = async (leadId: string) => {
    const { data } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (data) setConversation(data)
  }

  // Indicador de não lida (Fase 4, item 3 do plano): grava quando um humano
  // abriu essa conversa, pra comparar depois com a mensagem mais recente.
  const marcarComoLida = async (leadId: string) => {
    await supabase
      .from('leads')
      .update({ ultima_leitura_humana: new Date().toISOString() })
      .eq('id', leadId)
  }

  const sendMessage = async () => {
    if (!message.trim() || !lead) return
    try {
      if (isInternalNote) {
        await supabase
          .from('conversation_history')
          .insert([{ lead_id: lead.id, sender: 'internal_note', message_text: message }])
        setMessage('')
        setIsInternalNote(false)
        return
      }

      if (lead.telefone) {
        const cleanPhone = lead.telefone.replace(/\D/g, '')
        if (cleanPhone.length < 10) {
          toast({ title: 'Número inválido', variant: 'destructive' })
          return
        }
        await supabase.functions.invoke('send-whatsapp', {
          body: { action: 'text', to: cleanPhone, text: message, leadId: lead.id },
        })
      } else {
        await supabase
          .from('conversation_history')
          .insert([{ lead_id: lead.id, sender: 'human', message_text: message }])
      }
      setMessage('')
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    }
  }

  const scheduleFollowup = async () => {
    if (!lead || !followupDate) return
    await supabase.from('followups').insert({
      lead_id: lead.id,
      data_agendada: followupDate.toISOString(),
      responsavel_id: user?.id,
      lembrete: 'Retorno de contato programado',
    })
    toast({ title: 'Follow-up agendado com sucesso!' })
  }

  if (!lead) {
    return (
      <div className="flex-1 min-w-[400px] flex items-center justify-center text-slate-400 bg-slate-50/50 h-full">
        <Target className="w-12 h-12 opacity-20 mr-2" /> Selecione uma conversa
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-[400px] flex flex-col bg-white h-full relative">
      <div
        className={cn(
          'px-4 py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm shrink-0',
          lead.origem?.toLowerCase() === 'whatsapp' || lead.source?.toLowerCase() === 'whatsapp'
            ? 'bg-[#25D366]'
            : lead.origem?.toLowerCase() === 'instagram' ||
                lead.source?.toLowerCase() === 'instagram'
              ? 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040]'
              : 'bg-blue-600',
        )}
      >
        {getOriginIcon(lead.origem || lead.source)}
        Origem: {(lead.origem || lead.source || 'Site').toUpperCase()}
      </div>
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          {lead.anuncio_thumbnail_url ? (
            // Imagem do criativo do anúncio (Meta CTWA) — pra saber de
            // relance qual anúncio o cliente clicou, sem precisar sair do
            // Conversador. Achado 19/08/2026: a Meta sempre mandou isso,
            // nunca era guardado.
            <a
              href={lead.anuncio_video_url || undefined}
              target={lead.anuncio_video_url ? '_blank' : undefined}
              rel="noreferrer"
              title={lead.anuncio_video_url ? 'Ver anúncio no Facebook' : 'Imagem do anúncio'}
              className="shrink-0"
            >
              <img
                src={lead.anuncio_thumbnail_url}
                alt="Anúncio que o cliente clicou"
                className="h-10 w-10 rounded-md object-cover border hover:opacity-80 transition-opacity"
              />
            </a>
          ) : (
            <Avatar className="h-10 w-10 border">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                {lead.nome?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">{lead.nome}</h3>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Phone className="w-3 h-3" /> {lead.telefone || 'Sem telefone'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <Button size="sm" variant="outline" className="text-slate-600" onClick={onBack}>
              <Kanban className="w-4 h-4 mr-2" /> Voltar ao Board
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50"
            onClick={() =>
              lead.telefone && window.open(getWhatsAppLink('Olá!', lead.telefone), '_blank')
            }
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-[#E5DDD5]/20">
        <div className="max-w-3xl mx-auto space-y-4">
          {conversation.map((msg, idx) => {
            const isInternal = msg.sender === 'internal_note'
            const isBot = msg.sender === 'bot'
            const isHuman = msg.sender === 'human'
            const isAudio = msg.message_text.includes('[AUDIO]')
            const textClean = msg.message_text.replace('[AUDIO]', '').trim()

            return (
              <div
                key={idx}
                className={cn(
                  'max-w-[85%] p-3 shadow-sm border border-slate-200 flex flex-col',
                  isInternal
                    ? 'self-center bg-yellow-50 rounded-2xl w-[90%] border-yellow-200'
                    : isBot
                      ? 'self-start bg-blue-50 rounded-2xl rounded-tl-none border-blue-200'
                      : msg.sender === 'client'
                        ? 'self-start bg-white rounded-2xl rounded-tl-none'
                        : 'self-end bg-green-50 rounded-2xl rounded-tr-none border-green-200',
                )}
              >
                {isInternal && (
                  <p className="text-[10px] text-yellow-700 font-bold mb-1">
                    📝 Nota Interna da Equipe
                  </p>
                )}
                {isAudio ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border w-48">
                      <MessageCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-600 font-medium">Áudio</span>
                    </div>
                    <p className="text-xs text-slate-500 italic border-l-2 border-slate-300 pl-2">
                      Transcrição (IA): {textClean || 'Áudio processado.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{msg.message_text}</p>
                )}
                <div className="flex justify-between items-center mt-1 gap-4">
                  <span className="text-[9px] text-slate-400 font-medium">
                    {isBot
                      ? 'Respondido por Clara (IA)'
                      : isHuman
                        ? `Feito por ${usuariosMap[user?.id || ''] || 'Atendente'}`
                        : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 text-right shrink-0">
                    {new Date(msg.created_at).toLocaleString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div
        className={cn(
          'p-3 border-t flex flex-col gap-2 shrink-0 transition-colors',
          isInternalNote ? 'bg-yellow-50' : 'bg-white',
        )}
      >
        <div className="flex items-center gap-2 mb-1 px-1">
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-2 py-1">
            <Switch
              checked={isInternalNote}
              onCheckedChange={setIsInternalNote}
              className="data-[state=checked]:bg-yellow-500 scale-75"
              id="nota-interna-switch"
            />
            <Label
              htmlFor="nota-interna-switch"
              className="text-xs text-slate-600 font-semibold cursor-pointer select-none"
            >
              Nota Interna
            </Label>
          </div>
          <div className="flex-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                title="Agendar Follow-up"
              >
                <CalendarIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={followupDate} onSelect={setFollowupDate} initialFocus />
              <div className="p-2 border-t">
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={scheduleFollowup}
                >
                  Agendar Retorno
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            title="Templates"
            onClick={() => setIsTemplateModalOpen(true)}
          >
            <FilePlus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isInternalNote
                ? 'Digite uma nota invisível para o cliente...'
                : 'Digite uma mensagem...'
            }
            className={cn(
              'flex-1',
              isInternalNote ? 'bg-yellow-100/50 border-yellow-300' : 'bg-slate-50',
            )}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button
            onClick={sendMessage}
            className={isInternalNote ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selecionar Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {templates.map((t) => (
              <div
                key={t.id}
                className="border p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => {
                  setMessage(t.corpo)
                  setIsTemplateModalOpen(false)
                }}
              >
                <p className="font-bold text-sm">{t.nome}</p>
                <p className="text-xs text-slate-500 mt-1">{t.corpo}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
