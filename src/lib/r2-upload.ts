import { supabase } from '@/lib/supabase/client'

const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

export interface R2UploadResult {
  publicUrl: string
  key: string
}

export async function getR2PresignedUrl(
  fileName: string,
  fileType: string,
  bucketName: string = 'media',
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const { data, error } = await supabase.functions.invoke('get-r2-presigned-url', {
    body: { fileName, fileType, bucketName },
  })

  if (error) throw new Error(`Falha ao obter URL de upload: ${error.message}`)
  if (!data?.uploadUrl) throw new Error('URL de upload não retornada')

  return {
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
    key: data.key,
  }
}

export async function uploadToR2(
  file: Blob | File,
  fileName: string,
  fileType: string,
  bucketName: string = 'media',
): Promise<R2UploadResult> {
  const { uploadUrl, publicUrl, key } = await getR2PresignedUrl(fileName, fileType, bucketName)

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': fileType,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Falha no upload para R2: ${response.status} - ${errorText}`)
  }

  return { publicUrl, key }
}

export function getR2PublicUrl(bucket: string, key: string): string {
  return `${R2_PUBLIC_BASE}/${bucket}/${key}`
}
