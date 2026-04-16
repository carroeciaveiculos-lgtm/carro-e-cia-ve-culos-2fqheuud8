import { supabase } from '@/lib/supabase/client'

/**
 * Faz upload de um arquivo Blob para o Supabase Storage.
 * @param bucketName Nome do bucket (ex: 'contratos-consignacao').
 * @param filePath Caminho completo do arquivo dentro do bucket (ex: 'contratos/meu_contrato.docx').
 * @param file Blob do arquivo a ser enviado.
 * @param contentType Tipo de conteúdo do arquivo.
 * @returns Promise<string> Caminho interno do arquivo.
 */
export async function uploadFileToSupabase(
  bucketName: string,
  filePath: string,
  file: Blob,
  contentType: string,
): Promise<string> {
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
