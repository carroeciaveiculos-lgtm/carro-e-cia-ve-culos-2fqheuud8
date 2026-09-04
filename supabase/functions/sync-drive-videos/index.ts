import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Corrigido 03/09/2026: esta function fazia download do Drive + upload pro
// R2 diretamente, mas a Supabase Edge Function tem só 2s de CPU por chamada
// (https://supabase.com/docs/guides/functions/limits) — o cálculo de
// checksum do SDK da AWS num vídeo grande (~99MB) estourava esse limite e a
// function morria sem logar nada. Agora ela só autentica o pedido e repassa
// pro Worker (cloudflare/sync-drive-videos-worker), que tem 5 min de CPU e
// sobe pro R2 via binding nativo (sem SDK, sem checksum pesado). O contrato
// com o front (supabase.functions.invoke('sync-drive-videos', {...})) não
// muda.
const WORKER_URL = 'https://sync-drive-videos-worker.lgacomerciodeveiculos.workers.dev'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.text()
    const workerRes = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': Deno.env.get('SYNC_WORKER_SECRET') ?? '',
      },
      body,
    })
    const result = await workerRes.text()
    return new Response(result, {
      status: workerRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown')
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
