import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const { action, commentId, message } = await req.json()
  const pageToken = Deno.env.get('META_PAGE_ACCESS_TOKEN')!
  
  let url = ''
  let reqBody: any = {}

  if (action === 'like') {
    url = `https://graph.facebook.com/v20.0/${commentId}/likes`
  } else if (action === 'reply') {
    url = `https://graph.facebook.com/v20.0/${commentId}/comments`
    reqBody = { message }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' },
    body: Object.keys(reqBody).length ? JSON.stringify(reqBody) : undefined
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
