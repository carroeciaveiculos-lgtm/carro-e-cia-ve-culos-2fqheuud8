import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

// Fase 5 do plano de corte Modelo/Versao (MEMORY_WORK.MD, Sessao 16).
// Fases 1-4 (tabela de excecoes, funcao de corte, busca corrigida,
// cadastro por placa, migracao dos veiculos existentes) ja estavam
// completas e testadas em producao desde 27/08/2026 -- essa era a unica
// que faltava.
//
// O que faz: uma vez por mes, busca na API publica da FIPE (parallelum,
// gratuita, sem chave) o catalogo de modelos das marcas que a loja ja
// mexeu (presentes em `veiculos`/`veiculos_cache`) e procura padroes de
// nome composto (ex: "Corolla Cross", "Hilux SW4") que ainda nao estao
// cadastrados em `modelo_versao_excecoes`. NUNCA insere excecao sozinha
// -- so avisa por WhatsApp (mesmo canal do daily-report-cron) e grava o
// resultado em `fipe_auditoria_modelo_versao_runs` pra decisao humana,
// igual foi feito manualmente na investigacao original da Sessao 16.
//
// Escopo deliberadamente restrito as marcas que a loja ja teve no
// estoque (nao as ~130 marcas da FIPE inteira) -- é o que importa pro
// catalogo real, e evita uma auditoria monstro rodando toda vez.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// Palavras que aparecem como 2a palavra mas sao nivel de acabamento, nao
// nome de carroceria/nameplate distinta -- mesmo quando "parecem" palavra
// normal (Cross/Fielder/Cactus/Triton passam no formato mas nao estao
// aqui). Lista curta, revisar se aparecer falso positivo recorrente.
const PALAVRAS_ACABAMENTO_CONHECIDAS = new Set([
  'sport',
  'plus',
  'turbo',
  'line',
  'style',
  'trend',
  'comfort',
  'confort',
  'titanium',
  'freedom',
  'adventure',
  'trail',
  'storm',
  'ultimate',
  'prestige',
  'dynamic',
  'design',
  'exclusive',
  'limited',
  'signature',
  'black',
  'white',
  'edition',
  'individual',
  'premium',
  'active',
  'life',
  'drive',
])

// So considera candidato quando a 2a palavra "parece" nome próprio: 1
// maiuscula + 2+ minusculas, sem digito/hifen/ponto (filtra siglas de
// acabamento tipo GLi, XLi, SE-G, LE, SW4 -- essas ja sao tratadas por
// excecao manual quando alguem confirma que sao nameplate de verdade).
const FORMATO_NOME_PROPRIO = /^[A-ZÀ-ÝÇ][a-zà-ÿç]{2,}$/

const OCORRENCIAS_MINIMAS = 3

interface Excecao {
  tipo: 'generico' | 'composto'
  termo: string
}

interface Candidato {
  marca: string
  termo: string
  ocorrencias: number
  exemplos: string[]
}

