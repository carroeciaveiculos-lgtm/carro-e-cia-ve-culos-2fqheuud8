import { createClient } from 'jsr:@supabase/supabase-js@2'

export const AUTHORIZED_PHONE = '5534984080220'

type SupabaseClient = ReturnType<typeof createClient>

export async function processWhatsAppCommand(
  messageText: string,
  fromPhone: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<string | null> {
  if (fromPhone !== AUTHORIZED_PHONE) return null

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const text = messageText.trim()
  const upper = text.toUpperCase()

  if (upper.startsWith('APROVAR')) {
    return await handleAprovar(text.substring(8).trim(), supabase)
  }
  if (upper.startsWith('CORRIGIR')) {
    return await handleCorrigir(text.substring(9).trim(), supabase)
  }
  if (upper.startsWith('VER')) {
    return await handleVer(text.substring(4).trim(), supabase)
  }
  if (upper.startsWith('SUGERIR')) {
    return await handleSugerir(supabase)
  }

  return 'Comando não reconhecido.\n\nUse:\n• APROVAR [tema]\n• CORRIGIR [tema] [instrução]\n• VER [tema]\n• SUGERIR'
}

async function handleAprovar(searchTerm: string, supabase: SupabaseClient): Promise<string> {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
    .eq('published', false)
    .maybeSingle()

  if (!post) return `❌ Artigo não encontrado ou já publicado: "${searchTerm}"`

  await supabase.from('blog_posts').update({ published: true }).eq('id', post.id)
  await supabase.from('agenda_conteudo').update({ status: 'Publicado' }).eq('artigo_id', post.id)

  return `✅ Artigo aprovado e publicado!\n\n*${post.title}*\n\nO conteúdo já está no ar em /blog/${post.slug}`
}

async function handleCorrigir(rest: string, supabase: SupabaseClient): Promise<string> {
  const parts = rest.split(' ')
  const searchTerm = parts[0] || ''
  const instrucao = parts.slice(1).join(' ')

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title')
    .or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
    .maybeSingle()

  if (!post) return `❌ Artigo não encontrado: "${searchTerm}"`

  await supabase.from('agente_interacoes').insert({
    usuario_telefone: AUTHORIZED_PHONE,
    mensagem_usuario: rest,
    resposta_agente: 'Correção agendada para processamento.',
    contexto_artigo_id: post.id,
  })

  return `📝 Correção recebida para "${post.title}".\n\nInstrução: ${instrucao}\n\nO agente IA processará a correção e notificará quando terminar.`
}

async function handleVer(searchTerm: string, supabase: SupabaseClient): Promise<string> {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, content')
    .or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
    .maybeSingle()

  if (!post) return `❌ Artigo não encontrado: "${searchTerm}"`

  const wordCount =
    post.content
      ?.replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length || 0
  const previewUrl = `https://www.carroeciamotors.com.br/blog/${post.slug}`

  return `📄 *${post.title}*\n\nPalavras: ${wordCount}\nMeta: ${post.meta_description?.substring(0, 100) || 'N/A'}...\n\nPreview: ${previewUrl}`
}

async function handleSugerir(supabase: SupabaseClient): Promise<string> {
  const { data: existing } = await supabase
    .from('agenda_conteudo')
    .select('tema')
    .order('created_at', { ascending: false })
    .limit(10)

  const existingTopics = existing?.map((a: any) => a.tema).join(', ') || 'nenhum'
  const apiKey = Deno.env.get('GEMINI_APY_KEY')

  let suggestions = ''
  if (apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Sugira 3 temas de artigos para blog de veículos seminovos em Uberaba MG. Foque em SEO local e tendências automotivas 2026. Retorne apenas os 3 temas, um por linha, sem numeração. Temas já existentes: ${existingTopics}`,
                  },
                ],
              },
            ],
          }),
        },
      )
      const data = await res.json()
      suggestions = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch {
      suggestions =
        'Financiamento de carros usados em Uberaba 2026\nMelhores SUVs seminovos para comprar\nComo avaliar seu carro para troca'
    }
  } else {
    suggestions =
      'Financiamento de carros usados em Uberaba 2026\nMelhores SUVs seminovos para comprar\nComo avaliar seu carro para troca'
  }

  return `💡 *3 Sugestões de Temas:*\n\n${suggestions}\n\nPara agendar, use o painel administrativo.`
}
