import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'
import { getValidNapistaToken } from '../_shared/napista-client.ts'

// Produção desde 18/08/2026 — ver docs/integracao-napista.md.
const BASE = 'https://api.napista.com.br/seller-inventory-api'

// Endpoints reais conferidos direto na API em 14/08/2026 (a doc erra o path
// de marcas — diz "/catalog/{category}/make", o real é "/catalog/makes/{category}",
// plural e ordem trocada). Ver docs/integracao-napista.md, seção "Becos sem saída".
async function napistaFetch(path: string, token: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`NaPista API ${res.status} em ${path}: ${await res.text()}`)
  return res.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action || 'sync_marcas'

    const { token, error: tokenError } = await getValidNapistaToken(supabase)
    if (!token) return new Response(JSON.stringify({ error: tokenError }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    if (action === 'sync_marcas') {
      const data = await napistaFetch('/catalog/makes/CAR', token)
      const marcas = (data.items || []).filter((m: any) => m.id)
      let salvos = 0
      for (const m of marcas) {
        const { error } = await supabase
          .from('napista_marcas')
          .upsert({ id: m.id, nome: m.name, atualizado_em: new Date().toISOString() }, { onConflict: 'id' })
        if (!error) salvos++
      }
      return new Response(JSON.stringify({ success: true, total: marcas.length, salvos }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'sync_modelos') {
      const marcaId = body.marca_id
      if (!marcaId) return new Response(JSON.stringify({ error: 'marca_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      const data = await napistaFetch(`/catalog/CAR/make/${encodeURIComponent(marcaId)}/models`, token)
      const modelos = (data.items || []).filter((m: any) => m.id)
      let salvos = 0
      for (const m of modelos) {
        const { error } = await supabase
          .from('napista_modelos')
          .upsert(
            { marca_id: marcaId, id: m.id, nome: m.name, atualizado_em: new Date().toISOString() },
            { onConflict: 'marca_id,id' },
          )
        if (!error) salvos++
      }
      return new Response(JSON.stringify({ success: true, marca_id: marcaId, total: modelos.length, salvos }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'sync_versoes') {
      const modeloId = body.modelo_id
      const marcaId = body.marca_id
      const modelYear = body.model_year
      if (!modeloId || !marcaId) {
        return new Response(JSON.stringify({ error: 'marca_id e modelo_id obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // Achado testando ao vivo (14/08/2026): o mesmo modelo tem conjuntos de
      // versionId diferentes por ano — sem o filtro modelYear, o cadastro do
      // anúncio rejeita com "versionId invalid for the informed modelYear".
      const yearParam = modelYear ? `&modelYear=${encodeURIComponent(modelYear)}` : ''
      const data = await napistaFetch(
        `/catalog/versions/CAR?modelId=${encodeURIComponent(modeloId)}${yearParam}`,
        token,
      )
      const versoes = (data.items || []).filter((v: any) => v.id)
      let salvos = 0
      for (const v of versoes) {
        const { error } = await supabase
          .from('napista_versoes')
          .upsert(
            {
              id: v.id,
              modelo_id: modeloId,
              marca_id: marcaId,
              nome: v.name,
              model_year: modelYear || null,
              atualizado_em: new Date().toISOString(),
            },
            { onConflict: 'id' },
          )
        if (!error) salvos++
      }
      return new Response(
        JSON.stringify({ success: true, modelo_id: modeloId, total: versoes.length, salvos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (action === 'sync_atributos') {
      const data = await napistaFetch('/catalog/attributes', token)
      const { error } = await supabase
        .from('napista_atributos')
        .upsert({ id: 'catalogo', dados: data, atualizado_em: new Date().toISOString() }, { onConflict: 'id' })
      if (error) return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      return new Response(JSON.stringify({ success: true, chaves: Object.keys(data) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Atalho pra popular tudo que o estoque atual precisa numa chamada só —
    // só busca modelos/versões das marcas e modelos que a gente realmente
    // vende (14 marcas / 27 combinações marca+modelo hoje), não o universo
    // inteiro do NaPista (centenas de marcas). Reduz drasticamente as
    // chamadas necessárias comparado a sincronizar tudo.
    if (action === 'sync_para_estoque') {
      const marcasData = await napistaFetch('/catalog/makes/CAR', token)
      const marcasNapista: { id: string; name: string }[] = (marcasData.items || []).filter(
        (m: any) => m.id,
      )
      for (const m of marcasNapista) {
        await supabase
          .from('napista_marcas')
          .upsert({ id: m.id, nome: m.name, atualizado_em: new Date().toISOString() }, { onConflict: 'id' })
      }

      const { data: veiculos } = await supabase
        .from('veiculos')
        .select('marca, modelo, ano_modelo')
        .eq('status', 'disponivel')
      // Achado testando ao vivo (14/08/2026): versões diferem por ano — a
      // chave do combo precisa incluir ano_modelo, senão o cache mistura
      // versões de anos errados (NaPista rejeita: "versionId invalid for
      // the informed modelYear").
      const combos = new Map<string, { marca: string; modelo: string; ano: number | null }>()
      for (const v of veiculos || []) {
        if (v.marca && v.modelo) {
          combos.set(`${v.marca}|${v.modelo}|${v.ano_modelo}`, {
            marca: v.marca,
            modelo: v.modelo,
            ano: v.ano_modelo || null,
          })
        }
      }

      const normalizar = (s: string) =>
        s.trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
      const marcasPorNome = new Map(marcasNapista.map((m) => [normalizar(m.name), m]))

      const resultados: any[] = []
      for (const { marca, modelo, ano } of combos.values()) {
        const marcaNapista = marcasPorNome.get(normalizar(marca))
        if (!marcaNapista) {
          resultados.push({ marca, modelo, ano, erro: 'marca não encontrada no catálogo NaPista' })
          continue
        }
        try {
          const modelosData = await napistaFetch(
            `/catalog/CAR/make/${encodeURIComponent(marcaNapista.id)}/models`,
            token,
          )
          const modelosNapista: { id: string; name: string }[] = (modelosData.items || []).filter(
            (m: any) => m.id,
          )
          for (const mo of modelosNapista) {
            await supabase.from('napista_modelos').upsert(
              {
                marca_id: marcaNapista.id,
                id: mo.id,
                nome: mo.name,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: 'marca_id,id' },
            )
          }
          const modeloNapista = modelosNapista.find((mo) => normalizar(mo.name) === normalizar(modelo))
          if (!modeloNapista) {
            resultados.push({ marca, modelo, ano, erro: 'modelo não encontrado no catálogo NaPista' })
            continue
          }
          const yearParam = ano ? `&modelYear=${ano}` : ''
          const versoesData = await napistaFetch(
            `/catalog/versions/CAR?modelId=${encodeURIComponent(modeloNapista.id)}${yearParam}`,
            token,
          )
          const versoes: { id: string; name: string }[] = (versoesData.items || []).filter((v: any) => v.id)
          for (const v of versoes) {
            await supabase.from('napista_versoes').upsert(
              {
                id: v.id,
                modelo_id: modeloNapista.id,
                marca_id: marcaNapista.id,
                nome: v.name,
                model_year: ano,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: 'id' },
            )
          }
          resultados.push({ marca, modelo, ano, versoes_encontradas: versoes.length })
        } catch (e: any) {
          resultados.push({ marca, modelo, ano, erro: e.message })
        }
      }

      const atributosData = await napistaFetch('/catalog/attributes', token)
      await supabase
        .from('napista_atributos')
        .upsert(
          { id: 'catalogo', dados: atributosData, atualizado_em: new Date().toISOString() },
          { onConflict: 'id' },
        )

      return new Response(JSON.stringify({ success: true, combos_processadas: resultados.length, resultados }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `action desconhecida: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
