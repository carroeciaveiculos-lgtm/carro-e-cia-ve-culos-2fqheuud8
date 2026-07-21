import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const ALLOWED_BUCKETS = ['media', 'veiculos-fotos', 'logos-e-imagens', 'site-assets']
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const { fileName, fileType, bucketName } = await req.json()
    if (!fileName || !fileType) {
      throw new Error('fileName and fileType are required')
    }

    const bucket = bucketName || 'media'
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      throw new Error(`Invalid bucket: ${bucket}`)
    }

    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
    const R2_BUCKET = Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens'

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      throw new Error('R2 credentials not configured')
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._\-/]/g, '_')
    const key = `${bucket}/${Date.now()}_${sanitizedFileName}`

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 })

    const publicUrl = `${R2_PUBLIC_BASE}/${key}`

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: presignedUrl,
        publicUrl,
        key,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
