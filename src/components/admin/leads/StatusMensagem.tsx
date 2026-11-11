import { AlertTriangle, Check, CheckCheck } from 'lucide-react'
import { ROTULO_STATUS, explicarFalhaWhatsApp, type StatusEnvio } from '@/lib/whatsapp-status'

interface Props {
  msg: {
    status_envio?: StatusEnvio | null
    erro_codigo?: string | null
    erro_texto?: string | null
    reacao?: string | null
  }
}

// Mensagens antigas (anteriores ao rastreio) não têm status: nada é mostrado, de propósito,
// para não afirmar "entregue" sem ter confirmação.
export function AvisoFalhaMensagem({ msg }: Props) {
  if (msg.status_envio !== 'falhou') return null
  return (
    <p className="mt-1 flex items-start gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        <strong>Não entregue.</strong> {explicarFalhaWhatsApp(msg.erro_codigo, msg.erro_texto)}
      </span>
    </p>
  )
}

export function ReacaoMensagem({ msg }: Props) {
  if (!msg.reacao) return null
  return (
    <span
      className="mt-1 self-start rounded-full border bg-white px-2 py-0.5 text-sm shadow-sm"
      title="Reação do cliente a esta mensagem"
    >
      {msg.reacao}
    </span>
  )
}

export function IconeStatusMensagem({ msg }: Props) {
  const status = msg.status_envio
  if (!status) return null
  const titulo = ROTULO_STATUS[status]
  if (status === 'falhou') {
    return <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-label={titulo} />
  }
  if (status === 'enviado') {
    return <Check className="h-3.5 w-3.5 text-slate-400" aria-label={titulo} />
  }
  return (
    <CheckCheck
      className={status === 'lido' ? 'h-3.5 w-3.5 text-sky-500' : 'h-3.5 w-3.5 text-slate-400'}
      aria-label={titulo}
    />
  )
}
