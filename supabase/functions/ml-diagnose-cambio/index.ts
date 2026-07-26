// Supabase Edge Function: ml-diagnose-cambio
// Diagnóstico: retorna valores únicos de cambio/cor/combustivel/direcao
// com normalização (trim/lower/unaccent) e sugestão de mapeamento.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function normalizeValue(input: unknown): string | null {
  if (input === null || input === undefined) return null
  let s = String(input)
  s = s.trim()
  if (!s) return null
  s = s.toLowerCase()
  s = s.replace(/\s+/g, ' ')
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  s = s.replace(/\uFEFF/g, '')
  return s
}

// ATENÇÃO: mapas são “sugestivos” para auditoria.
const ML_TRANSMISSION_MAP: Record<string, string> = {
  automatico: '\u0041\u0075\u0074\u006f\u006D\u00e1\u0074\u0069\u0063\u0061', // Automática
  automatica: '\u0041\u0075\u0074\u006f\u006D\u00e1\u0074\u0069\u0063\u0061',
  automatizada: '\u0041\u0075\u0074\u006f\u006D\u00e1\u0074\u0069\u0063\u0061',
  cvt: '\u0041\u0075\u0074\u006f\u006D\u00e1\u0074\u0069\u0063\u0061',
  semiautomatico: 'Semi-\u0041\u0075\u0074\u006f\u006D\u00e1\u0074\u0069\u0063\u0061',
  semi: 'Semi-\u0041\u0075\u0074\u006f\u006D\u00e1\u0074\u0069\u0063\u0061',
  manual: 'Manual',
  mecanica: 'Manual',
  mecanico: 'Manual',
}

const FUEL_MAP: Record<string, string> = {
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  flex: 'Flex',
  hibrido: 'H\u00edbrido',
  eletrico: 'El\u00e9trico',
  eletrica: 'El\u00e9trica',
  eletricao: 'El\u00e9trico',
}

const COLOR_MAP: Record<string, string> = {
  branca: 'Branca',
  branco: 'Branca',
  preta: 'Preta',
  preto: 'Preta',
  prata: 'Prata',
  cinza: 'Cinza',
}

const STEERING_MAP: Record<string, string> = {
  eletrica: 'El\u00e9trica',
  hidraulica: 'Hid\u00e1ulica',
  hidro: 'Hid\u00e1ulica',
}

function mapValue(map: Record<string, string>, normalized: string): string {
  return map[normalized] ?? normalized
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') ?? 'disponivel'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing env SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from('veiculos')
      .select('id, cambio, combustivel, cor, direcao, status')
      .eq('status', status)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const byField = {
      cambio: new Set<string>(),
      combustivel: new Set<string>(),
      cor: new Set<string>(),
      direcao: new Set<string>(),
    }

    for (const v of data ?? []) {
      const nC = normalizeValue(v.cambio)
      const nF = normalizeValue(v.combustivel)
      const nCo = normalizeValue(v.cor)
      const nD = normalizeValue(v.direcao)

      if (nC) byField.cambio.add(nC)
      if (nF) byField.combustivel.add(nF)
      if (nCo) byField.cor.add(nCo)
      if (nD) byField.direcao.add(nD)
    }

    const toList = (set: Set<string>) => Array.from(set).filter(Boolean).sort()

    const cambioNorm = toList(byField.cambio)
    const combustivelNorm = toList(byField.combustivel)
    const corNorm = toList(byField.cor)
    const direcaoNorm = toList(byField.direcao)

    const response = {
      status,
      counts: {
        cambio: cambioNorm.length,
        combustivel: combustivelNorm.length,
        cor: corNorm.length,
        direcao: direcaoNorm.length,
      },
      cambio: cambioNorm.map((n) => ({ normalized: n, ml: mapValue(ML_TRANSMISSION_MAP, n) })),
      combustivel: combustivelNorm.map((n) => ({ normalized: n, ml: mapValue(FUEL_MAP, n) })),
      cor: corNorm.map((n) => ({ normalized: n, ml: mapValue(COLOR_MAP, n) })),
      direcao: direcaoNorm.map((n) => ({ normalized: n, ml: mapValue(STEERING_MAP, n) })),
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
