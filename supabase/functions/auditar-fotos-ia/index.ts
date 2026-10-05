import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { MIN_FOTOS_LIMPAS, classificarFotos } from '../_shared/foto-marca-ia.ts'

// Verifica, num veículo, quais fotos têm marca de IA (Galaxy AI / "Photo assist") e guarda o resultado
// em veiculo_fotos_ia. Chamada pela aba "Fotos" da Central de Redes Sociais, com a equipe logada,
// UM veículo por vez (a tela percorre o estoque). Corpo: { veiculo_id, forcar? }.
// Só LÊ as fotos (leitura parcial) e grava no cache; não altera o cadastro nem as imagens.

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // verify_jwt=true também aceita a chave pública (anon): aqui exige usuário logado de verdade.
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: u, error: erroAuth } = await admin.auth.getUser(jwt)
    if (erroAuth || !u?.user) return json({ error: 'Sessão expirada. Entre no painel de novo.' }, 401)

    const { veiculo_id, forcar } = await req.json().catch(() => ({}))
    if (!veiculo_id) return json({ error: 'veiculo_id obrigatório.' }, 400)

    const { data: veiculo } = await admin
      .from('veiculos')
      .select('id, placa, fotos')
      .eq('id', veiculo_id)
      .maybeSingle()
    if (!veiculo) return json({ error: 'Veículo não encontrado.' }, 404)

    const urls: string[] = (Array.isArray(veiculo.fotos) ? veiculo.fotos : []).filter(
      (x: unknown): x is string => typeof x === 'string',
    )
    const marca = await classificarFotos(admin, veiculo.id, urls, { forcar: forcar === true })

    const limpas = urls.filter((x) => marca[x] === false).length
    const marcadas = urls.filter((x) => marca[x] === true).length
    const naoVerificadas = urls.filter((x) => marca[x] === null).length
    return json({
      success: true,
      placa: veiculo.placa,
      total: urls.length,
      limpas,
      marcadas,
      nao_verificadas: naoVerificadas,
      apto_para_carrossel: limpas >= MIN_FOTOS_LIMPAS,
    })
  } catch (e) {
    console.error('Erro em auditar-fotos-ia:', e)
    return json({ error: 'Erro inesperado ao verificar as fotos.' }, 500)
  }
})
