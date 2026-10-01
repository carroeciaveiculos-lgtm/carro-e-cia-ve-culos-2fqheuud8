import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Motor híbrido do gerador de criativos de anúncio (pedido da Adriana,
// 28/09/2026): esta function trata SÓ a foto (iluminação/realce) por IA.
// Preço, km, ano, logo e qualquer texto do anúncio são desenhados por
// código no front-end, direto dos dados reais do veículo -- nunca por
// IA, pra nunca sair um número errado num anúncio pago. Ver plano
// completo na sessão que criou isso.

// 30/09/2026 (pedido da Adriana): os 4 modelos viraram 2 — fundo escuro e fundo
// claro. Os 4 slugs antigos continuam aceitos só pra não quebrar quem estiver
// com a tela antiga aberta; o front novo só manda os dois primeiros.
const TEMPLATE_SLUGS = [
  'criativo_fundo_escuro',
  'criativo_fundo_claro',
  'criativo_preco_destaque',
  'criativo_ficha_tecnica',
  'criativo_oportunidade',
  'criativo_convite_cta',
] as const

async function fetchAsFile(url: string, name: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar a foto original (${name})`)
  const buf = await res.arrayBuffer()
  return new File([buf], name, { type: res.headers.get('content-type') || 'image/jpeg' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { veiculo_id, foto_url, template_slug } = await req.json()
    if (!veiculo_id) throw new Error('Informe o veículo')
    if (!foto_url) throw new Error('Informe a foto de origem')
    if (!TEMPLATE_SLUGS.includes(template_slug)) {
      throw new Error('Modelo de criativo inválido')
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Trava de segurança 1: a foto precisa pertencer de verdade a esse
    // veículo -- nunca tratar (e gastar API) foto arbitrária vinda do
    // payload sem checar a origem.
    const { data: veiculo, error: veiculoError } = await supabaseService
      .from('veiculos')
      .select('fotos')
      .eq('id', veiculo_id)
      .single()
    if (veiculoError || !veiculo) throw new Error('Veículo não encontrado')
    const fotos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []
    if (!fotos.includes(foto_url)) {
      throw new Error('Essa foto não pertence a este veículo')
    }

    // Trava de segurança 2 (documentação, não é checagem em código):
    // preço/km/ano/etc NUNCA são lidos daqui nem enviados pro prompt --
    // o front busca esses dados direto de `veiculos` e desenha por cima
    // da imagem tratada devolvida abaixo. Esta function só entrega a
    // foto tratada.

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

    const { data: promptRow } = await supabaseService
      .from('ai_prompts_config')
      .select('prompt_text')
      .eq('slug', template_slug)
      .maybeSingle()
    const prompt =
      promptRow?.prompt_text ||
      'Realce fotorrealista da foto do veículo: iluminação de estúdio, cores fiéis ao carro real, fundo levemente desfocado/neutro. Não altere a cor, o modelo ou qualquer característica real do veículo.'

    const form = new FormData()
    form.append('model', 'gpt-image-2')
    form.append('prompt', prompt)
    form.append('size', '1024x1024')
    form.append('n', '1')
    form.append('image[]', await fetchAsFile(foto_url, 'foto-original.jpg'))

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Erro na API da OpenAI')
    const item = data.data?.[0]
    if (!item) throw new Error('Nenhuma imagem foi retornada pelo provedor')

    // gpt-image-2 retorna base64 (b64_json) -- devolve pro front já
    // como data URL, pronto pra desenhar no canvas.
    let imagemTratadaDataUrl: string
    if (item.b64_json) {
      imagemTratadaDataUrl = `data:image/png;base64,${item.b64_json}`
    } else if (item.url) {
      const imgRes = await fetch(item.url)
      if (!imgRes.ok) throw new Error('Falha ao baixar a imagem tratada')
      const buf = await imgRes.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      imagemTratadaDataUrl = `data:image/png;base64,${b64}`
    } else {
      throw new Error('Nenhuma imagem foi retornada pelo provedor')
    }

    await supabaseService.from('logs_ia').insert({
      usuario_id: user.id,
      acao: `gerar_criativo_${template_slug}`,
      provider: 'openai',
      modelo: 'gpt-image-2',
      status: 'sucesso',
    })

    return new Response(JSON.stringify({ success: true, imagem_tratada: imagemTratadaDataUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
