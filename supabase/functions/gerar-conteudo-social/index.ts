import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { montarLegendaIA } from '../_shared/legenda-ia.ts'
import { destaques } from '../_shared/legenda-social.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { veiculo_id, platform, veiculo } = body

    if (!veiculo_id && !veiculo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'veiculo_id é obrigatório no corpo da requisição.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let vehicleData = veiculo

    if (!vehicleData && veiculo_id) {
      const { data: vehicleRecord, error: dbError } = await supabase
        .from('veiculos')
        .select(
          'marca, modelo, versao, ano_fabricacao, ano_modelo, cor, combustivel, quilometragem, cambio, preco_venda, descricao, diferenciais',
        )
        .eq('id', veiculo_id)
        .single()

      if (dbError) {
        console.error(
          '[gerar-conteudo-social] Database query error for ID:',
          veiculo_id,
          dbError.message,
        )
      }

      if (!vehicleRecord) {
        console.error('[gerar-conteudo-social] Database query returned null for ID:', veiculo_id)
        return new Response(JSON.stringify({ success: false, error: 'Veículo não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      vehicleData = vehicleRecord
    }

    if (!vehicleData || !vehicleData.marca) {
      console.error(
        '[gerar-conteudo-social] Vehicle data is missing or has no marca property. ID:',
        veiculo_id || 'inline',
      )
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do veículo incompletos ou inválidos.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const safeMarca = vehicleData.marca || 'Veículo'
    const safeModelo = vehicleData.modelo || ''
    const safeAno = vehicleData.ano_fabricacao || 'Ano não informado'
    const safePreco = vehicleData.preco_venda ?? 'Sob consulta'
    const safeCor = vehicleData.cor || 'Não informada'
    const safeCombustivel = vehicleData.combustivel || 'Não informado'
    const safeDescricao = vehicleData.descricao || 'Sem descrição adicional'

    const targetPlatform = platform || 'Instagram'

    const { data: promptConfig } = await supabase
      .from('ai_prompts_config')
      .select('prompt_text')
      .eq('slug', 'social_media')
      .maybeSingle()
    const socialMediaPrompt =
      promptConfig?.prompt_text || 'Você é um especialista em marketing automotivo.'

    // Opcionais do cadastro (mesmo filtro da legenda fixa: nada de "passagem por leilao" etc.)
    const listaDiferenciais = destaques(vehicleData.diferenciais, 10)
    const safeVersao = vehicleData.versao || ''
    const safeKm =
      vehicleData.quilometragem === null || vehicleData.quilometragem === undefined
        ? 'Não informada'
        : `${Number(vehicleData.quilometragem).toLocaleString('pt-BR')} km`
    const safeCambio = vehicleData.cambio || 'Não informado'

    const prompt = `${socialMediaPrompt}

Escreva a legenda de um post para ${targetPlatform} vendendo o veículo abaixo, da loja Carro e Cia Veículos (Uberaba/MG). Use SOMENTE os dados abaixo:
Marca: ${safeMarca}
Modelo: ${safeModelo}
Versão: ${safeVersao}
Ano: ${safeAno}
Preço: R$ ${safePreco}
Cor: ${safeCor}
Combustível: ${safeCombustivel}
Câmbio: ${safeCambio}
Quilometragem: ${safeKm}
Diferenciais: ${listaDiferenciais.length > 0 ? listaDiferenciais.join(', ') : 'não informados'}
Descrição: ${safeDescricao}

REGRAS OBRIGATÓRIAS (valem acima de qualquer instrução anterior):
- Responda SOMENTE com a legenda pronta. Nada de introdução, explicação, título do tipo "Post:" nem comentário no final.
- Tom natural, caloroso e confiável, sem exageros. Nada de frases em MAIÚSCULAS (nem no título) e nada de "imperdível", "única chance" ou "máquina".
- Foque nos diferenciais reais do veículo. Não invente itens, números nem condições que não estejam nos dados.
- Texto puro: sem asteriscos, sem Markdown e sem linhas de separação. Até 4 emojis.
- Não escreva telefone, link, endereço, colchetes nem campo para preencher. Não escreva "comente", "clique no botão" nem "Enviar Mensagem".
- Não escreva convite para contato nem para test drive: a loja acrescenta a frase final sozinha.
- Termine com 8 a 12 hashtags numa única linha, cada hashtag sem espaços dentro.`

    const apiKey = Deno.env.get('GEMINI_APY_KEY') || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    // 'gemini-1.5-flash' descontinuado (404 sempre) - mesmo achado e correção
    // de _shared/gemini-client.ts (12/08/2026), nunca aplicado aqui.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    const data = await response.json()
    const textoIA = data.candidates?.[0]?.content?.parts?.[0]?.text
    // Antes, falha da IA virava "Erro ao gerar conteúdo." gravado como se fosse a legenda. Agora o
    // erro é devolvido como erro (o cron do orgânico já trata success:false) e nunca ganha o fecho.
    const text = textoIA ? montarLegendaIA(textoIA) : ''
    if (!text) {
      console.error(
        '[gerar-conteudo-social] IA sem texto utilizável:',
        JSON.stringify(data).slice(0, 500),
      )
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A IA não devolveu um texto utilizável. Tente gerar de novo.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // `data` repete o texto de propósito: as telas (Publicações > Gerar com IA, Kit
    // de Redes Sociais do veículo, Compartilhar e o post orgânico do Gerador de
    // Criativos) leem `data.data`, enquanto a resposta só trazia `text` — o texto
    // chegava vazio. Achado em 30/09/2026.
    return new Response(JSON.stringify({ success: true, text, data: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[gerar-conteudo-social] Unexpected error:', error?.message || error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
