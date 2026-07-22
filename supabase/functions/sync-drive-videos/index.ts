import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3'
import { Readable } from 'node:stream'
import { corsHeaders } from '../_shared/cors.ts'
import { getAccessToken, listDriveItems } from '../_shared/google-drive.ts'

const ROOT_FOLDER_ID = '1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY'
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'
const BATCH_SIZE = 1
const SYNC_CONTROL_KEY = 'drive_video_offset'
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

async function* streamToAsyncIterator(
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<Uint8Array> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

async function streamUploadToR2(
  key: string,
  webStream: ReadableStream<Uint8Array>,
  contentType: string,
  contentLength: number,
): Promise<void> {
  const nodeStream = Readable.from(streamToAsyncIterator(webStream))
  const params: any = {
    Bucket: Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens',
    Key: key,
    Body: nodeStream,
    ContentType: contentType,
  }
  if (contentLength > 0) {
    params.ContentLength = contentLength
  }
  await s3Client.send(new PutObjectCommand(params))
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
    await supabase
      .from('sync_control')
      .upsert({
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
    await supabase
      .from('logs_integracao')
      .insert({
        veiculo_id: veiculoId,
        portal: 'google-drive-videos',
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

    let payloadOffset: number | undefined
    try {
      const body = await req.json()
      if (body && typeof body === 'object') {
        payloadOffset = body.offset
      }
    } catch {}

    console.log('🔑 Authenticating...')
    const accessToken = await getAccessToken(clientEmail, privateKey)
    console.log('✅ Drive auth OK')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const offset = payloadOffset ?? (await getOffset(supabase))
    console.log(`📋 offset=${offset}, batch_size=${BATCH_SIZE}`)

    const allFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
    console.log(`📂 ${allFolders.length} folders`)

    const batch = allFolders.slice(offset, offset + BATCH_SIZE)
    console.log(`🔄 ${batch.length} folders (offset=${offset})`)

    let totalSynced = 0
    let vehiclesUpdated = 0
    let processedCount = 0

    for (const [idx, folder] of batch.entries()) {
      const remaining = MAX_EXECUTION_MS - (Date.now() - startTime)
      if (remaining < 30000) {
        console.log(`⏰ Remaining time: ${remaining}ms, stopping early`)
        break
      }

      const plate = extractPlate(folder.name)
      if (!plate) {
        console.log(`⚠️ No plate: "${folder.name}"`)
        processedCount++
        continue
      }
      console.log(`🔍 [${idx + 1}] ${plate}`)

      let vehicleId: string | null = null
      let existingVideos: string[] = []

      try {
        const res = await supabase
          .from('veiculos')
          .select('id, videos')
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
          existingVideos = Array.isArray(res.data.videos)
            ? (res.data.videos as string[])
            : []
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
        processedCount++
        continue
      }
      console.log(`🎥 ${plate}: ${existingVideos.length} existing videos`)

      let videoFiles: any[] = []
      try {
        const files = await listDriveItems(accessToken, folder.id, false)
        videoFiles = files.filter(
          (f: any) =>
            f.mimeType?.startsWith('video/') || f.name?.toLowerCase().endsWith('.mp4'),
        )
      } catch (e) {
        console.error(`❌ Drive list: ${safeError(e)}`)
        await logError(supabase, vehicleId, `Drive list error`, {
          plate,
          error: safeError(e),
        })
        processedCount++
        continue
      }

      console.log(`🎥 ${videoFiles.length} videos in Drive for ${plate}`)

      if (videoFiles.length === 0) {
        console.log(`⏭️ ${plate}: no videos`)
        processedCount++
        continue
      }

      const modelName = folder.name.trim().substring(plate.length).trim()
      const sanitizedModel = sanitizeName(modelName || 'veiculo')
      const newVideoUrls: string[] = []

      for (const file of videoFiles) {
        const fileName = file.name.replace(/\s+/g, '_')
        const storageKey = `media/${plate}_${sanitizedModel}/${fileName}`
        const publicUrl = `${R2_PUBLIC_BASE}/${storageKey}`

        if (existingVideos.includes(publicUrl)) {
          console.log(`⏭️ Already synced: ${file.name}`)
          continue
        }

        try {
          console.log(`⬇️ Streaming video: ${file.name}`)
          const downloadRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          )
          if (!downloadRes.ok || !downloadRes.body) {
            const errText = await downloadRes.text()
            throw new Error(`Download failed: ${downloadRes.status} ${errText}`)
          }

          const contentType = downloadRes.headers.get('content-type') || 'video/mp4'
          const contentLength = parseInt(
            downloadRes.headers.get('content-length') || '0',
          )

          console.log(`⬆️ Streaming to R2: ${storageKey}`)
          await streamUploadToR2(
            storageKey,
            downloadRes.body,
            contentType,
            contentLength,
          )

          newVideoUrls.push(publicUrl)
          totalSynced++
          console.log(`✅ Uploaded: ${file.name}`)
        } catch (e) {
          console.error(`❌ ${file.name}: ${safeError(e)}`)
          await logError(supabase, vehicleId, `Video upload failed: ${safeError(e)}`, {
            plate,
            file: file.name,
            error: safeError(e),
          })
        }
      }

      if (newVideoUrls.length > 0) {
        const updatedVideos = [...existingVideos, ...newVideoUrls]
        try {
          const r = await supabase
            .from('veiculos')
            .update({
              videos: updatedVideos,
              updated_at: new Date().toISOString(),
            })
            .eq('id', vehicleId)
          if (r.error) {
            console.error(`❌ DB update failed: ${safeError(r.error)}`)
            await logError(
              supabase,
              vehicleId,
              `DB update failed: ${safeError(r.error)}`,
              { plate, videos_count: updatedVideos.length },
            )
          } else {
            vehiclesUpdated++
            console.log(
              `✅ DB updated: ${vehicleId}, videos: ${updatedVideos.length}`,
            )
          }
        } catch (e) {
          console.error(`❌ DB update threw: ${safeError(e)}`)
          await logError(supabase, vehicleId, `DB update threw: ${safeError(e)}`, {
            plate,
            videos_count: updatedVideos.length,
          })
        }
      }

      processedCount++
    }

    const newOffset = offset + processedCount
    await saveOffset(supabase, newOffset)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const remainingFolders = Math.max(0, allFolders.length - newOffset)
    const result = {
      success: true,
      totalVideosSynced: totalSynced,
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
