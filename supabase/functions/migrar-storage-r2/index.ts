import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getR2PublicUrl,
  checkR2FileExists,
  uploadToR2,
  getR2Bucket,
} from '../_shared/r2-storage.ts'

const SUPABASE_OLD_BASE = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/'
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png']
const BATCH_SIZE = 50

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'Invalid token' }, 401)

    const body = await req.json().catch(() => ({}))
    const action = body.action || 'migrate'
    const bucket = body.bucket || 'veiculos-fotos'
    const limit = action === 'test' ? Math.min(body.limit || 10, 10) : BATCH_SIZE

    if (action === 'test') {
      return await runMigration(supabase, bucket, limit, false)
    }
    if (action === 'migrate') {
      return await runMigration(supabase, bucket, limit, true)
    }
    if (action === 'update_urls') {
      return await updateVehicleUrls(supabase)
    }
    if (action === 'cleanup') {
      return await cleanupStorage(supabase, body.bucket || 'all')
    }
    return json({ error: 'Unknown action. Use: test, migrate, update_urls, cleanup' }, 400)
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})

async function listAllFiles(
  supabase: any,
  bucket: string,
  prefix = '',
  limit: number,
): Promise<any[]> {
  const allFiles: any[] = []
  let offset = 0
  while (allFiles.length < limit) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: Math.min(1000, limit - allFiles.length),
      offset,
    })
    if (error || !data) break
    if (data.length === 0) break
    for (const item of data) {
      if (item.name.endsWith('/')) {
        const subFiles = await listAllFiles(
          supabase,
          bucket,
          prefix ? `${prefix}/${item.name}` : item.name,
          limit - allFiles.length,
        )
        allFiles.push(...subFiles)
        if (allFiles.length >= limit) break
      } else {
        allFiles.push({ ...item, fullPath: prefix ? `${prefix}/${item.name}` : item.name })
      }
    }
    offset += data.length
    if (data.length < 1000) break
  }
  return allFiles.slice(0, limit)
}

async function runMigration(supabase: any, bucket: string, limit: number, includeAll: boolean) {
  const files = await listAllFiles(supabase, bucket, '', limit)
  const results: any[] = []

  for (const file of files) {
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
    if (!includeAll && !IMAGE_EXTS.includes(ext)) continue

    const r2Key = `${bucket}/${file.fullPath}`
    try {
      const exists = await checkR2FileExists(r2Key)
      if (exists) {
        await logMigration(supabase, file.fullPath, bucket, 'skipped', null)
        results.push({ file: file.fullPath, status: 'skipped' })
        continue
      }
      const { data: blob, error: dlError } = await supabase.storage
        .from(bucket)
        .download(file.fullPath)
      if (dlError || !blob) throw new Error(`Download failed: ${dlError?.message}`)
      const contentType = file.metadata?.mimetype || 'application/octet-stream'
      await uploadToR2(r2Key, blob, contentType)
      await logMigration(supabase, file.fullPath, bucket, 'success', null)
      results.push({ file: file.fullPath, status: 'success' })
    } catch (err: any) {
      await logMigration(supabase, file.fullPath, bucket, 'error', err.message)
      results.push({ file: file.fullPath, status: 'error', error: err.message })
    }
  }

  return json({ bucket, processed: results.length, results })
}

async function updateVehicleUrls(supabase: any) {
  let updated = 0
  const { data: vehicles } = await supabase
    .from('veiculos')
    .select('id, fotos')
    .not('fotos', 'is', null)

  if (!vehicles) return json({ updated: 0 })

  for (const v of vehicles) {
    if (!Array.isArray(v.fotos)) continue
    let changed = false
    const newFotos = v.fotos.map((url: any) => {
      if (typeof url === 'string' && url.includes(SUPABASE_OLD_BASE)) {
        changed = true
        return url.replace(SUPABASE_OLD_BASE, 'https://imagens.carroeciamotors.com.br/')
      }
      if (typeof url === 'object' && url?.url?.includes(SUPABASE_OLD_BASE)) {
        changed = true
        return {
          ...url,
          url: url.url.replace(SUPABASE_OLD_BASE, 'https://imagens.carroeciamotors.com.br/'),
        }
      }
      return url
    })
    if (changed) {
      await supabase
        .from('veiculos')
        .update({ fotos: newFotos, updated_at: new Date().toISOString() })
        .eq('id', v.id)
      updated++
    }
  }
  return json({ updated, total: vehicles.length })
}

async function cleanupStorage(supabase: any, bucketFilter: string) {
  const buckets = bucketFilter === 'all' ? ['veiculos-fotos', 'media'] : [bucketFilter]
  const deleted: string[] = []

  for (const bucket of buckets) {
    const files = await listAllFiles(supabase, bucket, '', 1000)
    const toDelete = files.filter((f) =>
      IMAGE_EXTS.includes(f.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''),
    )
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50).map((f) => f.fullPath)
      const { error } = await supabase.storage.from(bucket).remove(batch)
      if (!error) {
        deleted.push(...batch)
        for (const path of batch) {
          await logMigration(supabase, path, bucket, 'deleted', null)
        }
      }
    }
  }
  return json({ deleted: deleted.length, files: deleted.slice(0, 50) })
}

async function logMigration(
  supabase: any,
  filePath: string,
  bucket: string,
  status: string,
  error: string | null,
) {
  await supabase.from('r2_migration_log').insert({
    file_path: filePath,
    bucket,
    status,
    error_message: error,
  })
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
