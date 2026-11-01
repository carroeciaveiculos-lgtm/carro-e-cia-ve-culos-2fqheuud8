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
  // 01/11/2026: os 3 estilos de tratamento da foto (valem para qualquer formato).
  'criativo_estilo_loja',
  'criativo_estilo_estudio_claro',
  'criativo_estilo_estudio_escuro',
] as const

// Tamanho da imagem pedida à IA. A API do gpt-image-2 aceita 1024x1024, 1536x1024,
// 1024x1536 e qualquer LARGURAxALTURA com os dois lados múltiplos de 16, proporção
// entre 1:3 e 3:1 e no máximo 3840x2160 (documentação oficial da OpenAI, conferida em
// 01/11/2026). Aqui limitamos o lado maior a 2048 e o total de pixels, por custo.
// Qualquer valor fora disso volta para o padrão antigo (1024x1024).
const TAMANHO_PADRAO = '1024x1024'
function tamanhoValido(size: unknown): string {
  if (typeof size !== 'string') return TAMANHO_PADRAO
  const m = /^(\d{3,4})x(\d{3,4})$/.exec(size)
  if (!m) return TAMANHO_PADRAO
  const w = Number(m[1])
  const h = Number(m[2])
  const ok =
    w % 16 === 0 &&
    h % 16 === 0 &&
    Math.max(w, h) <= 2048 &&
    w * h >= 655360 &&
    w * h <= 4194304 &&
    w / h <= 3 &&
    h / w <= 3
  return ok ? size : TAMANHO_PADRAO
}

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

    const { veiculo_id, foto_url, template_slug, size: sizePedido } = await req.json()
    const size = tamanhoValido(sizePedido)
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
    const promptBase =
      promptRow?.prompt_text ||
      'Realce fotorrealista da foto do veículo: iluminação de estúdio, cores fiéis ao carro real, fundo levemente desfocado/neutro. Não altere a cor, o modelo ou qualquer característica real do veículo.'
    // O texto do prompt vem do banco (tela Regras de IA). O enquadramento depende do
    // tamanho pedido, então é acrescentado aqui, para o respiro acompanhar o formato.
    const [larg, alt] = size.split('x')
    const prompt =
      size === TAMANHO_PADRAO
        ? promptBase
        : `${promptBase}\n\nA imagem de saída tem ${larg}x${alt} pixels. Adapte o enquadramento a essa proporção, mantendo o veículo inteiro, centralizado e com respiro uniforme de 12% até as bordas.`

    const form = new FormData()
    form.append('model', 'gpt-image-2')
    form.append('prompt', prompt)
    form.append('size', size)
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
