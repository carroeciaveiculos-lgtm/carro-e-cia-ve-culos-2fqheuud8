// Comentários públicos nos posts da página (Facebook) e do perfil (Instagram) — 04/10/2026.
// Antes: o webhook só guardava o comentário na tabela social_comments e ninguém era avisado;
// 13 dos 40 comentários eram pedidos de preço ("Valor?"). Aqui: detectar interesse de compra, marcar
// o comentário (selo na aba Comentários) e avisar a Adriana por WhatsApp. NÃO cria lead: o CRM de
// leads da Clara é só de WhatsApp.

// Palavras que indicam interesse de compra. Lookarounds com \p{L} em vez de \b porque o \b do
// JavaScript não enxerga letra acentuada ("preço" quebraria).
const INTERESSE =
  /(?<![\p{L}\p{N}])(valor(es)?|pre[cç]o|quan[tyg]o|quero (um|uma|esse|essa|comprar|saber|ver)|compro|interess\p{L}*|troc\p{L}*|pix|financ\p{L}*|entrada|parcela\p{L}*|simula\p{L}*|aceita|ainda (tem|est[aá]|dispon\p{L}*)|dispon[ií]vel|whats\p{L}*|zap|contato|telefone|me chama|chama (no|pelo)|como (compro|fa[cç]o))(?![\p{L}\p{N}])/iu

export const comentarioDemonstraInteresse = (mensagem: string | null | undefined): boolean =>
  !!mensagem && INTERESSE.test(mensagem)

export type ComentarioSocial = {
  commentId: string
  postId: string
  fromId: string
  fromName: string
  message: string
  platform: 'facebook' | 'instagram'
}

// Facebook: field "feed", value.item = "comment". Instagram: field "comments", com outro formato
// (id, text, from.username, media.id). `autorId` = id da própria página/perfil (entry.id): os
// comentários que NÓS fazemos (respostas) voltam pelo mesmo webhook e não podem gerar aviso.
export function extrairComentario(
  platform: string,
  field: string,
  // deno-lint-ignore no-explicit-any
  value: any,
  autorId: string | undefined,
): ComentarioSocial | null {
  if (!value) return null
  let c: ComentarioSocial | null = null
  if (platform === 'instagram' && field === 'comments') {
    c = {
      commentId: String(value.id || ''),
      postId: String(value.media?.id || ''),
      fromId: String(value.from?.id || ''),
      fromName: String(value.from?.username || 'Instagram'),
      message: String(value.text || ''),
      platform: 'instagram',
    }
  } else if (platform === 'facebook' && field === 'feed') {
    if (value.item !== 'comment' || value.verb === 'remove') return null
    c = {
      commentId: String(value.comment_id || ''),
      postId: String(value.post_id || ''),
      fromId: String(value.from?.id || ''),
      fromName: String(value.from?.name || 'Facebook'),
      message: String(value.message || ''),
      platform: 'facebook',
    }
  }
  if (!c) return null
  if (autorId && c.fromId === String(autorId)) return null
  return c
}

// Envia um texto para a dona por WhatsApp (mesmo caminho do relatório diário). Nunca lança: falha de
// aviso não pode derrubar o webhook da Meta. Limite da Meta: texto livre só chega se a destinatária
// falou com este número nas últimas 24 h — o registro oficial é sempre o lead no CRM.
// deno-lint-ignore no-explicit-any
export async function enviarWhatsAppAoDono(supabase: any, corpo: string) {
  try {
    const token = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')
    const phoneId =
      Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')
    if (!token || !phoneId) return
    const { data: cfg } = await supabase
      .from('social_configuracoes')
      .select('whatsapp_number')
      .maybeSingle()
    const dono = String(cfg?.whatsapp_number || '5534999484285').replace(/\D/g, '')
    const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: dono,
        type: 'text',
        text: { body: corpo },
      }),
    })
    if (!r.ok) console.error('Aviso por WhatsApp recusado pela Meta:', r.status, await r.text())
  } catch (e) {
    console.error('Falha ao enviar aviso por WhatsApp:', e)
  }
}

// deno-lint-ignore no-explicit-any
export async function avisarComentarioInteressado(supabase: any, c: ComentarioSocial) {
  const rede = c.platform === 'instagram' ? 'Instagram' : 'Facebook'
  await enviarWhatsAppAoDono(
    supabase,
    `💬 Novo comentário com interesse no ${rede}
` +
      `${c.fromName}: "${c.message.slice(0, 200)}"

` +
      `Responda em Central de Redes Sociais > Comentários.`,
  )
}

// deno-lint-ignore no-explicit-any
export async function avisarMensagemDireta(
  supabase: any,
  rede: 'instagram' | 'facebook',
  nome: string,
  texto: string,
) {
  await enviarWhatsAppAoDono(
    supabase,
    `📩 Nova mensagem direta no ${rede === 'instagram' ? 'Instagram' : 'Messenger do Facebook'}
` +
      `${nome}: "${texto.slice(0, 250)}"

` +
      `Responda em Central de Redes Sociais > Mensagens.`,
  )
}
