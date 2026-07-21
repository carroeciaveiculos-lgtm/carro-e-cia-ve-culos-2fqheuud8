import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3'
import { corsHeaders } from '../_shared/cors.ts'
import { getAccessToken, listDriveItems, downloadDriveFile } from '../_shared/google-drive.ts'

const ROOT_FOLDER_ID = '1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY'
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'
const SITE_BASE_URL = 'https://www.carroeciamotors.com.br'
const BATCH_SIZE = 2
const SYNC_CONTROL_KEY = 'drive_offset'
const MAX_EXECUTION_MS = 140000

const s3Client = new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('R2_ENDPOINT')!,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  },
  forcePathStyle: true,
})

function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '')
}

function extractPlate(folderName: string): string | null {
  const firstPart = folderName.trim().split(' ')[0]
  const plate = firstPart.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return plate.length >= 4 ? plate : null
}

function safeError(err: unknown): string {
  if (err instanceof Error) return `[${err.name}] ${err.message}`
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err ?? 'Erro desconhecido')
  }
}

function getRemainingMs(startTime: number): number {
  return MAX_EXECUTION_MS - (Date.now() - startTime)
}

async function uploadToR2(
  key: string,
  data: Blob | Uint8Array,
  contentType: string,
): Promise<void> {
  const body =
    data instanceof Uint8Array ? data : new Uint8Array(await (data as Blob).arrayBuffer())
  await s3Client.send(
    new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens',
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

async function generateQrCodeBlob(url: string): Promise<Blob> {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&data=${encodeURIComponent(url)}`
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error(`QR code generation failed: ${res.status}`)
  return res.blob()
}

async function getOffset(supabase: any): Promise<number> {
  try {
    const { data } = await supabase
      .from('sync_control')
      .select('current_offset')
      .eq('sync_key', SYNC_CONTROL_KEY)
      .maybeSingle()
    return data?.current_offset ?? 0
  } catch {
    return 0
  }
}

async function saveOffset(supabase: any, offset: number): Promise<void> {
  try {
    await supabase.from('sync_control').upsert({
      sync_key: SYNC_CONTROL_KEY,
      current_offset: offset,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn(`⚠️ saveOffset: ${safeError(e)}`)
  }
}

async function logError(
  supabase: any,
  veiculoId: string | null,
  error: string,
  payload: any,
): Promise<void> {
  try {
    await supabase.from('logs_integracao').insert({
      veiculo_id: veiculoId,
      portal: 'google-drive',
      payload_erro: { error, ...payload },
      status: 'error',
    })
  } catch (e) {
    console.error(`Failed to log error: ${safeError(e)}`)
  }
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientEmail = Deno.env.get('DRIVE_CLIENT_EMAIL')
    const privateKey = (Deno.env.get('DRIVE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
    if (!clientEmail || !privateKey || !Deno.env.get('DRIVE_PROJECT_ID')) {
      return new Response(JSON.stringify({ error: 'Drive credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let payloadOffset: number | undefined, payloadLimit: number | undefined
    try {
      const body = await req.json()
      if (body && typeof body === 'object') {
        payloadOffset = body.offset
        payloadLimit = body.limit
      }
    } catch {}

    const limit = payloadLimit ?? BATCH_SIZE
    console.log('🔑 Authenticating...')
    const accessToken = await getAccessToken(clientEmail, privateKey)
    console.log('✅ Drive auth OK')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const offset = payloadOffset ?? (await getOffset(supabase))
    console.log(`📋 limit=${limit}, offset=${offset}`)

    const allFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
    console.log(`📂 ${allFolders.length} folders`)

    const batch = allFolders.slice(offset, offset + limit)
    console.log(`🔄 ${batch.length} folders (offset=${offset})`)

    let totalSynced = 0,
      vehiclesUpdated = 0,
      processedCount = 0

    for (const [idx, folder] of batch.entries()) {
      const remaining = getRemainingMs(startTime)
      if (remaining < 30000) {
        console.log(
          `⏰ Remaining time: ${remaining}ms < 30000ms, stopping early at vehicle ${idx + 1}`,
        )
        break
      }

      const plate = extractPlate(folder.name)
      if (!plate) {
        console.log(`⚠️ No plate: "${folder.name}"`)
        continue
      }
      console.log(`🔍 [${idx + 1}] ${plate}`)

      let vehicleId: string | null = null,
        vehicleSlug: string | null = null
      let existingCount = 0,
        existingVideoUrl: string | null = null,
        existingQrUrl: string | null = null

      try {
        const res = await supabase
          .from('veiculos')
          .select('id, fotos, slug, video_url, qrcode_url')
          .eq('placa', plate)
          .maybeSingle()
        if (res.error) {
          console.error(`❌ Query: ${safeError(res.error)}`)
          await logError(supabase, null, `Query error for plate ${plate}`, {
            plate,
            error: safeError(res.error),
          })
          continue
        }
        if (res.data) {
          vehicleId = res.data.id
          vehicleSlug = res.data.slug
          existingVideoUrl = res.data.video_url
          existingQrUrl = res.data.qrcode_url
          existingCount = Array.isArray(res.data.fotos) ? (res.data.fotos as string[]).length : 0
        }
      } catch (e) {
        console.error(`❌ Query threw: ${safeError(e)}`)
        await logError(supabase, null, `Query threw for plate ${plate}`, {
          plate,
          error: safeError(e),
        })
        continue
      }

      if (!vehicleId) {
        console.log(`❌ Not found: ${plate}`)
        continue
      }
      console.log(
        `📸 ${plate}: ${existingCount} fotos, video: ${existingVideoUrl ? 'yes' : 'no'}, qr: ${existingQrUrl ? 'yes' : 'no'}`,
      )

      let allMedia: any[] = []
      try {
        const files = await listDriveItems(accessToken, folder.id, false)
        allMedia = files.filter(
          (f: any) =>
            f.mimeType?.startsWith('image/') ||
            f.mimeType === 'video/mp4' ||
            f.name?.toLowerCase().endsWith('.mp4'),
        )
      } catch (e) {
        console.error(`❌ Drive list: ${safeError(e)}`)
        await logError(supabase, vehicleId, `Drive list error`, { plate, error: safeError(e) })
        continue
      }

      const allImages = allMedia.filter((f: any) => f.mimeType?.startsWith('image/'))
      const allVideos = allMedia.filter(
        (f: any) => f.mimeType === 'video/mp4' || f.name?.toLowerCase().endsWith('.mp4'),
      )
      console.log(`📸 ${allImages.length} images, 🎥 ${allVideos.length} videos in Drive`)

      const hasAllPhotos = existingCount >= allImages.length
      const hasVideo = allVideos.length === 0 || existingVideoUrl
      const hasQrCode = existingQrUrl
      if (hasAllPhotos && hasVideo && hasQrCode) {
        console.log(`⏭️ ${plate}: all media synced, skipping`)
        processedCount++
        continue
      }

      const modelName = folder.name.trim().substring(plate.length).trim()
      const sanitizedModel = sanitizeName(modelName || 'veiculo')
      const newUrls: string[] = []
      let videoUrl: string | null = null

      if (!hasAllPhotos) {
        const sorted = [...allImages].sort((a, b) => a.name.localeCompare(b.name))
        const diff = allImages.length - existingCount
        const toProcess = sorted.slice(-diff)
        console.log(
          `🎯 ${toProcess.length} new images to process (Drive=${allImages.length}, DB=${existingCount})`,
        )

        for (const file of toProcess) {
          try {
            const fileName = file.name.replace(/\s+/g, '_')
            const storageKey = `media/${plate}_${sanitizedModel}/${fileName}`
            const publicUrl = `${R2_PUBLIC_BASE}/${storageKey}`
            console.log(`⬇️ ${file.name}`)
            const { blob, mimeType } = await downloadDriveFile(accessToken, file.id)
            console.log(`⬆️ ${storageKey}`)
            await uploadToR2(storageKey, blob, mimeType)
            newUrls.push(publicUrl)
            totalSynced++
          } catch (e) {
            console.error(`❌ ${file.name}: ${safeError(e)}`)
          }
        }
      }

      if (!hasVideo && allVideos.length > 0) {
        for (const video of allVideos) {
          try {
            const fileName = video.name.replace(/\s+/g, '_')
            const storageKey = `media/${plate}_${sanitizedModel}/${fileName}`
            const publicUrl = `${R2_PUBLIC_BASE}/${storageKey}`
            console.log(`⬇️ Video: ${video.name}`)
            const { blob, mimeType } = await downloadDriveFile(accessToken, video.id)
            console.log(`⬆️ ${storageKey}`)
            await uploadToR2(storageKey, blob, mimeType || 'video/mp4')
            videoUrl = publicUrl
            totalSynced++
            break
          } catch (e) {
            console.error(`❌ Video ${video.name}: ${safeError(e)}`)
          }
        }
      }

      let qrCodeUrl: string | null = null
      if (!hasQrCode && vehicleSlug) {
        try {
          const vehicleUrl = `${SITE_BASE_URL}/estoque/${vehicleSlug}`
          const qrKey = `media/${plate}_${sanitizedModel}/qrcode.png`
          qrCodeUrl = `${R2_PUBLIC_BASE}/${qrKey}`
          console.log(`🔢 Generating QR code for ${vehicleUrl}`)
          const qrBlob = await generateQrCodeBlob(vehicleUrl)
          await uploadToR2(qrKey, qrBlob, 'image/png')
          totalSynced++
        } catch (e) {
          console.error(`❌ QR Code: ${safeError(e)}`)
        }
      }

      let currentFotos: string[] = []
      if (newUrls.length > 0) {
        try {
          const r = await supabase.from('veiculos').select('fotos').eq('id', vehicleId).single()
          if (r.data && Array.isArray(r.data.fotos)) currentFotos = r.data.fotos as string[]
        } catch {
          currentFotos = []
        }
      }
      const updated = [...currentFotos, ...newUrls]

      const updateData: any = { updated_at: new Date().toISOString() }
      if (newUrls.length > 0) updateData.fotos = updated
      if (videoUrl) updateData.video_url = videoUrl
      if (qrCodeUrl) updateData.qrcode_url = qrCodeUrl

      console.log(
        `💾 DB UPDATE START - veiculo_id: ${vehicleId}, plate: ${plate}, fotos: ${updateData.fotos ? updated.length + ' URLs' : 'no change'}, video_url: ${updateData.video_url || 'no change'}, qrcode_url: ${updateData.qrcode_url || 'no change'}`,
      )

      try {
        const r = await supabase.from('veiculos').update(updateData).eq('id', vehicleId)
        if (r.error) {
          console.error(
            `❌ DB UPDATE FAILED - veiculo_id: ${vehicleId}, error: ${safeError(r.error)}`,
          )
          await logError(supabase, vehicleId, `DB update failed: ${safeError(r.error)}`, {
            plate,
            fotos_count: updated.length,
            video_url: videoUrl,
            qrcode_url: qrCodeUrl,
          })
        } else {
          vehiclesUpdated++
          console.log(
            `✅ DB UPDATE SUCCESS - veiculo_id: ${vehicleId}, fotos_count: ${updated.length}, video_url: ${videoUrl || 'no change'}, qrcode_url: ${qrCodeUrl || 'no change'}`,
          )
        }
      } catch (e) {
        console.error(`❌ DB UPDATE THREW - veiculo_id: ${vehicleId}, error: ${safeError(e)}`)
        await logError(supabase, vehicleId, `DB update threw: ${safeError(e)}`, {
          plate,
          fotos_count: updated.length,
          video_url: videoUrl,
          qrcode_url: qrCodeUrl,
        })
      }

      processedCount++
    }

    const newOffset = offset + processedCount
    await saveOffset(supabase, newOffset)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const remainingFolders = Math.max(0, allFolders.length - newOffset)
    const result = {
      success: true,
      totalMediaSynced: totalSynced,
      vehiclesUpdated,
      offset: newOffset,
      remaining: remainingFolders,
      elapsedSeconds: `${elapsed}s`,
      stoppedEarly: processedCount < batch.length,
    }
    console.log(`✅ Complete: ${JSON.stringify(result)}`)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown')
    if (err instanceof Error && err.stack) console.error(`📊 Stack: ${err.stack}`)
    console.error(`❌ FATAL: ${msg}`)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
