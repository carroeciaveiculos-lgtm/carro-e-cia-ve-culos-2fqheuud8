import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createSupabaseClient,
  fetchAndStoreMarcas,
  fetchAndStoreModelos,
  fetchAndStoreCores,
} from '../_shared/wm-catalogue.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action }: { action: string } = await req.json()
    const supabase = createSupabaseClient()

    const results: Record<string, number> = {}

    if (action === 'sync_all' || action === 'sync_marcas') {
      results.marcas = await fetchAndStoreMarcas(supabase)
    }
    if (action === 'sync_all' || action === 'sync_modelos') {
      results.modelos = await fetchAndStoreModelos(supabase)
    }
    if (action === 'sync_all' || action === 'sync_cores') {
      results.cores = await fetchAndStoreCores(supabase)
    }

    await (supabase as any).from('autonomia_log').insert({
      action: 'wm_catalogue_sync',
      details: { action, results },
      result: 'success',
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Catálogo Webmotors sincronizado', results }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || 'Erro ao sincronizar catálogo WM',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
