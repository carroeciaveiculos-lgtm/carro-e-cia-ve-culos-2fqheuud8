import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { prompt } = await req.json()
    if (!prompt) throw new Error('Prompt is required')

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Uma foto profissional para blog de loja de carros sobre: ${prompt}. Estilo realista, editorial, sem texto na imagem.`,
        n: 1,
        size: '1024x1024'
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'OpenAI error')

    const imageUrl = data.data[0].url
    if (!imageUrl) throw new Error('Nenhuma URL de imagem foi retornada pelo provedor')

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) throw new Error('Falha ao baixar a imagem gerada')
    
    const arrayBuffer = await imageRes.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `ia_generated_${Date.now()}.png`
    const { error: uploadError } = await supabaseService
      .storage
      .from('imagens')
      .upload(fileName, bytes, { contentType: 'image/png' })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabaseService.storage.from('imagens').getPublicUrl(fileName)

    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: 'gerar_imagem',
      provider: 'openai',
      modelo: 'dall-e-3',
      status: 'sucesso'
    })

    return new Response(JSON.stringify({ success: true, url: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders })
  }
})
