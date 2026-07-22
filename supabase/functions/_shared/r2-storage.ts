import { S3Client, PutObjectCommand, HeadObjectCommand } from 'npm:@aws-sdk/client-s3@3'

const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

let cachedClient: S3Client | null = null

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: Deno.env.get('R2_ENDPOINT') ?? '',
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
    },
    forcePathStyle: true,
  })
  return cachedClient
}

export function getR2Bucket(): string {
  return Deno.env.get('R2_BUCKET') || Deno.env.get('R2_BUCKET_NAME') || 'carroeciamotors-imagens'
}

export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_BASE}/${key}`
}

export async function checkR2FileExists(key: string): Promise<boolean> {
  try {
    const client = getR2Client()
    await client.send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }))
    return true
  } catch {
    return false
  }
}

export async function uploadToR2(key: string, body: Blob, contentType: string): Promise<void> {
  const client = getR2Client()
  const arrayBuffer = await body.arrayBuffer()
  await client.send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType,
    }),
  )
}
