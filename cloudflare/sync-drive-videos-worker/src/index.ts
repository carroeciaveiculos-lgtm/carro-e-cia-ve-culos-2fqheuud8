import { getAccessToken, listDriveItems } from './google-drive'

// Pasta "02-Videos de Veiculos" no Drive, confirmada pela Adriana em 03/09/2026.
// Mesma pasta usada em supabase/functions/sync-drive-videos/index.ts — não é a
// pasta de fotos (essa fica em sync-google-drive/index.ts, não mexer).
const ROOT_FOLDER_ID = '1QKGIaPvoZLv-ifhxlaqzrirH38HAMRTo'
const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'
const BATCH_SIZE = 1
const SYNC_CONTROL_KEY = 'drive_video_offset'

export interface Env {
  BUCKET: R2Bucket
  DRIVE_CLIENT_EMAIL: string
  DRIVE_PRIVATE_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SYNC_WORKER_SECRET: string
}

function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
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

function restHeaders(env: Env, extra?: Record<string, string>) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function getVeiculoByPlaca(
  env: Env,
  placa: string,
): Promise<{ id: string; videos: string[] } | null> {
  const url = `${env.SUPABASE_URL}/rest/v1/veiculos?placa=eq.${encodeURIComponent(placa)}&select=id,videos`
  const res = await fetch(url, { headers: restHeaders(env) })
  if (!res.ok) throw new Error(`Query veiculos failed: ${res.status} ${await res.text()}`)
  const rows = (await res.json()) as any[]
  if (!rows.length) return null
  return { id: rows[0].id, videos: Array.isArray(rows[0].videos) ? rows[0].videos : [] }
}

async function updateVeiculoVideos(env: Env, id: string, videos: string[]): Promise<void> {
  const url = `${env.SUPABASE_URL}/rest/v1/veiculos?id=eq.${id}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: restHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify({ videos, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`Update veiculos failed: ${res.status} ${await res.text()}`)
}

async function getOffset(env: Env): Promise<number> {
  const url = `${env.SUPABASE_URL}/rest/v1/sync_control?sync_key=eq.${SYNC_CONTROL_KEY}&select=current_offset`
  const res = await fetch(url, { headers: restHeaders(env) })
  if (!res.ok) return 0
  const rows = (await res.json()) as any[]
  return rows[0]?.current_offset ?? 0
}

async function saveOffset(env: Env, offset: number): Promise<void> {
  const url = `${env.SUPABASE_URL}/rest/v1/sync_control?on_conflict=sync_key`
  await fetch(url, {
    method: 'POST',
    headers: restHeaders(env, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({
      sync_key: SYNC_CONTROL_KEY,
      current_offset: offset,
      updated_at: new Date().toISOString(),
    }),
  }).catch((e) => console.warn(`saveOffset falhou: ${safeError(e)}`))
}

async function logError(
  env: Env,
  veiculoId: string | null,
  error: string,
  payload: any,
): Promise<void> {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/logs_integracao`, {
      method: 'POST',
      headers: restHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        veiculo_id: veiculoId,
        portal: 'google-drive-videos',
        payload_erro: { error, ...payload },
        status: 'error',
      }),
    })
  } catch (e) {
    console.error(`Falha ao gravar log: ${safeError(e)}`)
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response('ok')

    if (req.headers.get('X-Sync-Secret') !== env.SYNC_WORKER_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }

    const startTime = Date.now()
    try {
      let payloadOffset: number | undefined
      let payloadPlaca: string | undefined
      try {
        const body = (await req.json()) as any
        if (body && typeof body === 'object') {
          payloadOffset = body.offset
          payloadPlaca = body.placa
        }
      } catch {}

      // Aceita a chave colada tanto com quebra de linha real quanto com "\n"
      // literal (formato comum ao copiar do JSON da conta de serviço) — mesma
      // normalização usada em supabase/functions/_shared do projeto.
      const privateKey = env.DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n')
      const accessToken = await getAccessToken(env.DRIVE_CLIENT_EMAIL, privateKey)
      const allFolders = await listDriveItems(accessToken, ROOT_FOLDER_ID, true)

      let batch: typeof allFolders
      let offset = payloadOffset ?? (await getOffset(env))

      if (payloadPlaca) {
        const target = allFolders.find((f) => extractPlate(f.name) === payloadPlaca)
        if (!target) {
          return new Response(JSON.stringify({ error: `Pasta não encontrada para ${payloadPlaca}` }), {
            status: 404,
          })
        }
        batch = [target]
      } else {
        batch = allFolders.slice(offset, offset + BATCH_SIZE)
      }

      let totalSynced = 0
      let vehiclesUpdated = 0
      let processedCount = 0

      for (const folder of batch) {
        const plate = extractPlate(folder.name)
        if (!plate) {
          processedCount++
          continue
        }

        let vehicleId: string | null = null
        let existingVideos: string[] = []
        try {
          const veiculo = await getVeiculoByPlaca(env, plate)
          if (!veiculo) {
            processedCount++
            continue
          }
          vehicleId = veiculo.id
          existingVideos = veiculo.videos
        } catch (e) {
          await logError(env, null, `Query threw for plate ${plate}`, { plate, error: safeError(e) })
          continue
        }

        let videoFiles: any[] = []
        try {
          const files = await listDriveItems(accessToken, folder.id, false)
          videoFiles = files.filter(
            (f: any) => f.mimeType?.startsWith('video/') || f.name?.toLowerCase().endsWith('.mp4'),
          )
        } catch (e) {
          await logError(env, vehicleId, 'Drive list error', { plate, error: safeError(e) })
          processedCount++
          continue
        }

        if (videoFiles.length === 0) {
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

          if (existingVideos.includes(publicUrl)) continue

          try {
            const downloadRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
              { headers: { Authorization: `Bearer ${accessToken}` } },
            )
            if (!downloadRes.ok || !downloadRes.body) {
              throw new Error(`Download failed: ${downloadRes.status} ${await downloadRes.text()}`)
            }
            const contentType = downloadRes.headers.get('content-type') || 'video/mp4'

            // put() aceita o ReadableStream direto — sem checksum pesado do
            // SDK da AWS, sem buffer em memória. É essa troca que resolve o
            // timeout de CPU que a Edge Function do Supabase tinha com vídeo
            // grande (limite de 2s de CPU lá; aqui são 5 minutos).
            await env.BUCKET.put(storageKey, downloadRes.body, {
              httpMetadata: { contentType },
            })

            newVideoUrls.push(publicUrl)
            totalSynced++
          } catch (e) {
            await logError(env, vehicleId, `Video upload failed: ${safeError(e)}`, {
              plate,
              file: file.name,
              error: safeError(e),
            })
          }
        }

        if (newVideoUrls.length > 0 && vehicleId) {
          try {
            await updateVeiculoVideos(env, vehicleId, [...existingVideos, ...newVideoUrls])
            vehiclesUpdated++
          } catch (e) {
            await logError(env, vehicleId, `DB update failed: ${safeError(e)}`, {
              plate,
              videos_count: existingVideos.length + newVideoUrls.length,
            })
          }
        }

        processedCount++
      }

      const newOffset = payloadPlaca ? offset : offset + processedCount
      if (!payloadPlaca) await saveOffset(env, newOffset)

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const remainingFolders = Math.max(0, allFolders.length - newOffset)
      return new Response(
        JSON.stringify({
          success: true,
          totalVideosSynced: totalSynced,
          vehiclesUpdated,
          offset: newOffset,
          remaining: remainingFolders,
          elapsedSeconds: `${elapsed}s`,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown')
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