function jaEhExcecao(primeira: string, segunda: string, excecoes: Excecao[]): boolean {
  const p = primeira.toLowerCase()
  const duas = `${primeira} ${segunda}`.toLowerCase()
  return excecoes.some(
    (e) =>
      (e.tipo === 'generico' && e.termo.toLowerCase() === p) ||
      (e.tipo === 'composto' && e.termo.toLowerCase() === duas),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { data: excecoes, error: excecoesError } = await supabase
      .from('modelo_versao_excecoes')
      .select('tipo, termo')
    if (excecoesError) throw excecoesError

    const [{ data: marcasVeiculos }, { data: marcasCache }] = await Promise.all([
      supabase.from('veiculos').select('marca').not('marca', 'is', null),
      supabase.from('veiculos_cache').select('marca').not('marca', 'is', null),
    ])

    const marcasLoja = Array.from(
      new Set(
        [...(marcasVeiculos || []), ...(marcasCache || [])]
          .map((r: any) => (r.marca || '').trim())
          .filter(Boolean),
      ),
    )

    const fipeMarcasRes = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
    if (!fipeMarcasRes.ok) throw new Error(`FIPE marcas HTTP ${fipeMarcasRes.status}`)
    const fipeMarcas: { codigo: string; nome: string }[] = await fipeMarcasRes.json()

    const marcasSemCorrespondencia: string[] = []
    const marcasParaAuditar: { codigo: string; nome: string }[] = []
    for (const marcaLoja of marcasLoja) {
      const match = fipeMarcas.find((m) => m.nome.toLowerCase() === marcaLoja.toLowerCase())
      if (match) marcasParaAuditar.push(match)
      else marcasSemCorrespondencia.push(marcaLoja)
    }

    type Grupo = { primeira: string; segunda: string; marca: string; total: number; exemplos: string[] }
    const grupos = new Map<string, Grupo>()
    let modelosAuditados = 0

    for (const marca of marcasParaAuditar) {
      const res = await fetch(
        `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca.codigo}/modelos`,
      )
      if (!res.ok) continue
      const data = await res.json()
      const modelos: { nome: string }[] = data?.modelos || []

      for (const modelo of modelos) {
        modelosAuditados++
        const palavras = modelo.nome.trim().split(/\s+/)
        if (palavras.length < 2) continue

        const primeira = palavras[0]
        const segunda = palavras[1]

        if (jaEhExcecao(primeira, segunda, excecoes || [])) continue
        if (!FORMATO_NOME_PROPRIO.test(segunda)) continue
        if (PALAVRAS_ACABAMENTO_CONHECIDAS.has(segunda.toLowerCase())) continue

        const chave = `${marca.nome}|${primeira.toLowerCase()}|${segunda.toLowerCase()}`
        const existente = grupos.get(chave)
        if (existente) {
          existente.total++
          if (existente.exemplos.length < 3) existente.exemplos.push(modelo.nome)
        } else {
          grupos.set(chave, {
            primeira,
            segunda,
            marca: marca.nome,
            total: 1,
            exemplos: [modelo.nome],
          })
        }
      }
    }

    const candidatos: Candidato[] = Array.from(grupos.values())
      .filter((g) => g.total >= OCORRENCIAS_MINIMAS)
      .map((g) => ({
        marca: g.marca,
        termo: `${g.primeira} ${g.segunda}`,
        ocorrencias: g.total,
        exemplos: g.exemplos,
      }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias)

    await supabase.from('fipe_auditoria_modelo_versao_runs').insert({
      marcas_auditadas: marcasParaAuditar.length,
      modelos_auditados: modelosAuditados,
      candidatos,
      marcas_sem_correspondencia_fipe: marcasSemCorrespondencia,
      status: 'ok',
    })

    const top = candidatos.slice(0, 15)
    const listaTexto =
      top.length > 0
        ? top
            .map((c) => `   • ${c.marca} — "${c.termo}" (${c.ocorrencias}x, ex: ${c.exemplos[0]})`)
            .join('\n')
        : '   • Nenhum candidato novo encontrado.'

    const reportText = `🔍 *Auditoria mensal FIPE — Modelo/Versão*

Auditadas ${marcasParaAuditar.length} marcas (${modelosAuditados} modelos) do que a loja já teve no estoque.

${candidatos.length > 0 ? `⚠️ *${candidatos.length} possíveis nomes compostos ainda não cadastrados em exceções:*\n${listaTexto}\n\n💡 Se algum for de verdade um modelo distinto (tipo "Corolla Cross"), me avise pra eu adicionar em \`modelo_versao_excecoes\`.` : '✅ Nada novo — todos os padrões conhecidos já estão cobertos.'}
${marcasSemCorrespondencia.length > 0 ? `\n⚠️ Marcas no nosso banco sem correspondência exata na FIPE: ${marcasSemCorrespondencia.join(', ')}` : ''}`

    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')
    const waPhoneId =
      Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')

    const { data: socialConfig } = await supabase
      .from('social_configuracoes')
      .select('whatsapp_number')
      .maybeSingle()
    const ownerPhone = socialConfig?.whatsapp_number || '5534999484285'

    if (waToken && waPhoneId) {
      await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: ownerPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: reportText },
        }),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        marcas_auditadas: marcasParaAuditar.length,
        modelos_auditados: modelosAuditados,
        candidatos,
        marcas_sem_correspondencia_fipe: marcasSemCorrespondencia,
        report: reportText,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('Erro na auditoria FIPE:', err)
    await supabase.from('fipe_auditoria_modelo_versao_runs').insert({
      status: 'erro',
      erro: err?.message || String(err),
    })
    return new Response(JSON.stringify({ success: false, error: err?.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
