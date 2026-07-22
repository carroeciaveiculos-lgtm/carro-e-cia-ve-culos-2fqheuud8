import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3'
import { corsHeaders } from '../_shared/cors.ts'
import { getAccessToken, listDriveItems, downloadDriveFile } from '../_shared/google-drive.ts'

const ROOT_FOLDER_ID = '1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY'
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'
const BATCH_SIZE = 1
const SYNC_CONTROL_KEY = 'drive_offset'
const MAX_RETRIES = 3
const TIME_BUFFER_MS = 30000

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
  if (err instanceof Error) {
    return `[${err.name}] ${err.message}${err.cause ? ' | cause: ' + String(err.cause) : ''}`
  }
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err ?? 'Erro desconhecido')
  }
}

function normalizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '_')
    .replace(/\(\d+\)/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

function urlExistsInDb(existingUrls: string[], normalizedCandidate: string): boolean {
  return existingUrls.some((url) => {
    const urlNormalized =
      url
        .split('/')
        .pop()
        ?.toLowerCase()
        .replace(/\(\d+\)/g, '') ?? ''
    return urlNormalized === normalizedCandidate
  })
}

function dedupUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  return urls.filter((url) => {
    const key = url.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function uploadToR2(key: string, blob: Blob, contentType: string): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const buffer = await blob.arrayBuffer()
      await s3Client.send(
        new PutObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens',
          Key: key,
          Body: new Uint8Array(buffer),
          ContentType: contentType,
        }),
      )
      return
    } catch (e) {
      lastError = e
      if (attempt < MAX_RETRIES) {
        const wait = 2000 * attempt
        console.warn(
          `⚠️ Upload retry ${attempt}/${MAX_RETRIES}: ${safeError(e)}. Aguardando ${wait}ms...`,
        )
        await new Promise((resolve) => setTimeout(resolve, wait))
      }
    }
  }
  throw lastError
}

async function downloadWithRetry(
  accessToken: string,
  fileId: string,
): Promise<{ blob: Blob; mimeType: string }> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await downloadDriveFile(accessToken, fileId)
    } catch (e) {
      lastError = e
      if (attempt < MAX_RETRIES) {
        const wait = 2000 * attempt
        console.warn(
          `⚠️ Download retry ${attempt}/${MAX_RETRIES}: ${safeError(e)}. Aguardando ${wait}ms...`,
        )
        await new Promise((resolve) => setTimeout(resolve, wait))
      }
    }
  }
  throw lastError
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

