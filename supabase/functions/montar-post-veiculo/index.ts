import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { buscarFraseFinal } from '../_shared/descricao-anuncio.ts'
import { montarLegendaSocial } from '../_shared/legenda-social.ts'
import { proporcaoAceitaPeloInstagram } from '../_shared/foto-jpeg.ts'

// Monta os posts de redes sociais de um veículo e grava na fila (social_posts) — Fase 2 da
// postagem automática (03/10/2026; docs/postagem-automatica-redes.md).
//
// Hoje só cria CARROSSEL de fotos (formato feed_carrossel), uma linha por rede (Instagram e
// Facebook). Vídeo e Stories entram na Fase 3. Por padrão grava como RASCUNHO: nada vai ao ar
// até alguém aprovar (status 'Agendado'). A trava social_posts_auto_unico impede o mesmo
// veículo de ganhar dois posts automáticos iguais (formato + rede + ciclo).
//
// Corpo: { veiculo_id, redes?: ['instagram','facebook'], origem?: 'auto_novo'|'auto_rodizio',
//          ciclo?: number, status?: 'Rascunho'|'Agendado', data_agendamento?: string }

const MAX_FOTOS_CARROSSEL = 10
const REDES_VALIDAS = ['instagram', 'facebook']

function resposta(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// A API do Instagram só aceita JPEG; todas as fotos do estoque são .jpg/.jpeg (conferido em
// 03/10/2026, 574 de 574), mas filtra por segurança contra um arquivo diferente no meio. Também
// tira as fotos com proporção que o Instagram recusa (vertical 3:4 etc., fora de 4:5 a 1,91:1):
// uma foto assim derrubaria o carrossel inteiro. Mantém a ordem do cadastro (capa primeiro).
async function fotosParaCarrossel(fotos: unknown): Promise<string[]> {
  if (!Array.isArray(fotos)) return []
  const jpegs = fotos.filter(
    (u): u is string => typeof u === 'string' && /^https:\/\/.+\.jpe?g(\?.*)?$/i.test(u),
  )
  const aceitas: string[] = []
  // olha só as primeiras 14 pra não gastar leitura à toa; sobram até 4 de reserva
  for (const url of jpegs.slice(0, MAX_FOTOS_CARROSSEL + 4)) {
    if (await proporcaoAceitaPeloInstagram(url)) aceitas.push(url)
    if (aceitas.length === MAX_FOTOS_CARROSSEL) break
  }
  return aceitas
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const veiculoId: string | undefined = body.veiculo_id
    if (!veiculoId) return resposta({ success: false, error: 'veiculo_id obrigatório' }, 400)

    const redes: string[] = Array.isArray(body.redes) ? body.redes : REDES_VALIDAS
    if (redes.length === 0 || redes.some((r) => !REDES_VALIDAS.includes(r))) {
      return resposta({ success: false, error: 'redes deve conter instagram e/ou facebook' }, 400)
    }
    const origem: string = body.origem || 'auto_novo'
    if (!['auto_novo', 'auto_rodizio'].includes(origem)) {
      return resposta({ success: false, error: 'origem deve ser auto_novo ou auto_rodizio' }, 400)
    }
    const status: string = body.status || 'Rascunho'
    if (!['Rascunho', 'Agendado'].includes(status)) {
      return resposta({ success: false, error: 'status deve ser Rascunho ou Agendado' }, 400)
    }
    const ciclo = Number.isInteger(body.ciclo) && body.ciclo > 0 ? body.ciclo : 1

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: veiculo, error: erroVeiculo } = await supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, versao, categoria, ano_fabricacao, ano_modelo, cor, combustivel, cambio, quilometragem, preco_venda, slug, status, fotos, diferenciais, caracteristicas',
      )
      .eq('id', veiculoId)
      .maybeSingle()
    if (erroVeiculo) throw erroVeiculo
    if (!veiculo) return resposta({ success: false, error: 'Veículo não encontrado' }, 404)
    if (veiculo.status !== 'disponivel') {
      return resposta(
        { success: false, error: 'Só veículos disponíveis entram na fila de postagem' },
        422,
      )
    }

    const fotos = await fotosParaCarrossel(veiculo.fotos)
    if (fotos.length < 2) {
      return resposta(
        { success: false, error: 'O carrossel precisa de pelo menos 2 fotos em JPG no cadastro' },
        422,
      )
    }

    const fraseFinal = await buscarFraseFinal(supabase)
    const resultados: Record<string, unknown> = {}

    for (const rede of redes) {
      const legenda = montarLegendaSocial(veiculo, {
        rede: rede as 'instagram' | 'facebook',
        fraseFinal,
      })
      const { data: criado, error: erroInsert } = await supabase
        .from('social_posts')
        .insert({
          redes: [rede],
          texto: legenda,
          imagem: fotos[0],
          midias: fotos,
          veiculo_id: veiculo.id,
          content_type: 'feed',
          formato: 'feed_carrossel',
          rede,
          origem,
          ciclo,
          status,
          data_agendamento: body.data_agendamento || new Date().toISOString(),
        })
        .select('id')
        .single()

      if (erroInsert) {
        // 23505 = violação da trava de duplicidade (já existe esse post automático)
        resultados[rede] =
          erroInsert.code === '23505'
            ? { criado: false, motivo: 'já existe um post automático igual para este veículo' }
            : { criado: false, motivo: erroInsert.message }
      } else {
        resultados[rede] = { criado: true, post_id: criado.id, status, fotos: fotos.length }
      }
    }

    return resposta({
      success: true,
      veiculo_id: veiculo.id,
      formato: 'feed_carrossel',
      resultados,
    })
  } catch (err: any) {
    console.error('Erro em montar-post-veiculo:', err?.message)
    return resposta({ success: false, error: err?.message || 'Erro desconhecido' }, 500)
  }
})
