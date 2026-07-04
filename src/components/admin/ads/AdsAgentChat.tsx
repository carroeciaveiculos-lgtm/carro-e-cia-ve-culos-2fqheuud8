import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, AlertTriangle, Check, X } from 'lucide-react'
import { chatWithAgent, executeAction, type ProposedAction } from '@/services/ads-manager'
import { useToast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'agent'
  content: string
  proposedAction?: ProposedAction
  actionResult?: string
}

export function AdsAgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content:
        'Olá! Sou seu agente de anúncios IA. Posso listar campanhas, ajustar orçamentos e gerenciar status no Google e Meta Ads. Como posso ajudar?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)
    try {
      const proposed = await chatWithAgent(userMsg)
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: proposed.description, proposedAction: proposed },
      ])
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'agent', content: `Erro: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (msgIndex: number) => {
    const msg = messages[msgIndex]
    if (!msg.proposedAction) return
    setLoading(true)
    try {
      await executeAction(msg.proposedAction)
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex ? { ...m, actionResult: 'Ação executada com sucesso!' } : m,
        ),
      )
      toast({ title: 'Sucesso', description: 'Ação executada com sucesso!' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = (msgIndex: number) => {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIndex ? { ...m, actionResult: 'Ação cancelada pelo usuário.' } : m,
      ),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" /> Assistente de Anúncios IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="h-[400px] overflow-y-auto space-y-4 mb-4 p-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'agent' && <Bot className="w-8 h-8 text-blue-600 shrink-0" />}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
              >
                <p className="text-sm">{msg.content}</p>
                {msg.proposedAction && !msg.actionResult && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">
                        Confirmação Necessária
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      Plataforma: {msg.proposedAction.platform} | Ação: {msg.proposedAction.action}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleConfirm(i)} disabled={loading}>
                        <Check className="w-3 h-3 mr-1" /> Confirmar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCancel(i)}>
                        <X className="w-3 h-3 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                {msg.actionResult && (
                  <p className="text-xs mt-2 italic opacity-70">{msg.actionResult}</p>
                )}
              </div>
              {msg.role === 'user' && <User className="w-8 h-8 text-slate-400 shrink-0" />}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua instrução... (ex: 'Pausar campanhas de retargeting no Google')"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
