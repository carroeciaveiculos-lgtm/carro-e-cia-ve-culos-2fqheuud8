import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface CommandContext {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseServiceKey: string
  waToken: string
  waPhoneId: string
  fromPhone: string
}

export async function handleSugerir(ctx: CommandContext): Promise<string> {
  const { data: existing } = await ctx.supabase
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

  const temas = suggestions
    .split('\n')
    .map((t: string) => t.trim())
    .filter(Boolean)
  for (const tema of temas) {
    await ctx.supabase.from('agenda_conteudo').insert({ tema, status: 'Agendado' })
  }

  return `💡 *3 Sugestões de Temas:*\n\n${suggestions}\n\n✅ Temas salvos na agenda de conteúdo.`
}

export async function handleVer(ctx: CommandContext): Promise<string> {
  const { data: post } = await ctx.supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, content, keyword')
    .eq('requires_review', true)
    .eq('published', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!post) return '❌ Nenhum artigo em revisão no momento.'

  const wordCount =
    post.content
      ?.replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length || 0
  const previewUrl = `https://www.carroeciamotors.com.br/blog/${post.slug}`

  return `📄 *Artigo em Revisão:*\n\n*${post.title}*\n\nPalavras: ${wordCount}\nKeyword: ${post.keyword || 'N/A'}\nMeta: ${post.meta_description?.substring(0, 100) || 'N/A'}...\n\nPreview: ${previewUrl}`
}

export async function handleAprovar(ctx: CommandContext): Promise<string> {
  const { data: post } = await ctx.supabase
    .from('blog_posts')
    .select('id, title, slug')
    .eq('requires_review', true)
    .eq('published', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!post) return '❌ Nenhum artigo pendente para aprovação.'

  await ctx.supabase
    .from('blog_posts')
    .update({ published: true, requires_review: false })
    .eq('id', post.id)
  await ctx.supabase
    .from('agenda_conteudo')
    .update({ status: 'Publicado' })
    .eq('artigo_id', post.id)

  try {
    await fetch(`${ctx.supabaseUrl}/functions/v1/publicar-social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
  } catch {
    // non-blocking
  }

  return `✅ Artigo aprovado e publicado!\n\n*${post.title}*\n\nO conteúdo já está no ar em /blog/${post.slug}\n\n📢 Publicação social disparada.`
}

export async function handleCorrigir(instrucoes: string, ctx: CommandContext): Promise<string> {
  if (!instrucoes) return '❌ Use: CORRIGIR [instruções]'

  const { data: post } = await ctx.supabase
    .from('blog_posts')
    .select('id, title, keyword')
    .eq('requires_review', true)
    .eq('published', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!post) return '❌ Nenhum artigo pendente para correção.'

  await ctx.supabase.from('agente_interacoes').insert({
    usuario_telefone: ctx.fromPhone,
    mensagem_usuario: `CORRIGIR: ${instrucoes}`,
    resposta_agente: 'Correção agendada para processamento.',
    contexto_artigo_id: post.id,
    tipo_comando: 'conteudo',
  })

  try {
    await fetch(`${ctx.supabaseUrl}/functions/v1/gerar-conteudo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        tema: post.title,
        palavraChave: post.keyword || '',
        is_seo_copilot: true,
        title: post.title,
      }),
    })
  } catch {
    // non-blocking - feedback is logged in agente_interacoes
  }

  return `📝 Correção recebida para *${post.title}*.\n\nInstrução: ${instrucoes}\n\nO agente IA processará a correção e notificará quando terminar.`
}
