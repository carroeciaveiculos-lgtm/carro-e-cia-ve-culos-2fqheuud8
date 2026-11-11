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
// Fonte: tabela oficial de erros do WhatsApp da Meta (conferida em 11/11/2026):
// https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes
// Só 131042 (pagamento) e 131047 (janela de 24 h) apareceram nos logs da loja até hoje; os
// demais seguem a documentação. O 131048 é listado pela Meta, mas há relato de que ela passou
// a usar o 131049 no lugar — por isso as duas frases existem.
const ERROS_META: Record<string, string> = {
  '131042':
    'Problema de pagamento na conta do WhatsApp Business. Confira a forma de pagamento na Meta.',
  '131047':
    'Passaram-se mais de 24 h desde a última mensagem do cliente. Só é possível enviar um modelo (template) aprovado.',
  '131026':
    'A mensagem não pôde ser entregue. O número pode não ter WhatsApp, ou o cliente pode estar com o app desatualizado ou sem aceitar os termos do WhatsApp.',
  '131049':
    'A Meta não entregou este modelo de divulgação para proteger o cliente. Aguarde pelo menos 24 h antes de reenviar.',
  '131048':
    'O número da loja tem restrição de envio, geralmente por muitas mensagens bloqueadas ou marcadas como spam. Confira a qualidade do número na Meta.',
  '130429': 'Muitos envios ao mesmo tempo. Tente novamente em alguns minutos.',
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