async function processVehicle(
  supabase: any,
  accessToken: string,
  folder: any,
  startTime: number,
): Promise<{ synced: number; updated: boolean }> {
  const plate = extractPlate(folder.name)
  if (!plate) {
    console.log(`⚠️ No plate: "${folder.name}"`)
    return { synced: 0, updated: false }
  }

  console.log(`🔍 Processing ${plate}`)

  let vehicle: any
  try {
    const res = await supabase.from('veiculos').select('id, fotos').eq('placa', plate).maybeSingle()
    if (res.error) {
      console.error(`❌ Query error: ${safeError(res.error)}`)
      return { synced: 0, updated: false }
    }
    vehicle = res.data
  } catch (e) {
    console.error(`❌ Query threw: ${safeError(e)}`)
    return { synced: 0, updated: false }
  }

  if (!vehicle) {
    console.log(`❌ Veículo não encontrado: ${plate}`)
    return { synced: 0, updated: false }
  }

  const existingFotos = Array.isArray(vehicle.fotos) ? dedupUrls(vehicle.fotos as string[]) : []
  console.log(`📸 ${plate}: ${existingFotos.length} fotos no DB (após dedup)`)

  let allImages: any[] = []
  try {
    const files = await listDriveItems(accessToken, folder.id, false)
    allImages = files.filter((f: any) => f.mimeType?.startsWith('image/'))
  } catch (e) {
    console.error(`❌ Drive list: ${safeError(e)}`)
    return { synced: 0, updated: false }
  }

  console.log(`📸 ${allImages.length} images in Drive`)

  if (existingFotos.length >= allImages.length) {
    console.log(`⏭️ ${plate}: ${existingFotos.length} ≥ ${allImages.length} — pulando`)
    return { synced: 0, updated: false }
  }

  const newImages = allImages.filter((file) => {
    const normalized = normalizeFileName(file.name)
    return !urlExistsInDb(existingFotos, normalized)
  })

  if (newImages.length === 0) {
    console.log(`⏭️ Nenhuma imagem nova para ${plate}`)
    return { synced: 0, updated: false }
  }

  console.log(`🎯 ${newImages.length} imagens NOVAS (de ${allImages.length} no Drive)`)

  const modelName = folder.name.trim().substring(plate.length).trim()
  const sanitizedModel = sanitizeName(modelName || 'veiculo')

  const processedUrls = new Set<string>()
  const newUrls: string[] = []
  let totalSynced = 0

  for (const file of newImages) {
    const elapsed2 = Date.now() - startTime
    const remaining2 = 120000 - elapsed2
    if (remaining2 < TIME_BUFFER_MS) {
      console.log(`⏰ Tempo baixo (${remaining2}ms), interrompendo downloads para ${plate}`)
      break
    }

    try {
      const fileName = file.name.replace(/\s+/g, '_')
      const storageKey = `media/${plate}_${sanitizedModel}/${fileName}`
      const publicUrl = `${R2_PUBLIC_BASE}/${storageKey}`

      if (processedUrls.has(publicUrl)) {
        console.log(`⏭️ Duplicata no batch: ${fileName}`)
        continue
      }

      console.log(`⬇️ ${file.name}`)
      const { blob, mimeType } = await downloadWithRetry(accessToken, file.id)

      console.log(`⬆️ ${storageKey}`)
      await uploadToR2(storageKey, blob, mimeType)

      processedUrls.add(publicUrl)
      newUrls.push(publicUrl)
      totalSynced++
    } catch (e) {
      console.error(`❌ ${file.name}: ${safeError(e)}`)
    }
  }

  if (newUrls.length > 0) {
    const combined = [...existingFotos, ...newUrls]
    const finalUrls = dedupUrls(combined)

    console.log(`💾 ${plate}: ${existingFotos.length} → ${finalUrls.length} fotos`)

    try {
      const r = await supabase
        .from('veiculos')
        .update({
          fotos: finalUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicle.id)

      if (r.error) {
        console.error(`❌ DB update error: ${safeError(r.error)}`)
      } else {
        console.log(`✅ ${plate}: +${newUrls.length} fotos (dedup aplicado)`)
        return { synced: totalSynced, updated: true }
      }
    } catch (e) {
      console.error(`❌ DB update threw: ${safeError(e)}`)
    }
  } else {
    console.log(`⏭️ Nenhuma foto nova processada para ${plate}`)
  }

  return { synced: totalSynced, updated: false }
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientEmail = Deno.env.get('DRIVE_CLIENT_EMAIL')
    const privateKey = (Deno.env.get('DRIVE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
    if (!clientEmail || !privateKey || !Deno.env.get('DRIVE_PROJECT_ID')) {
      return new Response(JSON.stringify({ error: 'Google Drive credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let payloadOffset: number | undefined,
      payloadLimit: number | undefined,
      payloadPlaca: string | undefined
    try {
      const body = await req.json()
      if (body && typeof body === 'object') {
        payloadOffset = body.offset
        payloadLimit = body.limit
        payloadPlaca = body.placa
      }
    } catch {}

    console.log('🔑 Authenticating...')
    const accessToken = await getAccessToken(clientEmail, privateKey)
    console.log('✅ Drive auth OK')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ─── PLACA-SPECIFIC SYNC ───
    if (payloadPlaca) {
      const targetPlate = payloadPlaca.toUpperCase().replace(/[^A-Z0-9]/g, '')
      console.log(`🎯 Plate-specific sync: ${targetPlate}`)

      const allFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
      const matchingFolder = allFolders.find((f: any) => {
        const folderPlate = extractPlate(f.name)
        return folderPlate === targetPlate
      })

      if (!matchingFolder) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Nenhuma pasta encontrada no Drive para a placa: ${targetPlate}`,
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      console.log(`📂 Found folder: "${matchingFolder.name}"`)
      const result = await processVehicle(supabase, accessToken, matchingFolder, startTime)

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const response = {
        success: true,
        totalPhotosSynced: result.synced,
        vehiclesUpdated: result.updated ? 1 : 0,
        placa: targetPlate,
        elapsedSeconds: `${elapsed}s`,
      }
      console.log(`✅ Plate sync complete: ${JSON.stringify(response)}`)

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── BATCH SYNC ───
    const limit = payloadLimit ?? BATCH_SIZE
    const offset = payloadOffset ?? (await getOffset(supabase))
    console.log(`📋 Batch mode: limit=${limit}, offset=${offset}`)

    const allFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
    console.log(`📂 ${allFolders.length} folders`)

    const batch = allFolders.slice(offset, offset + limit)
    console.log(`🔄 ${batch.length} folders (offset=${offset})`)

    let totalSynced = 0
    let vehiclesUpdated = 0

    for (const [idx, folder] of batch.entries()) {
      const elapsed = Date.now() - startTime
      const remaining = 120000 - elapsed
      if (remaining < TIME_BUFFER_MS) {
        console.log(
          `⏰ Remaining time: ${remaining}ms < ${TIME_BUFFER_MS}ms, stopping early at vehicle ${idx + 1}`,
        )
        break
      }

      const result = await processVehicle(supabase, accessToken, folder, startTime)
      totalSynced += result.synced
      if (result.updated) vehiclesUpdated++
    }

    const newOffset = offset + batch.length
    await saveOffset(supabase, newOffset)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const remaining = Math.max(0, allFolders.length - newOffset)
    const result = {
      success: true,
      totalPhotosSynced: totalSynced,
      vehiclesUpdated,
      offset: newOffset,
      remaining,
      elapsedSeconds: `${elapsed}s`,
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
