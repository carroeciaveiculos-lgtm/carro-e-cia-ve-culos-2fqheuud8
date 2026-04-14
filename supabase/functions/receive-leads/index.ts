import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json()
    const { nome, telefone, email, carro_modelo, carro_ano, carro_placa, origem, tipo } = body

    // Sanitize
    const cleanNome = nome?.trim()
    const cleanTelefone = telefone?.replace(/\D/g, '')

    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: cleanNome || 'Sem Nome',
        telefone: cleanTelefone,
        email: email?.trim() || null,
        carro_modelo: carro_modelo?.trim() || null,
        carro_ano: carro_ano?.trim() || null,
        carro_placa: carro_placa?.trim() || null,
        origem: origem || 'Site - Genérico',
        tipo: tipo || 'vendedor',
        status: 'novo', // Pendente
        temperatura: 'quente',
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
