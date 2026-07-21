import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { corsHeaders } from '../_shared/cors.ts'
import { getAccessToken, listDriveItems, downloadDriveFile } from '../_shared/google-drive.ts'

const ROOT_FOLDER_ID = '1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY'
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '')
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
      return new Response(JSON.stringify({ error: 'Google Drive credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(clientEmail, privateKey)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let totalPhotosSynced = 0
    let vehiclesUpdated = 0

    const plateFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)

    for (const plateFolder of plateFolders) {
      const plate = plateFolder.name.toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!plate) continue

      const { data: vehicle } = await supabase
        .from('veiculos')
        .select('id, fotos')
        .eq('placa', plate)
        .maybeSingle()

      if (!vehicle) continue

      const nameFolders = await listDriveItems(accessToken, plateFolder.id, true)

      for (const nameFolder of nameFolders) {
        const sanitizedName = sanitizeName(nameFolder.name)
        const yearFolders = await listDriveItems(accessToken, nameFolder.id, true)

        for (const yearFolder of yearFolders) {
          const imageFiles = await listDriveItems(accessToken, yearFolder.id, false)
          const photoUrls: string[] = []

          for (const file of imageFiles) {
            try {
              const { blob, mimeType } = await downloadDriveFile(accessToken, file.id)
              const sanitizedFileName = file.name.replace(/\s+/g, '_')
              const storageKey = `media/${plate}_${sanitizedName}/${sanitizedFileName}`
              await uploadToR2(storageKey, blob, mimeType)
              photoUrls.push(`${R2_PUBLIC_BASE}/${storageKey}`)
              totalPhotosSynced++
            } catch (err: any) {
              console.error(`Failed to sync file ${file.name}:`, err.message)
            }
          }

          if (photoUrls.length > 0) {
            const existingFotos = Array.isArray(vehicle.fotos) ? (vehicle.fotos as string[]) : []
            const updatedFotos = [...existingFotos, ...photoUrls]
            await supabase
              .from('veiculos')
              .update({ fotos: updatedFotos, updated_at: new Date().toISOString() })
              .eq('id', vehicle.id)
            vehiclesUpdated++
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, totalPhotosSynced, vehiclesUpdated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
