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
const TIME_BUFFER_MS = 30000 // 30s de margem antes do timeout

const s3Client = new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('R2_ENDPOINT')!,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  },
  forcePathStyle: true,
})

// ─── Helpers ───

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')
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
  try { return JSON.stringify(err) } catch { return String(err ?? 'Erro desconhecido') }
}

/**
 * Normaliza nome de arquivo para comparação de dedup.
 * Remove espaços, parênteses com números (1), (2), etc.,
 * underscores duplicados e converte para minúsculas.
 */
function normalizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '_')
    .replace(/\(\d+\)/g, '')       // remove (1), (2), etc.
    .replace(/_+/g, '_')           // remove underscores duplicados
    .replace(/^_|_$/g, '')         // remove underscore inicial/final
    .toLowerCase()
}

/**
 * Verifica se um nome de arquivo normalizado já existe no array de URLs do DB.
 */
function urlExistsInDb(existingUrls: string[], normalizedCandidate: string): boolean {
  return existingUrls.some(url => {
    const urlNormalized = url.split('/').pop()?.toLowerCase().replace(/\(\d+\)/g, '') ?? ''
    return urlNormalized === normalizedCandidate
  })
}

/**
 * Remove URLs duplicadas de um array mantendo a ordem.
 */
function dedupUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  return urls.filter(url => {
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
        console.warn(`⚠️ Upload retry ${attempt}/${MAX_RETRIES}: ${safeError(e)}. Aguardando ${wait}ms...`)
        await new Promise(resolve => setTimeout(resolve, wait))
      }
    }
  }
  throw lastError
}

async function downloadWithRetry(accessToken: string, fileId: string): Promise<{ blob: Blob; mimeType: string }> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await downloadDriveFile(accessToken, fileId)
    } catch (e) {
      lastError = e
      if (attempt < MAX_RETRIES) {
        const wait = 2000 * attempt
        console.warn(`⚠️ Download retry ${attempt}/${MAX_RETRIES}: ${safeError(e)}. Aguardando ${wait}ms...`)
        await new Promise(resolve => setTimeout(resolve, wait))
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
  } catch { return 0 }
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

Deno.serve(async (req: Request) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const clientEmail = Deno.env.get('DRIVE_CLIENT_EMAIL')
    const privateKey = (Deno.env.get('DRIVE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
    if (!clientEmail || !privateKey || !Deno.env.get('DRIVE_PROJECT_ID')) {
      return new Response(
        JSON.stringify({ error: 'Google Drive credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
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

    let totalSynced = 0
    let vehiclesUpdated = 0

    for (const [idx, folder] of batch.entries()) {
      // ⏰ Verificar tempo restante antes de processar cada veículo
      const elapsed = Date.now() - startTime
      const remaining = 120000 - elapsed // Supabase Edge Function: ~2min
      if (remaining < TIME_BUFFER_MS) {
        console.log(`⏰ Remaining time: ${remaining}ms < ${TIME_BUFFER_MS}ms, stopping early at vehicle ${idx + 1}`)
        break
      }

      const plate = extractPlate(folder.name)
      if (!plate) { console.log(`⚠️ No plate: "${folder.name}"`); continue }

      console.log(`🔍 [${idx + 1}] ${plate}`)

      // ─── Buscar veículo no banco ───
      let vehicle: any
      try {
        const res = await supabase
          .from('veiculos')
          .select('id, fotos')
          .eq('placa', plate)
          .maybeSingle()
        if (res.error) { console.error(`❌ Query error: ${safeError(res.error)}`); continue }
        vehicle = res.data
      } catch (e) {
        console.error(`❌ Query threw: ${safeError(e)}`)
        continue
      }

      if (!vehicle) {
        console.log(`❌ Veículo não encontrado: ${plate}`)
        continue
      }

      // ─── Extrair URLs existentes e dedup ───
      const existingFotos = Array.isArray(vehicle.fotos)
        ? dedupUrls(vehicle.fotos as string[])
        : []
      console.log(`📸 ${plate}: ${existingFotos.length} fotos no DB (após dedup)`)

      // ─── Listar imagens do Drive ───
      let allImages: any[] = []
      try {
        const files = await listDriveItems(accessToken, folder.id, false)
        allImages = files.filter((f: any) => f.mimeType?.startsWith('image/'))
      } catch (e) {
        console.error(`❌ Drive list: ${safeError(e)}`)
        continue
      }

      console.log(`📸 ${allImages.length} images in Drive`)

      // ─── Skip por quantidade (já sincronizado) ───
      if (existingFotos.length >= allImages.length) {
        console.log(`⏭️ ${plate}: ${existingFotos.length} ≥ ${allImages.length} — pulando`)
        continue
      }

      // ─── Filtrar APENAS imagens realmente novas ───
      const newImages = allImages.filter(file => {
        const normalized = normalizeFileName(file.name)
        return !urlExistsInDb(existingFotos, normalized)
      })

      if (newImages.length === 0) {
        console.log(`⏭️ Nenhuma imagem nova para ${plate} (diferença de contagem pode ser arquivo duplicado no Drive)`)
        continue
      }

      console.log(`🎯 ${newImages.length} imagens NOVAS (de ${allImages.length} no Drive)`)

      const modelName = folder.name.trim().substring(plate.length).trim()
      const sanitizedModel = sanitizeName(modelName || 'veiculo')

      // 🛡️ Usar um Set para garantir que URLs processadas nesta execução
      // não sejam adicionadas duas vezes ao array final
      const processedUrls = new Set<string>()
      const newUrls: string[] = []

      for (const file of newImages) {
        // ⏰ Verificar tempo antes de cada download
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

          // 🛡️ Verificar se a URL já foi processada no batch atual
          if (processedUrls.has(publicUrl)) {
            console.log(`⏭️ Duplicata no batch: ${fileName}`)
            continue
          }

          console.log(`⬇️ ${file.name}`)
          const { blob, mimeType } = await downloadWithRetry(accessToken, file.id)

          console.log(`⬆️ ${storageKey}`)
          await uploadToR2(storageKey, blob, mimeType)

          // 🛡️ Adicionar ao Set de URLs processadas
          processedUrls.add(publicUrl)
          newUrls.push(publicUrl)
          totalSynced++
        } catch (e) {
          console.error(`❌ ${file.name}: ${safeError(e)}`)
        }
      }

      // ─── Atualizar banco com URLs deduplicadas ───
      if (newUrls.length > 0) {
        // 🛡️ Concatenar + dedup completo antes de salvar
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
            vehiclesUpdated++
            console.log(`✅ ${plate}: +${newUrls.length} fotos (dedup aplicado)`)
          }
        } catch (e) {
          console.error(`❌ DB update threw: ${safeError(e)}`)
        }
      } else {
        console.log(`⏭️ Nenhuma foto nova processada para ${plate}`)
      }
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