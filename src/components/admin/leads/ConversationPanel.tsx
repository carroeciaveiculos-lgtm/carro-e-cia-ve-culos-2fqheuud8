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
  ImagePlus,
  Loader2,
  Pencil,
  RefreshCw,
  ArrowLeft,
  Plus,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { useAuth } from '@/hooks/use-auth'
import { usePermissoes } from '@/hooks/use-permissoes'
import { getOriginIcon } from '@/lib/lead-origin'
import { uploadToR2 } from '@/lib/r2-upload'
import { LeadFormModal } from '@/components/admin/leads/LeadFormModal'
import { rotuloVariavel } from '@/lib/whatsapp-templates-labels'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ConversationPanelProps {
  lead: any
  onBack?: () => void
  onLeadUpdated?: () => void
}

// Extraído de src/pages/admin/Leads.tsx (Fase 4 do plano "Clara ponta a
// ponta") pra ser reaproveitado também pela tela /admin/conversas, sem
// duplicar a lógica de chat.
export function ConversationPanel({ lead, onBack, onLeadUpdated }: ConversationPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { nivel, setorNomes } = usePermissoes()
  const podeCriarTemplate = nivel === 'admin_master' || setorNomes.includes('Marketing')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [conversation, setConversation] = useState<any[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateSelecionado, setTemplateSelecionado] = useState<any>(null)
  const [valoresVariaveis, setValoresVariaveis] = useState<Record<number, string>>({})
  const [enviandoTemplate, setEnviandoTemplate] = useState(false)
  const [criandoTemplate, setCriandoTemplate] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('UTILITY')
  const [novoCorpo, setNovoCorpo] = useState('')
  const [novosExemplos, setNovosExemplos] = useState<Record<number, string>>({})
  const [salvandoTemplate, setSalvandoTemplate] = useState(false)
  const [followupDate, setFollowupDate] = useState<Date | undefined>(new Date())
  const [enviandoImagem, setEnviandoImagem] = useState(false)

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
      setTemplateSelecionado(null)
      setValoresVariaveis({})
      setCriandoTemplate(false)
      setNovoNome('')
      setNovaCategoria('UTILITY')
      setNovoCorpo('')
      setNovosExemplos({})
      carregarTemplates()
    }
  }, [isTemplateModalOpen])

  const variaveisNovoTemplate = [...novoCorpo.matchAll(/\{\{(\d+)\}\}/g)]
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b)

  // Etapa 3 do plano de templates (15/09/2026) — envia direto pra
  // aprovação da Meta. Não é instantâneo: fica PENDING até a Meta revisar
  // (minutos a alguns dias), o status real só aparece depois de clicar
  // "Atualizar" na lista.
  const criarTemplate = async () => {
    const exemplosFaltando = variaveisNovoTemplate.some((v) => !novosExemplos[v]?.trim())
    if (exemplosFaltando) {
      toast({
        title: 'Preencha um exemplo pra cada variável',
        description: 'A Meta exige isso pra revisar o template.',
        variant: 'destructive',
      })
      return
    }
    setSalvandoTemplate(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-whatsapp-template', {
        body: {
          nome: novoNome.trim(),
          categoria: novaCategoria,
          corpo: novoCorpo.trim(),
          exemplos: variaveisNovoTemplate.map((v) => novosExemplos[v]),
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      toast({
        title: 'Enviado pra aprovação da Meta!',
        description:
          'Pode levar de minutos a alguns dias. Clique em "Atualizar" mais tarde pra ver o status.',
      })
      setCriandoTemplate(false)
    } catch (err: any) {
      toast({ title: 'Erro ao criar template', description: err.message, variant: 'destructive' })
    } finally {
      setSalvandoTemplate(false)
    }
  }

  // Só templates aprovados e em pt_BR — hello_world é o template de teste
  // padrão que toda conta nova do WhatsApp Business já vem com, sem uso
  // real (mostrar ele pro vendedor só confunde).
  const carregarTemplates = async () => {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('status', 'APPROVED')
      .neq('idioma', 'en_US')
      .order('nome')
    if (data) setTemplates(data)
  }

  // Etapa 1 do plano de templates (15/09/2026) — puxa da Meta o que foi
  // aprovado/rejeitado e atualiza a tabela antes de recarregar a lista.
  const atualizarTemplates = async () => {
    setLoadingTemplates(true)
    try {
      await supabase.functions.invoke('sync-whatsapp-templates')
      await carregarTemplates()
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar templates',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingTemplates(false)
    }
  }

  const abrirTemplate = (t: any) => {
    if (!t.variaveis || t.variaveis.length === 0) {
      enviarTemplate(t, {})
      return
    }
    setTemplateSelecionado(t)
    const iniciais: Record<number, string> = {}
    t.variaveis.forEach((v: number) => {
      iniciais[v] = rotuloVariavel(t.nome, v) === 'Nome do cliente' ? lead?.nome || '' : ''
    })
    setValoresVariaveis(iniciais)
  }

  // Manda como mensagem de template de verdade (action:'template'), não
  // como texto livre — funciona mesmo se o cliente não responde há mais de
  // 24h, diferente de mensagem de texto comum que a Meta recusa nesse caso.
  const enviarTemplate = async (t: any, valores: Record<number, string>) => {
    if (!lead?.telefone) {
      toast({ title: 'Lead sem telefone cadastrado', variant: 'destructive' })
      return
    }
    const cleanPhone = lead.telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast({ title: 'Número inválido', variant: 'destructive' })
      return
    }

    const variaveisOrdenadas = [...(t.variaveis || [])].sort((a, b) => a - b)
    const components =
      variaveisOrdenadas.length > 0
        ? [
            {
              type: 'body',
              parameters: variaveisOrdenadas.map((v) => ({
                type: 'text',
                text: valores[v] || '',
              })),
            },
          ]
        : []
    let textoFinal = t.corpo
    variaveisOrdenadas.forEach((v) => {
      textoFinal = textoFinal.replace(`{{${v}}}`, valores[v] || `{{${v}}}`)
    })

    setEnviandoTemplate(true)
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'template',
          to: cleanPhone,
          templateName: t.nome,
          components,
          text: textoFinal,
          leadId: lead.id,
        },
      })
      if (error) throw error
      toast({ title: 'Template enviado!' })
      setIsTemplateModalOpen(false)
      setTemplateSelecionado(null)
    } catch (err: any) {
      toast({ title: 'Erro ao enviar template', description: err.message, variant: 'destructive' })
    } finally {
      setEnviandoTemplate(false)
    }
  }

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

  // Achado 23/08/2026 (a pedido da Adriana): o painel nunca teve como o
  // atendente mandar uma foto pro cliente — send-whatsapp já sabia mandar
  // imagem (a Clara usa isso pra fotos de veículo), só faltava essa UI.
  const enviarImagem = async (file: File) => {
    if (!lead?.telefone) {
      toast({ title: 'Lead sem telefone cadastrado', variant: 'destructive' })
      return
    }
    const cleanPhone = lead.telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast({ title: 'Número inválido', variant: 'destructive' })
      return
    }
    setEnviandoImagem(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
      // Bucket 'media' (padrão de uploadToR2) — get-r2-presigned-url só
      // aceita uma lista fechada de buckets, sem 'leads-anexos' nela.
      const { publicUrl } = await uploadToR2(file, fileName, file.type, 'media')

      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'image',
          to: cleanPhone,
          documentUrl: publicUrl,
          text: '',
          leadId: lead.id,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast({ title: 'Erro ao enviar imagem', description: err.message, variant: 'destructive' })
    } finally {
      setEnviandoImagem(false)
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
          <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Editar
          </Button>
        </div>
      </div>

      <LeadFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        lead={lead}
        onSuccess={() => onLeadUpdated?.()}
      />

      <ScrollArea className="flex-1 p-4 bg-[#E5DDD5]/20">
        <div className="max-w-3xl mx-auto space-y-4">
          {conversation.map((msg, idx) => {
            const isInternal = msg.sender === 'internal_note'
            const isBot = msg.sender === 'bot'
            const isAudio = msg.message_text.includes('[AUDIO]')
            const textClean = msg.message_text.replace('[AUDIO]', '').trim()
            // Imagem recebida do cliente (achado 23/08/2026 — antes sumia
            // em silêncio, corrigido em receive-leads). Formato:
            // "[IMAGEM]<url>" + legenda opcional numa linha depois.
            const isImage = msg.message_text.startsWith('[IMAGEM]')
            const imageUrl = isImage ? msg.message_text.slice('[IMAGEM]'.length).split('\n')[0] : ''
            const imageCaption = isImage
              ? msg.message_text.slice('[IMAGEM]'.length + imageUrl.length).trim()
              : ''

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
                ) : isImage ? (
                  <div className="flex flex-col gap-2">
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={imageUrl}
                        alt="Imagem enviada pelo cliente"
                        className="max-w-[220px] max-h-[220px] rounded-lg border object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                    {imageCaption && (
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{imageCaption}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{msg.message_text}</p>
                )}
                <div className="flex justify-end items-center mt-1 gap-4">
                  <span className="text-[10px] text-slate-400 text-right shrink-0">
                    {new Date(msg.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}{' '}
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
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
              <Calendar
                mode="single"
                selected={followupDate}
                onSelect={setFollowupDate}
                initialFocus
              />
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            title="Enviar imagem"
            disabled={enviandoImagem}
            onClick={() => document.getElementById('conversation-panel-image-input')?.click()}
          >
            {enviandoImagem ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
          </Button>
          <input
            id="conversation-panel-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) enviarImagem(file)
              e.target.value = ''
            }}
          />
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
            className={
              isInternalNote ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pr-6">
              <span className="flex items-center gap-2">
                {(templateSelecionado || criandoTemplate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setTemplateSelecionado(null)
                      setCriandoTemplate(false)
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                {templateSelecionado
                  ? templateSelecionado.nome
                  : criandoTemplate
                    ? 'Novo Template'
                    : 'Templates aprovados (Meta)'}
              </span>
              {!templateSelecionado && !criandoTemplate && (
                <div className="flex items-center gap-1">
                  {podeCriarTemplate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setCriandoTemplate(true)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Novo
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={loadingTemplates}
                    onClick={atualizarTemplates}
                  >
                    {loadingTemplates ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Atualizar
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {criandoTemplate ? (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">
                  Nome (sem espaço, ex: aviso_promocao)
                </Label>
                <Input
                  value={novoNome}
                  onChange={(e) =>
                    setNovoNome(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
                  }
                  placeholder="aviso_promocao"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Categoria</Label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTILITY">Utility (atualização/atendimento)</SelectItem>
                    <SelectItem value="MARKETING">Marketing (promocional)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 mt-1">
                  <strong>Utility</strong>: confirmação, lembrete, retorno de algo que o cliente já
                  pediu — mais barato, revisão mais rápida. <strong>Marketing</strong>:
                  oferta/promoção — cobra mais e a Meta é mais rígida na revisão. Escolha errado
                  pode gerar custo indevido ou até restrição da conta.
                </p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">
                  Corpo da mensagem (use {'{{1}}'}, {'{{2}}'}... pra parte que muda por cliente)
                </Label>
                <Textarea
                  value={novoCorpo}
                  onChange={(e) => setNovoCorpo(e.target.value)}
                  rows={4}
                  placeholder="Oi {{1}}! ..."
                />
              </div>
              {variaveisNovoTemplate.map((v) => (
                <div key={v}>
                  <Label className="text-xs text-slate-500 mb-1 block">
                    Exemplo de preenchimento pra {'{{' + v + '}}'}
                  </Label>
                  <Input
                    value={novosExemplos[v] || ''}
                    onChange={(e) => setNovosExemplos((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder="Ex: João"
                  />
                </div>
              ))}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={salvandoTemplate || !novoNome.trim() || !novoCorpo.trim()}
                onClick={criarTemplate}
              >
                {salvandoTemplate ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar pra Aprovação da Meta
              </Button>
            </div>
          ) : templateSelecionado ? (
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border">
                {templateSelecionado.corpo}
              </p>
              {(templateSelecionado.variaveis as number[]).map((v) => (
                <div key={v}>
                  <Label className="text-xs text-slate-500 mb-1 block">
                    {rotuloVariavel(templateSelecionado.nome, v)}
                  </Label>
                  <Input
                    value={valoresVariaveis[v] || ''}
                    onChange={(e) =>
                      setValoresVariaveis((prev) => ({ ...prev, [v]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={enviandoTemplate}
                onClick={() => enviarTemplate(templateSelecionado, valoresVariaveis)}
              >
                {enviandoTemplate ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {templates.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhum template aprovado ainda. Clique em "Atualizar" pra conferir com a Meta.
                </p>
              )}
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="border p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => abrirTemplate(t)}
                >
                  <p className="font-bold text-sm">{t.nome}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.corpo}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
