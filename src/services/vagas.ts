import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { stripHtml } from '@/lib/utils'
import { parseMarkdown } from '@/lib/markdown'

export type Vaga = Database['public']['Tables']['vagas']['Row']
export type VagaInsert = Database['public']['Tables']['vagas']['Insert']
export type VagaUpdate = Database['public']['Tables']['vagas']['Update']

// Limite real do Instagram pra legenda (2200 caracteres) — é o mais apertado
// entre Facebook/Instagram, então usar ele como teto garante que o post
// funciona nas duas redes (achado 23/08/2026: a vaga de SDR tinha uma
// descrição de +3000 caracteres, que quebraria a publicação no Instagram
// se fosse mandada direto, sem resumo).
export const LIMITE_CARACTERES_RESUMO_REDES = 2200

export const slugifyTitulo = (titulo: string) =>
  titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const listVagasAtivas = async () => {
  const { data, error } = await supabase
    .from('vagas')
    .select('id, titulo, slug')
    .eq('ativa', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const listVagas = async () => {
  const { data, error } = await supabase
    .from('vagas')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

// Aceita id (uuid) ou slug — mesmo padrão já usado em /estoque/:id pros
// veículos, pra permitir link bonito (/vagas/vendedor-de-veiculos) e ainda
// funcionar com o id puro se precisar.
export const getVagaPorIdOuSlug = async (idOuSlug: string) => {
  const pareceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOuSlug,
  )
  const query = supabase.from('vagas').select('*')
  const { data, error } = pareceUuid
    ? await query.eq('id', idOuSlug).maybeSingle()
    : await query.eq('slug', idOuSlug).maybeSingle()
  return { data, error }
}

export const createVaga = async (vaga: VagaInsert) => {
  const slug = vaga.titulo ? await gerarSlugUnico(vaga.titulo) : null
  const { data, error } = await supabase
    .from('vagas')
    .insert({ ...vaga, slug })
    .select()
    .single()
  return { data, error }
}

export const updateVaga = async (id: string, vaga: VagaUpdate) => {
  const payload = { ...vaga, updated_at: new Date().toISOString() }
  if (vaga.titulo) payload.slug = await gerarSlugUnico(vaga.titulo, id)
  const { data, error } = await supabase
    .from('vagas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Garante slug único: se já existir (outra vaga com título parecido), acrescenta
// um sufixo numérico (-2, -3...) até achar um livre.
async function gerarSlugUnico(titulo: string, idAtual?: string): Promise<string> {
  const base = slugifyTitulo(titulo)
  let candidato = base
  let contador = 2
  for (;;) {
    let query = supabase.from('vagas').select('id').eq('slug', candidato)
    if (idAtual) query = query.neq('id', idAtual)
    const { data } = await query.maybeSingle()
    if (!data) return candidato
    candidato = `${base}-${contador}`
    contador += 1
  }
}

export const deleteVaga = async (id: string) => {
  const { error } = await supabase.from('vagas').delete().eq('id', id)
  return { error }
}

export const gerarVagaComIA = async (cargo: string, palavrasChave?: string) => {
  const { data, error } = await supabase.functions.invoke('gerar-vaga-ia', {
    body: { cargo, palavrasChave },
  })
  if (error) return { data: null, error }
  return { data: data?.data as { titulo: string; descricao: string }, error: null }
}

// Sempre retorna 2 opções (padrão único de imagem, achado 23/08/2026) pra
// escolher qual fica — nenhuma é salva na vaga até ela clicar em uma.
export const gerarImagemVaga = async (
  titulo: string,
  opts?: { ajuste?: string; imagemAtualUrl?: string },
) => {
  const { data, error } = await supabase.functions.invoke('gerar-imagem-vaga', {
    body: { titulo, ajuste: opts?.ajuste, imagemAtualUrl: opts?.imagemAtualUrl },
  })
  if (error) return { data: null, error }
  return { data: (data?.urls as string[]) || [], error: null }
}

// Resumo curto pra redes sociais, gerado por IA a partir da descrição
// completa (achado 23/08/2026: descrições longas — a de SDR tem +3000
// caracteres — quebram a publicação no Instagram, que corta em 2200). O
// texto vem sempre em texto puro (sem markdown), mesmo se a descrição
// usar o editor de formatação (achado 24/08/2026: descrição virou
// markdown, não HTML, depois da reescrita do editor).
export const gerarResumoVaga = async (titulo: string, descricaoMarkdown: string) => {
  const { data, error } = await supabase.functions.invoke('gerar-resumo-vaga', {
    body: { titulo, descricao: stripHtml(parseMarkdown(descricaoMarkdown)) },
  })
  if (error) return { data: null, error }
  return { data: (data?.resumo as string) || '', error: null }
}

// Cria um post agendado pro agora, reaproveitando a mesma fila que o resto do
// site já usa pra publicar no Facebook/Instagram (tabela social_posts + cron
// que roda publicar-social).
export const postarVagaNasRedes = async (vaga: Vaga) => {
  // Link direto pra página da vaga específica (não mais a genérica
  // /trabalhe-conosco) — achado 23/08/2026, pedido da Adriana: o CTA do
  // post precisa levar direto pra vaga. URL completa com https:// pra
  // ficar clicável de verdade onde a rede social suporta link na legenda
  // (Facebook reconhece automaticamente; Instagram não deixa link clicável
  // na legenda de jeito nenhum — limitação da própria plataforma, não do
  // nosso código — só "link na bio").
  const link = vaga.slug
    ? `https://carroeciamotors.com.br/vagas/${vaga.slug}`
    : 'https://carroeciamotors.com.br/trabalhe-conosco'
  // Usa o resumo (curto, pronto pra rede social) em vez da descrição
  // completa — a descrição pode ter formatação/markdown do editor e/ou
  // ser longa demais pro limite do Instagram. Se por algum motivo a vaga
  // não tiver resumo salvo (vaga antiga, criada antes dessa função
  // existir), cai pra descrição sem markdown, cortada no limite seguro.
  const corpo =
    vaga.resumo_redes ||
    stripHtml(parseMarkdown(vaga.descricao || '')).slice(0, LIMITE_CARACTERES_RESUMO_REDES)
  let texto = `📢 Estamos contratando: ${vaga.titulo}!\n\n${corpo}\n\n👉 Candidate-se agora, clique no link: ${link}`
  // Cinto de segurança: garante que o texto final nunca estoura o limite do
  // Instagram, mesmo que o resumo salvo tenha vindo de uma versão antiga
  // sem esse corte.
  if (texto.length > LIMITE_CARACTERES_RESUMO_REDES) {
    texto = `${texto.slice(0, LIMITE_CARACTERES_RESUMO_REDES - 1)}…`
  }
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      texto,
      imagem: vaga.imagem_url,
      redes: { facebook: true, instagram: true },
      data_agendamento: new Date().toISOString(),
      status: 'Agendado',
      content_type: 'feed',
    })
    .select()
    .single()
  return { data, error }
}
