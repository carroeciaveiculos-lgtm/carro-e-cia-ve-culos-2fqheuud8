import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { checkR2FileExists, uploadToR2 } from '../_shared/r2-storage.ts'

const BUCKETS = [
  'veiculos',
  'media',
  'site-assets',
  'brain_docs',
  'feeds',
  'documentos-veiculos',
  'imagens',
  'logos-e-imagens',
  'veiculos-videos',
  'veiculos-fotos',
]
const SUPABASE_BASE = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/'
const R2_BASE = 'https://imagens.carroeciamotors.com.br/'
const BATCH_SIZE = 25
const DELAY_MS = 200
const MAX_MS = 120_000

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const expected = Deno.env.get('AUTO_MIGRATE_SECRET')
  if (!secret || secret !== expected) return json({ error: 'Unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))
  const dryRun = Deno.env.get('DRY_RUN') === 'true' || body.dryRun === true
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const start = Date.now()
  const results: any[] = []

  for (const bucket of BUCKETS) {
    if (Date.now() - start > MAX_MS || results.length >= BATCH_SIZE) break

    const skip = await getMigrated(supabase, bucket)
    const files = await listFiles(supabase, bucket, '', BATCH_SIZE - results.length, skip)

    for (const file of files) {
      if (Date.now() - start > MAX_MS || results.length >= BATCH_SIZE) break

      const r2Key = `${bucket}/${file.fullPath}`
      await logProgress(supabase, bucket, file.fullPath, 'processing', null, true)

      try {
        if (!(await checkR2FileExists(r2Key))) {
          const { data: blob, error: dl } = await supabase.storage
            .from(bucket)
            .download(file.fullPath)
          if (dl || !blob) throw new Error(`Download: ${dl?.message}`)
          const ct = file.metadata?.mimetype || 'application/octet-stream'
          await uploadToR2(r2Key, blob, ct)
        }

        if (!(await checkR2FileExists(r2Key))) throw new Error('R2 verify failed')

        await supabase.rpc('replace_storage_url', { p_bucket: bucket, p_file_path: file.fullPath })

        if (!dryRun) {
          await supabase.storage.from(bucket).remove([file.fullPath])
        }

        const status = dryRun ? 'migrated_dry' : 'completed'
        await logProgress(supabase, bucket, file.fullPath, status, null, false)
        results.push({ file: file.fullPath, bucket, status })
      } catch (err: any) {
        await logProgress(supabase, bucket, file.fullPath, 'error', err.message, false)
        results.push({ file: file.fullPath, bucket, status: 'error', error: err.message })
      }

      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  return json({ processed: results.length, dryRun, elapsed: Date.now() - start, results })
})

async function getMigrated(supabase: any, bucket: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('r2_migration_progress')
    .select('file_path')
    .eq('bucket', bucket)
    .in('status', ['completed', 'migrated_dry'])
  return new Set((data || []).map((m: any) => m.file_path))
}

async function listFiles(
  supabase: any,
  bucket: string,
  prefix: string,
  limit: number,
  skip: Set<string>,
): Promise<any[]> {
  const files: any[] = []
  let offset = 0
  while (files.length < limit) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, offset })
    if (error || !data || data.length === 0) break
    for (const item of data) {
      const fp = prefix ? `${prefix}/${item.name}` : item.name
      if (item.name.endsWith('/')) {
        const sub = await listFiles(supabase, bucket, fp, limit - files.length, skip)
        files.push(...sub)
      } else if (!skip.has(fp)) {
        files.push({ name: item.name, fullPath: fp, metadata: item.metadata })
      }
      if (files.length >= limit) break
    }
    if (data.length < 100) break
    offset += data.length
  }
  return files.slice(0, limit)
}

async function logProgress(
  supabase: any,
  bucket: string,
  filePath: string,
  status: string,
  error: string | null,
  started: boolean,
) {
  const now = new Date().toISOString()
  await supabase.from('r2_migration_progress').upsert(
    {
      bucket,
      file_path: filePath,
      status,
      error_message: error,
      started_at: started ? now : undefined,
      completed_at: !started ? now : undefined,
    },
    { onConflict: 'bucket,file_path' },
  )
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
