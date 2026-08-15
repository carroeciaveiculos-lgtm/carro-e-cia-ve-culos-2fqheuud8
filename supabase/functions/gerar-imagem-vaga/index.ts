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

    const { titulo } = await req.json()
    if (!titulo) throw new Error('Informe o título da vaga')

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Imagem padrão para post de rede social anunciando uma vaga de emprego de "${titulo}" numa revenda de carros seminovos. Estilo corporativo, moderno, cores vermelho e branco (identidade da marca Carro e Cia Veículos), com espaço vazio central reservado para texto ser adicionado depois. Sem texto na imagem.`,
        n: 1,
        size: '1024x1024',
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Erro na API da OpenAI')

    const imageUrl = data.data[0].url
    if (!imageUrl) throw new Error('Nenhuma URL de imagem foi retornada pelo provedor')

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) throw new Error('Falha ao baixar a imagem gerada')
    const bytes = new Uint8Array(await imageRes.arrayBuffer())

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
      modelo: 'dall-e-3',
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
