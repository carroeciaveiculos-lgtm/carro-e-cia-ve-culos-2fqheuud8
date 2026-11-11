// Status de entrega das mensagens enviadas pelo WhatsApp (Conversador).
// Vem do webhook da Meta (receive-leads) e é gravado em conversation_history.status_envio.

export type StatusEnvio = 'enviado' | 'entregue' | 'lido' | 'falhou'

export const ROTULO_STATUS: Record<StatusEnvio, string> = {
  enviado: 'Enviado (aceito pelo WhatsApp, ainda sem confirmação de entrega)',
  entregue: 'Entregue no celular do cliente',
  lido: 'Lido pelo cliente',
  falhou: 'Não entregue',
}

// Códigos de erro da Meta -> frase que a equipe entende (em português, sem jargão).
// Códigos que já apareceram nos logs da loja: 131042 (pagamento pendente na conta do WhatsApp
// Business) e 131047 (mensagem fora da janela de 24 h sem template).
// Outros comuns: 131026 (número sem WhatsApp ou mensagem não entregável), 131049 (a Meta
// decidiu não entregar uma mensagem de marketing), 131048 (limite por suspeita de spam),
// 130429 (limite de envios por segundo).
const ERROS_META: Record<string, string> = {
  // TODO(human): escreva aqui, em linguagem simples, a frase de cada código acima.
  // Exemplo do formato:  '131042': 'Pagamento pendente na conta do WhatsApp Business (Meta).',
}

/** Frase para mostrar no balão quando a mensagem falhou. */
export function explicarFalhaWhatsApp(codigo?: string | null, textoOriginal?: string | null) {
  if (codigo && ERROS_META[codigo]) return ERROS_META[codigo]
  if (codigo) return `Falha no envio (código ${codigo} da Meta).`
  return textoOriginal ? `Falha no envio: ${textoOriginal}` : 'Falha no envio.'
}

/** Assinatura usada para só redesenhar o chat quando algo mudou de verdade. */
export function assinaturaConversa(linhas: Array<Record<string, any>>) {
  return linhas.map((m) => `${m.id}:${m.status_envio ?? ''}:${m.reacao ?? ''}`).join('|')
}
