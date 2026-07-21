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
const BATCH_SIZE = 1
const SYNC_CONTROL_KEY = 'drive_offset'
const MAX_RETRIES = 3

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
  return name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')
}

function extractPlate(folderName: string): string | null {
  const firstPart = folderName.trim().split(' ')[0]
  const plate = firstPart.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return plate.length >= 4 ? plate : null
}

function safeError(err: unknown): string {
  if (err instanceof Error) return `[${err.name}] ${err.message}`
  if (typeof err === 'string') return err
  try { return JSON.stringify(err) } catch { return String(err ?? 'Erro desconhecido') }
}

async function uploadToR2(key: string, blob: Blob, contentType: string): Promise<void> {
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

async function getOffset(supabase: any): Promise<number> {
  try {
    const { data } = await supabase.from('sync_control').select('current_offset').eq('sync_key', SYNC_CONTROL_KEY).maybeSingle()
    return data?.current_offset ?? 0
  } catch { return 0 }
}

async function saveOffset(supabase: any, offset: number): Promise<void> {
  try {
    await supabase.from('sync_control').upsert({ sync_key: SYNC_CONTROL_KEY, current_offset: offset, updated_at: new Date().toISOString() })
  } catch (e) { console.warn(`⚠️ saveOffset: ${safeError(e)}`) }
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientEmail = Deno.env.get('DRIVE_CLIENT_EMAIL')
    const privateKey = (Deno.env.get('DRIVE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
    if (!clientEmail || !privateKey || !Deno.env.get('DRIVE_PROJECT_ID')) {
      return new Response(JSON.stringify({ error: 'Drive credentials not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let payloadOffset: number | undefined, payloadLimit: number | undefined
    try { const body = await req.json(); if (body && typeof body === 'object') { payloadOffset = body.offset; payloadLimit = body.limit } } catch {}

    const limit = payloadLimit ?? BATCH_SIZE

    console.log('🔑 Authenticating...')
    const accessToken = await getAccessToken(clientEmail, privateKey)
    console.log('✅ Drive auth OK')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const offset = payloadOffset ?? (await getOffset(supabase))
    console.log(`📋 limit=${limit}, offset=${offset}`)

    const allFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)
    console.log(`📂 ${allFolders.length} folders`)

    const batch = allFolders.slice(offset, offset + limit)
    console.log(`🔄 ${batch.length} folders (offset=${offset})`)

    let totalSynced = 0, vehiclesUpdated = 0

    for (const [idx, folder] of batch.entries()) {
      const plate = extractPlate(folder.name)
      if (!plate) { console.log(`⚠️ No plate: "${folder.name}"`); continue }
      console.log(`🔍 [${idx + 1}] ${plate}`)

      let vehicle: any, existingCount = 0, vehicleId: string | null = null
      try {
        const res = await supabase.from('veiculos').select('id, fotos').eq('placa', plate).maybeSingle()
        if (res.error) { console.error(`❌ Query: ${safeError(res.error)}`); continue }
        if (res.data) {
          vehicleId = res.data.id
          existingCount = Array.isArray(res.data.fotos) ? (res.data.fotos as string[]).length : 0
        }
      } catch (e) { console.error(`❌ Query threw: ${safeError(e)}`); continue }

      if (!vehicleId) { console.log(`❌ Not found: ${plate}`); continue }
      console.log(`📸 ${plate}: ${existingCount} fotos no DB`)

      let allImages: any[] = []
      try {
        const files = await listDriveItems(accessToken, folder.id, false)
        allImages = files.filter((f: any) => f.mimeType?.startsWith('image/'))
      } catch (e) { console.error(`❌ Drive list: ${safeError(e)}`); continue }

      console.log(`📸 ${allImages.length} in Drive`)

      // 🛡️ Skip por contagem
      if (existingCount >= allImages.length) {
        console.log(`⏭️ ${plate}: ${existingCount} ≥ ${allImages.length} — pulando`)
        continue
      }

      // 🎯 Processar APENAS a diferença (últimos N arquivos, ordenados por nome)
      const sorted = [...allImages].sort((a, b) => a.name.localeCompare(b.name))
      const diff = allImages.length - existingCount
      const toProcess = sorted.slice(-diff)

      console.log(`🎯 ${toProcess.length} imagens para processar (diferença entre Drive=${allImages.length} e DB=${existingCount})`)

      const modelName = folder.name.trim().substring(plate.length).trim()
      const sanitizedModel = sanitizeName(modelName || 'veiculo')
      const newUrls: string[] = []

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

      if (newUrls.length > 0) {
        // 🔄 Buscar fotos atuais do banco (pode ter mudado desde o início)
        let currentFotos: string[] = []
        try {
          const r = await supabase.from('veiculos').select('fotos').eq('id', vehicleId).single()
          if (r.data && Array.isArray(r.data.fotos)) currentFotos = r.data.fotos as string[]
        } catch { currentFotos = [] }

        const updated = [...currentFotos, ...newUrls]
        console.log(`💾 ${plate}: ${currentFotos.length} → ${updated.length}`)

        try {
          const r = await supabase.from('veiculos').update({ fotos: updated, updated_at: new Date().toISOString() }).eq('id', vehicleId)
          if (r.error) console.error(`❌ DB update: ${safeError(r.error)}`)
          else { vehiclesUpdated++; console.log(`✅ ${plate}: +${newUrls.length}`) }
        } catch (e) { console.error(`❌ DB update threw: ${safeError(e)}`) }
      } else {
        console.log(`⏭️ Nenhuma foto nova para ${plate}`)
      }
    }

    const newOffset = offset + batch.length
    await saveOffset(supabase, newOffset)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const remaining = Math.max(0, allFolders.length - newOffset)
    const result = { success: true, totalPhotosSynced: totalSynced, vehiclesUpdated, offset: newOffset, remaining, elapsedSeconds: `${elapsed}s` }
    console.log(`✅ Complete: ${JSON.stringify(result)}`)
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown')
    if (err instanceof Error && err.stack) console.error(`📊 Stack: ${err.stack}`)
    console.error(`❌ FATAL: ${msg}`)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})