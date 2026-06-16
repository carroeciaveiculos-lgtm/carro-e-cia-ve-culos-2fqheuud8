import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cor, placa, chassi, renavam, descricao, fotos, categoria, diferenciais, caracteristicas, is_consignado, is_zero_km',
      )
      .eq('status', 'disponivel')

    if (error) throw error

    const items = veiculos
      .map((v) => {
        const title = `${v.marca} ${v.modelo} ${v.versao || ''}`.trim()
        const description = v.descricao
          ? v.descricao.substring(0, 5000)
          : `${title} em excelente estado.`
        const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
        const imageLink =
          v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0
            ? v.fotos[0]
            : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp'
        const condition = v.is_zero_km ? 'new' : 'used'
        const price = v.preco_venda ? `${Number(v.preco_venda).toFixed(2)} BRL` : '0.00 BRL'
        const availability = 'in stock'

        return `
    <item>
      <g:id><![CDATA[${v.id}]]></g:id>
      <g:title><![CDATA[${title}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link><![CDATA[${link}]]></g:link>
      <g:image_link><![CDATA[${imageLink}]]></g:image_link>
      <g:condition><![CDATA[${condition}]]></g:condition>
      <g:price><![CDATA[${price}]]></g:price>
      <g:availability><![CDATA[${availability}]]></g:availability>
      <g:brand><![CDATA[${v.marca}]]></g:brand>
    </item>`
      })
      .join('')

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[Carro e Cia Veículos - Estoque]]></title>
    <link><![CDATA[https://www.carroeciamotors.com.br]]></link>
    <description><![CDATA[Catálogo de veículos disponíveis na Carro e Cia Veículos]]></description>
${items}
  </channel>
</rss>`

    return new Response(xmlFeed.trim(), {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
    })
  } catch (err: any) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error><![CDATA[${err.message}]]></error>`,
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
      },
    )
  }
})
