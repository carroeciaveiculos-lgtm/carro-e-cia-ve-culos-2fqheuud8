import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getAccessToken,
  listDriveItems,
  downloadDriveFile,
} from '../_shared/google-drive.ts'

const ROOT_FOLDER_ID = '1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY'
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')
}

function extractPlate(folderName: string): string | null {
  // O nome da pasta é tipo "FDL2J11 RAM 2500 LARAMIE 4X4 DIESEL 2018"
  // A placa é sempre o PRIMEIRO campo (antes do primeiro espaço)
  const firstPart = folderName.trim().split(' ')[0]
  // Limpar apenas caracteres não alfanuméricos, manter letras e números
  const plate = firstPart.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return plate.length >= 4 ? plate : null
}

async function uploadToR2(key: string, blob: Blob, contentType: string): Promise<void> {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: Deno.env.get('R2_ENDPOINT')!,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    },
    forcePathStyle: true,
  })

  const buffer = await blob.arrayBuffer()
  await s3Client.send(
    new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens',
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
    }),
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientEmail = Deno.env.get('DRIVE_CLIENT_EMAIL')
    const privateKey = (Deno.env.get('DRIVE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
    const projectId = Deno.env.get('DRIVE_PROJECT_ID')

    if (!clientEmail || !privateKey || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Google Drive credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const accessToken = await getAccessToken(clientEmail, privateKey)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let totalPhotosSynced = 0
    let vehiclesUpdated = 0

    // 1️⃣ Listar TODAS as pastas DENTRO da pasta raiz
    const vehicleFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
    console.log(`📂 Pastas encontradas no Drive: ${vehicleFolders.length}`)

    for (const vehicleFolder of vehicleFolders) {
      // 2️⃣ Extrair a PLACA do nome da pasta (primeiro campo antes do espaço)
      const plate = extractPlate(vehicleFolder.name)
      if (!plate) {
        console.log(`⚠️ Não foi possível extrair placa de: "${vehicleFolder.name}"`)
        continue
      }

      console.log(`🔍 Buscando veículo com placa: ${plate} (pasta: "${vehicleFolder.name}")`)

      // 3️⃣ Buscar veículo no banco pela placa
      const { data: vehicle } = await supabase
        .from('veiculos')
        .select('id, fotos')
        .eq('placa', plate)
        .maybeSingle()

      if (!vehicle) {
        console.log(`❌ Veículo não encontrado para placa: ${plate}`)
        continue
      }

      // 4️⃣ Listar ARQUIVOS de imagem DENTRO da pasta do veículo (não subpastas!)
      const imageFiles = await listDriveItems(accessToken, vehicleFolder.id, false)
      const imageFilesFiltered = imageFiles.filter((f: any) =>
        f.mimeType && f.mimeType.startsWith('image/')
      )

      console.log(`📸 ${imageFilesFiltered.length} imagens encontradas para ${plate}`)

      if (imageFilesFiltered.length === 0) continue

      const photoUrls: string[] = []

      for (const file of imageFilesFiltered) {
        try {
          // Extrair nome do modelo a partir do nome da pasta (remover a placa)
          const modelName = vehicleFolder.name.trim().substring(plate.length).trim()
          const sanitizedModel = sanitizeName(modelName || 'veiculo')

          // Nome sanitizado do arquivo
          const sanitizedFileName = file.name.replace(/\s+/g, '_')

          // Key no R2: media/{PLACA}_{MODELO}/{arquivo}
          const storageKey = `media/${plate}_${sanitizedModel}/${sanitizedFileName}`

          console.log(`⬆️ Enviando: ${storageKey}`)

          // Baixar do Drive
          const { blob, mimeType } = await downloadDriveFile(accessToken, file.id)

          // Upload para o R2
          await uploadToR2(storageKey, blob, mimeType)

          photoUrls.push(`${R2_PUBLIC_BASE}/${storageKey}`)
          totalPhotosSynced++
        } catch (err: any) {
          console.error(`❌ Erro ao sincronizar ${file.name}: ${err.message}`)
        }
      }

      // 5️⃣ Atualizar coluna 'fotos' no banco
      if (photoUrls.length > 0) {
        const existingFotos = Array.isArray(vehicle.fotos) ? (vehicle.fotos as string[]) : []
        const updatedFotos = [...existingFotos, ...photoUrls]
        await supabase
          .from('veiculos')
          .update({ fotos: updatedFotos, updated_at: new Date().toISOString() })
          .eq('id', vehicle.id)
        vehiclesUpdated++
        console.log(`✅ Veículo ${plate} atualizado com ${photoUrls.length} fotos`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalPhotosSynced, vehiclesUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error(`❌ Erro geral: ${err.message}`)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})