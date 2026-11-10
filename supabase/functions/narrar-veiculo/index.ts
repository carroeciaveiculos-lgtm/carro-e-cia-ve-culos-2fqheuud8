import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Narração dos vídeos de veículo — ETAPA 1, SOMENTE MODO DE ENSAIO (10/11/2026).
// Padrão em docs/video-narrado-padrao.md.
//
// Recebe o texto já revisado e devolve um áudio MUDO (WAV) com a duração estimada da fala, para
// testar a montagem do vídeo sem gastar crédito da ElevenLabs. Esta função NÃO chama a ElevenLabs.
// O modo "real" ainda não existe: depende do Voice ID confirmado, do cache de áudio por texto e
// do teto diário de caracteres (Etapa 2, com migração própria). Pedir "real" devolve 501.
//
// Corpo: { texto: string, formato: '9:16' | '4:5', modo?: 'ensaio' }
// Regras espelhadas de src/lib/roteiro-video.ts (o texto também é conferido lá, no painel).

const MAX_CARACTERES = 900
const PALAVRAS_POR_SEGUNDO = 2.4
const LIMITE_PALAVRAS: Record<string, { min: number; max: number }> = {
  '9:16': { min: 50, max: 65 },
  '4:5': { min: 75, max: 100 },
}
const TAXA_AMOSTRAGEM = 8000

function resposta(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// WAV mono 16 bits, silêncio, com a duração pedida.
function silencioWav(segundos: number): Uint8Array {
  const amostras = Math.round(segundos * TAXA_AMOSTRAGEM)
  const dados = amostras * 2
  const buf = new ArrayBuffer(44 + dados)
  const v = new DataView(buf)
  const texto = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(pos + i, s.charCodeAt(i))
  }
  texto(0, 'RIFF')
  v.setUint32(4, 36 + dados, true)
  texto(8, 'WAVE')
  texto(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, TAXA_AMOSTRAGEM, true)
  v.setUint32(28, TAXA_AMOSTRAGEM * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  texto(36, 'data')
  v.setUint32(40, dados, true)
  return new Uint8Array(buf)
}

function paraBase64(bytes: Uint8Array): string {
  let bin = ''
  const bloco = 0x8000
  for (let i = 0; i < bytes.length; i += bloco) {
    bin += String.fromCharCode(...bytes.subarray(i, i + bloco))
  }
  return btoa(bin)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return resposta({ error: 'Use POST.' }, 405)

  let corpo: { texto?: unknown; formato?: unknown; modo?: unknown }
  try {
    corpo = await req.json()
  } catch {
    return resposta({ error: 'Corpo inválido: envie um JSON.' }, 400)
  }

  if (corpo.modo !== undefined && corpo.modo !== 'ensaio') {
    return resposta(
      {
        error:
          'A narração real ainda não está liberada. Esta etapa só faz o ensaio (áudio mudo, sem custo).',
        modo_disponivel: 'ensaio',
      },
      501,
    )
  }

  const formato = String(corpo.formato ?? '')
  const limites = LIMITE_PALAVRAS[formato]
  if (!limites) return resposta({ error: 'Formato inválido: use "9:16" ou "4:5".' }, 400)

  const texto = typeof corpo.texto === 'string' ? corpo.texto.trim() : ''
  if (!texto) return resposta({ error: 'Envie o texto da narração.' }, 400)
  if (texto.length > MAX_CARACTERES) {
    return resposta({ error: `Texto grande demais (máximo ${MAX_CARACTERES} caracteres).` }, 400)
  }

  const palavras = texto.split(/\s+/).length
  const duracao = Math.round((palavras / PALAVRAS_POR_SEGUNDO) * 10) / 10
  const avisos: string[] = []
  if (palavras < limites.min) avisos.push(`texto curto para ${formato} (${palavras} palavras)`)
  if (palavras > limites.max) avisos.push(`texto longo para ${formato} (${palavras} palavras)`)
  if (/r\$|\breais\b|parcela|financi/i.test(texto)) avisos.push('cita preço ou parcela')

  const audio = silencioWav(Math.min(duracao, 60))
  return resposta({
    success: true,
    modo: 'ensaio',
    custo_elevenlabs: 0,
    caracteres: texto.length,
    palavras,
    duracao_estimada_s: duracao,
    avisos,
    audio: { mime: 'audio/wav', base64: paraBase64(audio) },
  })
})
