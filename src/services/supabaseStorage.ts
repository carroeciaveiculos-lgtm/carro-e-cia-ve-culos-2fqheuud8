import { supabase } from '@/lib/supabase/client'
import { uploadToR2 } from '@/lib/r2-upload'

const PUBLIC_BUCKETS = [
  'veiculos',
  'media',
  'site-assets',
  'brain_docs',
  'feeds',
  'documentos-veiculos',
  'imagens',
  'logos-e-imagens',
  'veiculos-videos',
  'veiculos-fotos',
]

const PRIVATE_BUCKETS = ['contratos-consignacao', 'documentos-internos']

function isPublicBucket(bucketName: string): boolean {
  return PUBLIC_BUCKETS.includes(bucketName)
}

/**
 * Faz upload de um arquivo Blob para R2 (buckets públicos) ou Supabase Storage (buckets privados).
 * @param bucketName Nome do bucket.
 * @param filePath Caminho completo do arquivo dentro do bucket.
 * @param file Blob do arquivo a ser enviado.
 * @param contentType Tipo de conteúdo do arquivo.
 * @returns Promise<string> URL pública (R2) ou caminho interno (Supabase privado).
 */
export async function uploadFileToSupabase(
  bucketName: string,
  filePath: string,
  file: Blob,
  contentType: string,
): Promise<string> {
  if (isPublicBucket(bucketName)) {
    const { publicUrl } = await uploadToR2(file, filePath, contentType, bucketName)
    return publicUrl
  }

  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      contentType: contentType,
      upsert: true,
    })

    if (error) {
      throw new Error(`Erro ao fazer upload para Supabase: ${error.message}`)
    }

    return `${bucketName}/${filePath}`
  } catch (error) {
    console.error('Erro no upload para Supabase:', error)
    throw error
  }
}

/**
 * Faz upload de um arquivo para um bucket público do R2.
 */
export async function uploadToPublicBucket(
  bucketName: string,
  filePath: string,
  file: Blob,
  contentType: string,
): Promise<string> {
  const { publicUrl } = await uploadToR2(file, filePath, contentType, bucketName)
  return publicUrl
}

/**
 * Faz upload de um arquivo para um bucket privado do Supabase Storage.
 */
export async function uploadToPrivateBucket(
  bucketName: string,
  filePath: string,
  file: Blob,
  contentType: string,
): Promise<string> {
  if (!PRIVATE_BUCKETS.includes(bucketName)) {
    console.warn(`Bucket "${bucketName}" não está na lista de buckets privados conhecidos.`)
  }

  const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Erro ao fazer upload para Supabase: ${error.message}`)
  }

  return `${bucketName}/${filePath}`
}

/**
 * Gera uma URL assinada para acesso a arquivos em buckets privados do Supabase.
 */
export async function getSignedUrl(
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    throw new Error(`Erro ao gerar URL assinada: ${error.message}`)
  }

  return data.signedUrl
}
