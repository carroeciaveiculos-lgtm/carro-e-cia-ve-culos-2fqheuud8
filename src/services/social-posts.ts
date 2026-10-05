import { supabase } from '@/lib/supabase/client'

// Ações sobre os posts da fila de redes sociais (tabela social_posts). Usadas pelas DUAS
// telas da Central Social — a tabela de "Publicações" e os cartões de "Aprovações" — pra
// elas nunca divergirem (04/10/2026, pedido da Adriana: botões Aprovar, Editar, Excluir e
// Publicar novamente em cada post).

export const MIN_FOTOS_CARROSSEL = 2

export const FORMATO_ROTULO: Record<string, string> = {
  feed_carrossel: 'Carrossel',
  feed_foto: 'Foto no feed',
  feed_video: 'Vídeo no feed',
  story_foto: 'Story (foto)',
  story_video: 'Story (vídeo)',
}

export type PostSocial = {
  id: string
  redes?: unknown
  rede?: string | null
  texto?: string | null
  imagem?: string | null
  midias?: unknown
  veiculo_id?: string | null
  content_type?: string | null
  formato?: string | null
  status?: string | null
  data_agendamento?: string | null
}

export type ResultadoAcao = { erro: string | null }

// Redes do post: linhas novas têm a coluna `rede`; as antigas guardam em `redes`, que pode
// ser lista (["facebook"]) ou objeto ({facebook:true}) conforme quem gravou. Ler lista como
// objeto (Object.keys) devolve "0", "1"... — era o defeito que escondia o ícone da rede.
export const redesDoPost = (post: PostSocial): string[] => {
  if (post.rede) return [post.rede]
  const r = post.redes
  if (Array.isArray(r)) return r.filter((x): x is string => typeof x === 'string')
  if (r && typeof r === 'object') {
    return Object.entries(r as Record<string, unknown>)
      .filter(([, ativo]) => !!ativo)
      .map(([nome]) => nome)
  }
  return []
}

// Fotos do post: o carrossel novo usa `midias`; os posts antigos, só `imagem`.
export const midiasDoPost = (post: PostSocial): string[] => {
  if (Array.isArray(post.midias) && post.midias.length > 0) {
    return post.midias.filter((x): x is string => typeof x === 'string')
  }
  return post.imagem ? [post.imagem] : []
}

// "2026-10-04T09:00" (horário local do navegador) <-> ISO (UTC) do banco
export const paraCampoData = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
export const doCampoData = (valor: string) => (valor ? new Date(valor).toISOString() : null)

// Aprovar e "tentar de novo" são a mesma operação: põe na fila de publicação e zera as
// tentativas (sem zerar, um carrossel que já falhou 3 vezes ganharia só 1 chance).
export async function agendarPost(id: string): Promise<ResultadoAcao> {
  const { error } = await supabase
    .from('social_posts')
    .update({ status: 'Agendado', erro_msg: null, tentativas: 0, publicando_em: null })
    .eq('id', id)
  return { erro: error?.message ?? null }
}

export async function excluirPost(id: string): Promise<ResultadoAcao> {
  const { error } = await supabase.from('social_posts').delete().eq('id', id)
  return { erro: error?.message ?? null }
}

// "Publicar novamente" um post já publicado = criar um post NOVO igual, na fila. O original
// fica como está. Entra como origem 'manual' (a trava contra repetição só vale para os
// automáticos) e vai direto pra fila de publicação.
export async function duplicarPostPublicado(post: PostSocial): Promise<ResultadoAcao> {
  const { error } = await supabase.from('social_posts').insert({
    redes: (post.redes ?? []) as never,
    texto: post.texto,
    imagem: post.imagem,
    midias: (post.midias ?? []) as never,
    veiculo_id: post.veiculo_id,
    content_type: post.content_type,
    formato: post.formato,
    rede: post.rede,
    origem: 'manual',
    status: 'Agendado',
    data_agendamento: new Date().toISOString(),
  })
  return { erro: error?.message ?? null }
}

export async function salvarEdicaoPost(
  post: PostSocial,
  edicao: { texto: string; dataLocal: string; midias: string[] },
): Promise<ResultadoAcao> {
  if (!edicao.texto.trim()) return { erro: 'O texto do post não pode ficar vazio' }
  const ehCarrossel = post.formato === 'feed_carrossel'
  if (ehCarrossel && edicao.midias.length < MIN_FOTOS_CARROSSEL) {
    return { erro: `O carrossel precisa de pelo menos ${MIN_FOTOS_CARROSSEL} fotos` }
  }
  const campos: { texto: string; data_agendamento?: string; midias?: string[]; imagem?: string } = {
    texto: edicao.texto,
  }
  const novaData = doCampoData(edicao.dataLocal)
  if (novaData) campos.data_agendamento = novaData
  // Só mexe nas fotos de carrossel (ou post que já tinha `midias`); post antigo de 1 imagem
  // não troca de foto por aqui.
  if (edicao.midias.length > 0 && (ehCarrossel || midiasDoPost(post).length > 1)) {
    campos.midias = edicao.midias
    campos.imagem = edicao.midias[0]
  }
  const { error } = await supabase.from('social_posts').update(campos).eq('id', post.id)
  return { erro: error?.message ?? null }
}
