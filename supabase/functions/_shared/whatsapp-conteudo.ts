import { createClient } from 'jsr:@supabase/supabase-js@2'
import { VALIDADE_MINUTOS, type Preparo } from './whatsapp-confirmacao.ts'

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

// PREPARA (nao altera nada): mostra qual artigo sera publicado.
export async function prepararAprovar(ctx: CommandContext): Promise<Preparo> {
  const { data: post } = await ctx.supabase
    .from('blog_posts')
    .select('id, title, slug')
    .eq('requires_review', true)
    .eq('published', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!post) return { resposta: '❌ Nenhum artigo pendente para aprovação.' }

  return {
    pedido: {
      comando: 'APROVAR',
      alvo: { id: post.id, titulo: post.title, slug: post.slug },
      resumo: `APROVAR ${post.title}`,
      pergunta: `📝 Quer realmente *APROVAR e PUBLICAR* este artigo?\n\n*${post.title}*\n/blog/${post.slug}\n\nResponda *SIM* ou *NÃO* (vale por ${VALIDADE_MINUTOS} minutos).`,
    },
  }
}

// EXECUTA e CONFIRMA: publica, le o artigo de volta e so entao diz "no ar".
// O disparo da publicacao social e pedido a outra function; nao ha como
// confirmar o resultado daqui, entao a resposta diz so que o pedido foi feito.
export async function executarAprovar(
  alvo: Record<string, any>,
  ctx: CommandContext,
): Promise<string> {
  const { error } = await ctx.supabase
    .from('blog_posts')
    .update({ published: true, requires_review: false })
    .eq('id', alvo.id)
  if (error) return `❌ Não consegui publicar *${alvo.titulo}*. O artigo continua em revisão.`

  await ctx.supabase
    .from('agenda_conteudo')
    .update({ status: 'Publicado' })
    .eq('artigo_id', alvo.id)

  const { data: lido } = await ctx.supabase
    .from('blog_posts')
    .select('published, requires_review')
    .eq('id', alvo.id)
    .maybeSingle()
  if (!(lido?.published === true && lido?.requires_review === false)) {
    return `⚠️ Pedi a publicação, mas ao reler o artigo *${alvo.titulo}* ele não aparece como publicado. Confira no painel.`
  }

  let social = 'Pedido de publicação social NÃO enviado (falha ao chamar a function).'
  try {
    const res = await fetch(`${ctx.supabaseUrl}/functions/v1/publicar-social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': Deno.env.get('INTERNAL_SERVICE_SECRET') || '',
      },
      body: JSON.stringify({}),
    })
    social = res.ok
      ? 'Pedido de publicação social enviado (não consigo confirmar daqui se as redes já postaram).'
      : `Pedido de publicação social recusado (HTTP ${res.status}).`
  } catch {
    // mantem o texto de falha acima
  }

  return `✅ Confirmado: artigo *${alvo.titulo}* está publicado (conferi depois de salvar).\n\nNo ar em /blog/${alvo.slug}\n\n📢 ${social}`
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
