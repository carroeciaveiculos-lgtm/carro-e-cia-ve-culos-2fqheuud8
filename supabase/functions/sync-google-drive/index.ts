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
const DEFAULT_BATCH_LIMIT = 5

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')
}

function extractPlate(folderName: string): string | null {
  const firstPart = folderName.trim().split(' ')[0]
  const plate = firstPart.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return plate.length >= 4 ? plate : null
}

function extractExistingUrls(fotos: unknown): string[] {
  if (Array.isArray(fotos)) return fotos.filter((f): f is string => typeof f === 'string')
  return []
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

interface VehicleSyncResult {
  plate: string
  folderName: string
  imagesSynced: number
  imagesSkipped: number
  error?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const startTime = Date.now()

  try {
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(parseInt(body.limit) || DEFAULT_BATCH_LIMIT, 1), 50)
    const offset = Math.max(parseInt(body.offset) || 0, 0)

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

    console.log(`📋 Batch config: limit=${limit}, offset=${offset}`)

    // 1. List ALL vehicle folders from the root Drive folder (with pagination)
    const allVehicleFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
    console.log(`📂 Total folders found in Drive: ${allVehicleFolders.length}`)

    // 2. Slice to get only the current batch
    const batchFolders = allVehicleFolders.slice(offset, offset + limit)
    console.log(`🔄 Processing batch: ${batchFolders.length} folders (offset=${offset})`)

    if (batchFolders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processedVehicles: [],
          totalImagesSynced: 0,
          totalImagesSkipped: 0,
          errors: [],
          nextOffset: null,
          message: 'No more folders to process. Sync complete.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const processedVehicles: string[] = []
    const errors: { plate: string; folder: string; error: string }[] = []
    let totalImagesSynced = 0
    let totalImagesSkipped = 0

    // 3. Process each vehicle folder in the batch
    for (const vehicleFolder of batchFolders) {
      const vehicleStartTime = Date.now()

      try {
        const plate = extractPlate(vehicleFolder.name)
        if (!plate) {
          console.log(`⚠️ Could not extract plate from: "${vehicleFolder.name}"`)
          errors.push({
            plate: 'UNKNOWN',
            folder: vehicleFolder.name,
            error: 'Could not extract plate from folder name',
          })
          continue
        }

        console.log(`🔍 Looking up vehicle with plate: ${plate} (folder: "${vehicleFolder.name}")`)

        // Fetch vehicle from DB
        const { data: vehicle, error: vehicleError } = await supabase
          .from('veiculos')
          .select('id, fotos')
          .eq('placa', plate)
          .maybeSingle()

        if (vehicleError) {
          console.error(`❌ DB error for plate ${plate}: ${vehicleError.message}`)
          errors.push({ plate, folder: vehicleFolder.name, error: `DB error: ${vehicleError.message}` })
          continue
        }

        if (!vehicle) {
          console.log(`❌ Vehicle not found for plate: ${plate}`)
          errors.push({ plate, folder: vehicleFolder.name, error: 'Vehicle not found in database' })
          continue
        }

        // Get existing fotos URLs for idempotency check
        const existingFotos = extractExistingUrls(vehicle.fotos)

        // List image files inside this vehicle's Drive folder
        const imageFiles = await listDriveItems(accessToken, vehicleFolder.id, false)
        const imageFilesFiltered = imageFiles.filter((f: any) =>
          f.mimeType && f.mimeType.startsWith('image/')
        )

        console.log(`📸 ${imageFilesFiltered.length} images found for ${plate} (existing in DB: ${existingFotos.length})`)

        if (imageFilesFiltered.length === 0) {
          processedVehicles.push(plate)
          continue
        }

        // Extract model name from folder name (remove the plate prefix)
        const modelName = vehicleFolder.name.trim().substring(plate.length).trim()
        const sanitizedModel = sanitizeName(modelName || 'veiculo')

        const newPhotoUrls: string[] = []
        let imagesSkippedForVehicle = 0

        for (const file of imageFilesFiltered) {
          try {
            const sanitizedFileName = file.name.replace(/\s+/g, '_')
            const storageKey = `media/${plate}_${sanitizedModel}/${sanitizedFileName}`
            const expectedUrl = `${R2_PUBLIC_BASE}/${storageKey}`

            // Idempotency: skip if this URL already exists in the vehicle's fotos array
            if (existingFotos.includes(expectedUrl)) {
              console.log(`⏭️ Skipping already-synced image: ${storageKey}`)
              imagesSkippedForVehicle++
              continue
            }

            console.log(`⬆️ Uploading: ${storageKey}`)

            // Download from Google Drive
            const { blob, mimeType } = await downloadDriveFile(accessToken, file.id)

            // Upload to Cloudflare R2
            await uploadToR2(storageKey, blob, mimeType)

            newPhotoUrls.push(expectedUrl)
            totalImagesSynced++
          } catch (fileErr: any) {
            console.error(`❌ Error syncing ${file.name} for ${plate}: ${fileErr.message}`)
          }
        }

        totalImagesSkipped += imagesSkippedForVehicle

        // 4. Incremental DB update: update fotos immediately after this vehicle is processed
        if (newPhotoUrls.length > 0) {
          const updatedFotos = [...existingFotos, ...newPhotoUrls]
          const { error: updateError } = await supabase
            .from('veiculos')
            .update({ fotos: updatedFotos, updated_at: new Date().toISOString() })
            .eq('id', vehicle.id)

          if (updateError) {
            console.error(`❌ Failed to update DB for ${plate}: ${updateError.message}`)
            errors.push({ plate, folder: vehicleFolder.name, error: `DB update failed: ${updateError.message}` })
          } else {
            console.log(`✅ Vehicle ${plate} updated with ${newPhotoUrls.length} new photos (skipped: ${imagesSkippedForVehicle})`)
            processedVehicles.push(plate)
          }
        } else {
          console.log(`✓ Vehicle ${plate}: no new photos to sync (skipped: ${imagesSkippedForVehicle})`)
          processedVehicles.push(plate)
        }

        const vehicleElapsed = ((Date.now() - vehicleStartTime) / 1000).toFixed(1)
        console.log(`⏱️ Vehicle ${plate} took ${vehicleElapsed}s`)
      } catch (vehicleErr: any) {
        console.error(`❌ Error processing folder "${vehicleFolder.name}": ${vehicleErr.message}`)
        errors.push({
          plate: extractPlate(vehicleFolder.name) || 'UNKNOWN',
          folder: vehicleFolder.name,
          error: vehicleErr.message,
        })
        // Continue to next vehicle — do NOT stop the batch
      }

      // Safety check: if we're approaching the 150s timeout, stop processing
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 120) {
        console.log(`⏰ Approaching timeout (${elapsed.toFixed(0)}s elapsed), stopping batch early`)
        break
      }
    }

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const nextOffset = offset + processedVehicles.length + errors.length
    const hasMore = offset + batchFolders.length < allVehicleFolders.length

    const summary = {
      success: true,
      processedVehicles,
      totalImagesSynced,
      totalImagesSkipped,
      errors,
      nextOffset: hasMore ? nextOffset : null,
      hasMore,
      elapsedSeconds: parseFloat(totalElapsed),
    }

    console.log(`📊 Batch complete: ${processedVehicles.length} vehicles, ${totalImagesSynced} images synced, ${errors.length} errors, ${totalElapsed}s`)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error(`❌ Fatal error: ${err.message}`)
    return new Response(
      JSON.stringify({ success: false, error: err.message, processedVehicles: [], totalImagesSynced: 0, errors: [{ plate: 'FATAL', folder: '', error: err.message }] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
