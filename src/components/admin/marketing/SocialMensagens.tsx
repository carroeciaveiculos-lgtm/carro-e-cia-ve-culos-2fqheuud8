import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCheck,
  Clock,
  Facebook,
  Instagram,
  Loader2,
  RotateCcw,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  type Conversa,
  type Mensagem,
  definirStatusConversa,
  enviarResposta,
  listarConversas,
  listarMensagens,
  marcarComoLida,
  msRestantesParaResponder,
  nomeDaConversa,
} from '@/services/social-inbox'

// Aba "Mensagens" da Central de Redes Sociais (04/10/2026): direct do Instagram e Messenger do
// Facebook. Fica FORA do CRM de leads da Clara (que é só de WhatsApp). Responder só é possível até 24 h
// depois da última mensagem do cliente (regra da Meta); depois disso, só pelo app da rede.

const POLL_MS = 20_000

const horaCurta = (iso: string) => {
  const d = new Date(iso)
  const hoje = new Date()
  const mesmoDia = d.toDateString() === hoje.toDateString()
  return mesmoDia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const textoRestante = (ms: number) => {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

const IconeRede = ({ plataforma }: { plataforma: Conversa['plataforma'] }) =>
  plataforma === 'instagram' ? (
    <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
  ) : (
    <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
  )

export function SocialMensagens({ aoMudarNaoLidas }: { aoMudarNaoLidas?: () => void }) {
  const { toast } = useToast()
  const [filtro, setFiltro] = useState<'aberta' | 'resolvida' | 'todas'>('aberta')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [agora, setAgora] = useState(Date.now())
  const fimRef = useRef<HTMLDivElement>(null)

  const selecionada = conversas.find((c) => c.id === selecionadaId) ?? null

  const carregarConversas = useCallback(async () => {
    const { data, error } = await listarConversas(filtro)
    if (!error) setConversas(data)
    setCarregando(false)
  }, [filtro])

  const carregarMensagens = useCallback(async (id: string) => {
    const { data, error } = await listarMensagens(id)
    if (!error) setMensagens(data)
  }, [])

  useEffect(() => {
    setCarregando(true)
    carregarConversas()
    const t = setInterval(() => {
      carregarConversas()
      setAgora(Date.now())
    }, POLL_MS)
    return () => clearInterval(t)
  }, [carregarConversas])

  // Abrir uma conversa: carrega o histórico e zera as não lidas
  useEffect(() => {
    if (!selecionadaId) return
    setMensagens([])
    carregarMensagens(selecionadaId)
    marcarComoLida(selecionadaId).then(() => {
      setConversas((prev) => prev.map((c) => (c.id === selecionadaId ? { ...c, nao_lidas: 0 } : c)))
      aoMudarNaoLidas?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionadaId, carregarMensagens])

  // Mensagem nova chegando na conversa aberta
  useEffect(() => {
    if (!selecionadaId) return
    const t = setInterval(() => carregarMensagens(selecionadaId), POLL_MS)
    return () => clearInterval(t)
  }, [selecionadaId, carregarMensagens])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens.length, selecionadaId])

  const restante = selecionada ? msRestantesParaResponder(selecionada, agora) : 0
  const podeResponder = restante > 0

  const enviar = async () => {
    if (!selecionada || !texto.trim() || enviando) return
    setEnviando(true)
    const { erro } = await enviarResposta(selecionada.id, texto.trim())
    setEnviando(false)
    if (erro) {
      toast({ title: 'Mensagem não enviada', description: erro, variant: 'destructive' })
      return
    }
    setTexto('')
    toast({ title: 'Mensagem enviada' })
    carregarMensagens(selecionada.id)
    carregarConversas()
  }

  const alternarStatus = async () => {
    if (!selecionada) return
    const novo = selecionada.status === 'aberta' ? 'resolvida' : 'aberta'
    const { error } = await definirStatusConversa(selecionada.id, novo)
    if (error) {
      toast({ title: 'Não foi possível atualizar a conversa', variant: 'destructive' })
      return
    }
    toast({ title: novo === 'resolvida' ? 'Conversa marcada como resolvida' : 'Conversa reaberta' })
    if (filtro !== 'todas') setSelecionadaId(null)
    carregarConversas()
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[560px] h-[calc(100vh-260px)]">
      {/* Lista de conversas */}
      <div className={cn('border-r flex flex-col min-h-0', selecionada && 'hidden md:flex')}>
        <div className="p-2 border-b flex gap-1 shrink-0">
          {(
            [
              ['aberta', 'Abertas'],
              ['resolvida', 'Resolvidas'],
              ['todas', 'Todas'],
            ] as const
          ).map(([valor, rotulo]) => (
            <Button
              key={valor}
              size="sm"
              variant={filtro === valor ? 'default' : 'ghost'}
              className="h-8 flex-1 text-xs"
              onClick={() => setFiltro(valor)}
            >
              {rotulo}
            </Button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {carregando && (
            <p className="p-6 text-center text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Carregando...
            </p>
          )}
          {!carregando && conversas.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              Nenhuma conversa{' '}
              {filtro === 'aberta' ? 'aberta' : filtro === 'resolvida' ? 'resolvida' : ''} por
              enquanto.
            </p>
          )}
          {conversas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelecionadaId(c.id)}
              className={cn(
                'w-full text-left px-3 py-3 border-b hover:bg-slate-50 flex gap-2',
                c.id === selecionadaId && 'bg-blue-50',
              )}
            >
              <IconeRede plataforma={c.plataforma} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'text-sm truncate',
                      c.nao_lidas > 0 ? 'font-bold' : 'font-medium',
                    )}
                  >
                    {nomeDaConversa(c)}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {horaCurta(c.ultima_mensagem_em)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 truncate">{c.ultima_mensagem}</span>
                  {c.nao_lidas > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 justify-center bg-red-600">
                      {c.nao_lidas}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversa aberta */}
      <div className={cn('flex flex-col min-h-0', !selecionada && 'hidden md:flex')}>
        {!selecionada ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 p-6 text-center">
            Escolha uma conversa à esquerda para ver as mensagens e responder.
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center gap-2 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden h-8 w-8"
                onClick={() => setSelecionadaId(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <IconeRede plataforma={selecionada.plataforma} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{nomeDaConversa(selecionada)}</p>
                <p className="text-[11px] text-slate-500">
                  {selecionada.plataforma === 'instagram'
                    ? 'Direct do Instagram'
                    : 'Messenger do Facebook'}
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={alternarStatus}>
                {selecionada.status === 'aberta' ? (
                  <>
                    <CheckCheck className="w-3 h-3 mr-1" /> Resolvida
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3 mr-1" /> Reabrir
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {mensagens.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex', m.direcao === 'saida' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm',
                      m.direcao === 'saida'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border text-slate-800',
                    )}
                  >
                    {m.texto}
                    <div
                      className={cn(
                        'text-[10px] mt-1 text-right',
                        m.direcao === 'saida' ? 'text-blue-100' : 'text-slate-400',
                      )}
                    >
                      {m.direcao === 'saida' && m.origem === 'equipe_app' ? 'pelo app · ' : ''}
                      {new Date(m.criado_em).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={fimRef} />
            </div>

            <div className="p-3 border-t shrink-0 space-y-2">
              {podeResponder ? (
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Você pode responder por aqui por mais{' '}
                  {textoRestante(restante)} (limite de 24 h da Meta).
                </p>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  Passaram mais de 24 horas desde a última mensagem do cliente: a Meta não permite
                  responder por aqui. Responda pelo app do{' '}
                  {selecionada.plataforma === 'instagram' ? 'Instagram' : 'Facebook'}.
                </p>
              )}
              <div className="flex gap-2 items-end">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={
                    podeResponder ? 'Escreva a resposta...' : 'Fora da janela de 24 horas'
                  }
                  disabled={!podeResponder || enviando}
                  rows={2}
                  maxLength={1000}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar()
                  }}
                />
                <Button onClick={enviar} disabled={!podeResponder || enviando || !texto.trim()}>
                  {enviando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
