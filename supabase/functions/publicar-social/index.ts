import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const token = Deno.env.get('META_PAGE_ACCESS_TOKEN')
    const pageId = Deno.env.get('FACEBOOK_PAGE_ID')
    const igId = Deno.env.get('INSTAGRAM_BUSINESS_ID')

    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'Agendado')
      .lte('data_agendamento', new Date().toISOString())

    if (error) throw error

    let processed = 0

    for (const post of posts || []) {
      const redes = typeof post.redes === 'string' ? JSON.parse(post.redes) : post.redes
      let isSuccess = false
      let fbError = null
      
      if (redes.facebook && pageId && token && post.imagem) {
         const fbRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             access_token: token,
             url: post.imagem,
             message: post.texto
           })
         })
         const fbData = await fbRes.json()
         if (fbRes.ok) isSuccess = true
         else fbError = fbData
      }

      if (redes.instagram && igId && token && post.imagem) {
         const isVideo = post.imagem.match(/\.(mp4|mov|webm)$/i)
         const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             access_token: token,
             [isVideo ? 'video_url' : 'image_url']: post.imagem,
             caption: post.texto,
             media_type: isVideo ? 'REELS' : 'IMAGE'
           })
         })
         const containerData = await containerRes.json()
         
         if (containerData.id) {
           const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igId}/media_publish`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               access_token: token,
               creation_id: containerData.id
             })
           })
           if (publishRes.ok) isSuccess = true
         }
      }

      const newStatus = isSuccess ? 'Publicado' : 'Erro'
      await supabase.from('social_posts').update({ status: newStatus }).eq('id', post.id)

      await supabase.from('logs_integracao').insert({
        portal: 'meta_social',
        status: newStatus,
        payload_erro: isSuccess ? null : fbError,
        veiculo_id: post.veiculo_id || null,
      })

      processed++
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
