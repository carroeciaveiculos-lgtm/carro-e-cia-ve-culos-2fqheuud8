import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Vaga = Database['public']['Tables']['vagas']['Row']
export type VagaInsert = Database['public']['Tables']['vagas']['Insert']
export type VagaUpdate = Database['public']['Tables']['vagas']['Update']

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

export const gerarImagemVaga = async (
  titulo: string,
  opts?: { ajuste?: string; imagemAtualUrl?: string },
) => {
  const { data, error } = await supabase.functions.invoke('gerar-imagem-vaga', {
    body: { titulo, ajuste: opts?.ajuste, imagemAtualUrl: opts?.imagemAtualUrl },
  })
  if (error) return { data: null, error }
  return { data: data?.url as string, error: null }
}

// Cria um post agendado pro agora, reaproveitando a mesma fila que o resto do
// site já usa pra publicar no Facebook/Instagram (tabela social_posts + cron
// que roda publicar-social).
export const postarVagaNasRedes = async (vaga: Vaga) => {
  const link = vaga.slug
    ? `carroeciamotors.com.br/vagas/${vaga.slug}`
    : 'carroeciamotors.com.br/trabalhe-conosco'
  const texto = `📢 Estamos contratando: ${vaga.titulo}!\n\n${vaga.descricao || ''}\n\nCandidate-se pelo site: ${link}`
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
