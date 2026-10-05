// Mensagens diretas (direct do Instagram e Messenger do Facebook) — 04/10/2026.
// A Meta entrega DM em `entry[].messaging[]` (não em `changes`). Cada evento vira um registro simples
// para a Central de Mensagens (tabelas social_conversas / social_mensagens), SEPARADA do CRM de leads
// da Clara, que é só de WhatsApp.

export type MensagemDireta = {
  plataforma: 'instagram' | 'facebook'
  contatoId: string // IGSID (Instagram) ou PSID (Messenger): quem conversa com a loja
  direcao: 'entrada' | 'saida'
  origem: 'cliente' | 'equipe_app'
  texto: string
  mid: string | null
  quando: Date
}

const ROTULO_ANEXO: Record<string, string> = {
  image: 'foto',
  video: 'vídeo',
  audio: 'áudio',
  file: 'arquivo',
  share: 'publicação compartilhada',
  story_mention: 'menção no story',
  ig_reel: 'reel',
  reel: 'reel',
  sticker: 'figurinha',
}

// A Meta manda `timestamp` em milissegundos; se vier estranho, usa a hora atual.
const dataDoEvento = (ts: unknown): Date => {
  const n = Number(ts)
  if (Number.isFinite(n) && n > 1_500_000_000_000 && n < 4_000_000_000_000) return new Date(n)
  return new Date()
}

// Vira registro:
//  - mensagem RECEBIDA de cliente → direcao 'entrada';
//  - ECO (is_echo): resposta que a própria equipe digitou no app do Instagram/Facebook (ou que o
//    painel enviou pela API) → direcao 'saida', e o contato é o DESTINATÁRIO. Assim a conversa fica
//    completa na Central, e o eco das respostas do painel não duplica (a tabela deduplica por mid).
// Ficam de fora: leitura, entrega, reação, "digitando" (não têm `message`), mensagem apagada, mensagem
// vazia e mensagem cujo remetente e destinatário sejam a própria loja.
export function extrairMensagensDiretas(object: string, entry: any): MensagemDireta[] {
  if (object !== 'instagram' && object !== 'page') return []
  const plataforma = object === 'instagram' ? 'instagram' : 'facebook'
  const lojaId = entry?.id ? String(entry.id) : ''
  const saida: MensagemDireta[] = []

  for (const m of entry?.messaging || []) {
    const msg = m?.message
    if (!msg || msg.is_deleted) continue
    const remetente = m?.sender?.id ? String(m.sender.id) : ''
    const destinatario = m?.recipient?.id ? String(m.recipient.id) : ''
    const eco = !!msg.is_echo

    const contatoId = eco ? destinatario : remetente
    if (!contatoId || (lojaId && contatoId === lojaId)) continue

    let texto = typeof msg.text === 'string' ? msg.text.trim() : ''
    const anexos: any[] = Array.isArray(msg.attachments) ? msg.attachments : []
    if (!texto && anexos.length === 0) continue
    if (anexos.length > 0) {
      const tipos = anexos.map((a) => ROTULO_ANEXO[a?.type] || a?.type || 'anexo')
      texto = `${texto ? texto + ' ' : ''}[enviou: ${tipos.join(', ')}]`
    }
    // Resposta a um story: mostra que o cliente veio de lá
    if (msg.reply_to?.story) texto = `[Respondeu ao story] ${texto}`

    saida.push({
      plataforma,
      contatoId,
      direcao: eco ? 'saida' : 'entrada',
      origem: eco ? 'equipe_app' : 'cliente',
      texto,
      mid: msg.mid ? String(msg.mid) : null,
      quando: dataDoEvento(m.timestamp),
    })
  }
  return saida
}
