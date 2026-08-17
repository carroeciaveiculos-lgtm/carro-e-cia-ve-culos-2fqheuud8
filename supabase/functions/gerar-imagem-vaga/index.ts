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

    const promptBase = `Crie uma imagem para post de rede social anunciando uma vaga de emprego de "${titulo}" na revenda de veículos Carro e Cia. Use a logo fornecida com destaque e mantenha a identidade visual da marca (vermelho, branco, preto), estilo corporativo e moderno. Deixe um espaço vazio reservado para texto ser adicionado depois. Sem texto na imagem.`
    const prompt = ajuste ? `${promptBase}\n\nAjuste pedido pelo usuário: ${ajuste}` : promptBase

    // Usa a API de edição (não a de geração pura) pra compor com referências
    // reais da marca — logo oficial + fachada da loja (achado 17/08/2026) —
    // em vez de a IA "adivinhar" a marca só pela descrição em texto. Se já
    // existe uma imagem anterior (pedido de ajuste), edita ela em vez de
    // regenerar do zero, pra manter o que já estava bom.
    const form = new FormData()
    form.append('model', 'gpt-image-1')
    form.append('prompt', prompt)
    form.append('size', '1024x1024')
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

    // gpt-image-1 retorna base64 (b64_json), não URL como o dall-e-3 antigo —
    // suporta os dois formatos pra não quebrar se isso mudar de novo.
    const item = data.data?.[0]
    let bytes: Uint8Array
    if (item?.b64_json) {
      bytes = Uint8Array.from(atob(item.b64_json), (c) => c.charCodeAt(0))
    } else if (item?.url) {
      const imageRes = await fetch(item.url)
      if (!imageRes.ok) throw new Error('Falha ao baixar a imagem gerada')
      bytes = new Uint8Array(await imageRes.arrayBuffer())
    } else {
      throw new Error('Nenhuma imagem foi retornada pelo provedor')
    }

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

    const key = `vagas/${Date.now()}_ia_generated.png`
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: 'image/png',
      }),
    )

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_imagem_vaga',
      provider: 'openai',
      modelo: 'gpt-image-1',
      status: 'sucesso',
    })

    return new Response(JSON.stringify({ success: true, url: `${R2_PUBLIC_BASE}/${key}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
