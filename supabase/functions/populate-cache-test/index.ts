import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

type Payload = {
  path?: string
}

function mustGet(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Use POST', { status: 405 })
  }

  const body = (await req.json().catch(() => ({}))) as Payload

  const supabaseUrl = mustGet('SUPABASE_URL')
  const anonKey = mustGet('SUPABASE_ANON_KEY')
  const password = mustGet('LGA_SUPABASE_PASSWORD')

  const email = 'lgacomerciodeveiculos@gmail.com'
  const path = body.path ?? 'cache/populate'

  const supabase = createClient(supabaseUrl, anonKey)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return new Response(JSON.stringify({ step: 'signInWithPassword', error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const token = data.session?.access_token
  if (!token) {
    return new Response(JSON.stringify({ error: 'Sem access_token na sessão' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const invokeUrl = `${supabaseUrl}/functions/v1/admin-plataformas-api`

  const res = await fetch(invokeUrl, {
    method: 'POST',
    headers: {
      // envia em dois formatos só para garantir que o app que valida a request
      // esteja procurando exatamente um deles
      Authorization: `Bearer ${token}`,
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  })

  const responseText = await res.text()
  let responseJson: unknown = null
  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = responseText
  }

  return new Response(
    JSON.stringify({
      step: 'invoke admin-plataformas-api',
      status: res.status,
      tokenPreview: `${token.slice(0, 10)}...${token.slice(-6)}`,
      response: responseJson,
    }),
    { status: res.status, headers: { 'Content-Type': 'application/json' } },
  )
})
