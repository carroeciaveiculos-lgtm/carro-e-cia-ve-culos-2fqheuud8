import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'
const LOGO_URL = `${R2_PUBLIC_BASE}/logos-e-imagens/marca/logo-oficial.png`
const FACHADA_URL = `${R2_PUBLIC_BASE}/logos-e-imagens/marca/fachada-da-loja.png`

async function fetchAsFile(url: string, name: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar referência de imagem (${name})`)
  const buf = await res.arrayBuffer()
  return new File([buf], name, { type: res.headers.get('content-type') || 'image/png' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { titulo, ajuste, imagemAtualUrl } = await req.json()
    if (!titulo) throw new Error('Informe o título da vaga')

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

    // Padrão único de imagem (achado 23/08/2026, pedido da Adriana): a
    // composição da foto (pessoas, ambiente, layout) fica sempre igual,
    // não muda por cargo — só o texto do cargo muda.
    //
    // Achado 23/08/2026 (2ª rodada, feedback direto da Adriana vendo as
    // imagens geradas): (1) a logo fica ilegível quando cai sobre fundo
    // preto/escuro — só funciona em fundo branco/claro, então o prompt
    // agora prende a logo a um cartão branco explícito. (2) ela quer os
    // dados da vaga (cargo) escritos de verdade dentro desse cartão
    // branco, não mais deixados em branco pra adicionar depois.
    //
    // Achado anterior (23/08/2026): com só "use a logo fornecida", o modelo
    // às vezes inventava um logo genérico em vez de reproduzir a marca real
    // — mais provável quando duas imagens de referência (logo + fachada)
    // são mandadas juntas e o modelo não sabe qual é qual. Labels
    // explícitos + instrução de fidelidade reduzem isso.
    const promptBase = imagemAtualUrl
      ? `Ajuste a imagem enviada mantendo: a identidade visual da marca (vermelho, branco, preto), as duas pessoas (uma mulher e um homem), e o cartão de fundo BRANCO com a logomarca oficial e o texto "ESTAMOS CONTRATANDO" / "${titulo}". A logo e esse texto precisam continuar SOMENTE sobre fundo branco/claro — nunca sobre preto ou escuro, porque fica ilegível.`
      : `Crie uma foto realista e profissional (não é ilustração nem desenho vetorial) para post de vaga de emprego da revenda de veículos Carro e Cia. Mostre duas pessoas reais, uma mulher e um homem, ambos com vestimenta profissional (camisa social ou blazer), em pé lado a lado, com expressão confiante e simpática, num ambiente de concessionária de veículos (loja ou com um carro desfocado ao fundo).

Inclua um cartão ou faixa de fundo BRANCO (nunca preto ou escuro) numa das bordas da composição. É SOMENTE nesse cartão branco que a logomarca oficial da empresa (primeira imagem anexada) deve aparecer — reproduza ela exatamente como está (mesmo desenho, mesmas cores, mesma tipografia), com destaque, sem inventar um logo novo. A logo NUNCA deve ficar sobre fundo preto ou escuro — só sobre fundo branco/claro, senão fica ilegível.

Nesse mesmo cartão branco, escreva com ótima legibilidade (fonte grossa, estilo corporativo, texto preto ou vermelho) o seguinte, em duas linhas: um cabeçalho pequeno "ESTAMOS CONTRATANDO" e, logo abaixo, bem maior e em negrito, o nome do cargo: "${titulo}".

A segunda imagem anexada é uma foto real da fachada da loja, use só como referência de ambientação. Mantenha a identidade visual da marca (vermelho, branco, preto) no restante da composição, estilo corporativo e moderno. Essa composição (as duas pessoas, o cartão branco com a logo e o texto) deve se manter sempre no mesmo estilo — só o cargo muda.`
    const prompt = ajuste ? `${promptBase}\n\nAjuste pedido pelo usuário: ${ajuste}` : promptBase

    // Usa a API de edição (não a de geração pura) pra compor com referências
    // reais da marca — logo oficial + fachada da loja (achado 17/08/2026) —
    // em vez de a IA "adivinhar" a marca só pela descrição em texto. Se já
    // existe uma imagem anterior (pedido de ajuste), edita ela em vez de
    // regenerar do zero, pra manter o que já estava bom.
    //
    // n=2 (achado 23/08/2026, pedido da Adriana): gera 2 opções na mesma
    // chamada pra ela escolher, em vez de forçar regenerar do zero até
    // gostar de uma.
    const form = new FormData()
    form.append('model', 'gpt-image-2')
    form.append('prompt', prompt)
    form.append('size', '1024x1024')
    form.append('n', '2')
    if (imagemAtualUrl) {
      form.append('image[]', await fetchAsFile(imagemAtualUrl, 'imagem-atual.png'))
    } else {
      form.append('image[]', await fetchAsFile(LOGO_URL, 'logo.png'))
      form.append('image[]', await fetchAsFile(FACHADA_URL, 'fachada.png'))
    }

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Erro na API da OpenAI')
    if (!data.data?.length) throw new Error('Nenhuma imagem foi retornada pelo provedor')

    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
    const R2_BUCKET = Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens'

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      throw new Error('R2 não configurado')
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    })

    // gpt-image-1/2 retorna base64 (b64_json), não URL como o dall-e-3 antigo —
    // suporta os dois formatos pra não quebrar se isso mudar de novo.
    const urls: string[] = []
    for (const item of data.data) {
      let bytes: Uint8Array
      if (item?.b64_json) {
        bytes = Uint8Array.from(atob(item.b64_json), (c) => c.charCodeAt(0))
      } else if (item?.url) {
        const imageRes = await fetch(item.url)
        if (!imageRes.ok) throw new Error('Falha ao baixar a imagem gerada')
        bytes = new Uint8Array(await imageRes.arrayBuffer())
      } else {
        continue
      }

      const key = `vagas/${Date.now()}_${urls.length}_ia_generated.png`
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: bytes,
          ContentType: 'image/png',
        }),
      )
      urls.push(`${R2_PUBLIC_BASE}/${key}`)
    }
    if (!urls.length) throw new Error('Nenhuma imagem foi retornada pelo provedor')

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_imagem_vaga',
      provider: 'openai',
      modelo: 'gpt-image-2',
      status: 'sucesso',
    })

    return new Response(JSON.stringify({ success: true, urls }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
