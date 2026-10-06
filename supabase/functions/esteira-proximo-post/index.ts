import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isInternalRequestAuthorized } from '../_shared/internal-auth.ts'
import {
  type ChamarMontar,
  type Cliente,
  proximo,
  reconciliar,
  sincronizarFila,
} from '../_shared/esteira.ts'

// Esteira de postagens (05/10/2026). Cria UM item por vez na aba Aprovações: um veículo + um tipo
// (hoje só carrossel), com os rascunhos de Instagram e Facebook juntos, usando montar-post-veiculo
// (que só usa fotos sem marca de IA). Só cria quando NÃO houver item aguardando a decisão da equipe.
// NUNCA aprova nada sozinha.
//
// Quem chama: o agendamento a cada 15 min (cabeçalho x-internal-secret) e o painel (usuário logado),
// logo depois de aprovar/pular, para o próximo aparecer na hora. verify_jwt = false porque o
// agendamento não manda JWT: a autorização é conferida aqui dentro.
//
// Corpo (opcional): { acao?: 'proximo' (padrão) | 'pular', item_id?: string }
//
// Ordem: veículos mais recentes no estoque primeiro (menor `ordem`); para cada veículo, carrossel e
// depois vídeo. Tipo 'video' ainda não é gerado (Fase B): os itens ficam na fila.

const TRAVA_MS = 120_000

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

async function autorizado(req: Request, admin: Cliente, chaveServico: string): Promise<boolean> {
  if (isInternalRequestAuthorized(req)) return true
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!jwt) return false
  if (jwt === chaveServico) return true
  const { data, error } = await admin.auth.getUser(jwt)
  return !error && !!data?.user
}

// Chama o montador de carrossel como a própria plataforma (chave de serviço)
function montadorViaServico(supabaseUrl: string, chaveServico: string): ChamarMontar {
  return async (veiculoId, ciclo) => {
    const r = await fetch(`${supabaseUrl}/functions/v1/montar-post-veiculo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chaveServico}`,
        apikey: chaveServico,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        veiculo_id: veiculoId,
        redes: ['instagram', 'facebook'],
        origem: 'auto_novo',
        ciclo,
        status: 'Rascunho',
      }),
      signal: AbortSignal.timeout(100_000),
    })
    return { status: r.status, corpo: await r.json().catch(() => ({})) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const chaveServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, chaveServico)
  let travaAdquirida = false

  try {
    if (!(await autorizado(req, admin, chaveServico)))
      return json({ error: 'Não autorizado.' }, 401)
    const corpo = await req.json().catch(() => ({}))

    const { data: cfg } = await admin
      .from('esteira_config')
      .select('ativa')
      .eq('id', 1)
      .maybeSingle()

    // Trava curta: duas chamadas juntas (agendamento + tela) não podem criar dois itens
    const agora = new Date()
    const { data: trava } = await admin
      .from('esteira_config')
      .update({ trava_ate: new Date(agora.getTime() + TRAVA_MS).toISOString() })
      .eq('id', 1)
      .or(`trava_ate.is.null,trava_ate.lt.${agora.toISOString()}`)
      .select('id')
    if (!trava || trava.length === 0) return json({ acao: 'ocupada' })
    travaAdquirida = true

    // "Pular": apaga só os RASCUNHOS do item (nunca post aprovado/publicado) e marca como pulado
    if (corpo.acao === 'pular') {
      if (!corpo.item_id) return json({ error: 'item_id obrigatório.' }, 400)
      const { data: item } = await admin
        .from('social_esteira')
        .select('id, estado, post_ids')
        .eq('id', corpo.item_id)
        .maybeSingle()
      if (!item) return json({ error: 'Item não encontrado.' }, 404)
      if (item.post_ids?.length) {
        await admin.from('social_posts').delete().in('id', item.post_ids).eq('status', 'Rascunho')
      }
      await admin
        .from('social_esteira')
        .update({
          estado: 'pulado',
          motivo: 'pulado pela equipe',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', item.id)
    }

    const sinc = await sincronizarFila(admin)
    const pendentes = await reconciliar(admin)

    if (!cfg?.ativa) return json({ acao: 'pausada', ...sinc })
    if (pendentes > 0) return json({ acao: 'aguardando_aprovacao', ...sinc })

    return json({
      ...(await proximo(admin, montadorViaServico(supabaseUrl, chaveServico))),
      ...sinc,
    })
  } catch (e) {
    console.error('Erro em esteira-proximo-post:', e)
    return json({ error: 'Erro inesperado na esteira.' }, 500)
  } finally {
    if (travaAdquirida) await admin.from('esteira_config').update({ trava_ate: null }).eq('id', 1)
  }
})
