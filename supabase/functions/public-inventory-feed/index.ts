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
        'id, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cor, placa, chassi, renavam, descricao, fotos, categoria, diferenciais, caracteristicas, is_consignado, is_zero_km, cambio',
      )
      .eq('status', 'disponivel')

    if (error) throw error

    const items = veiculos
      .map((v) => {
        const title = `${v.marca || ''} ${v.modelo || ''} ${v.versao || ''}`.trim()
        const description = v.descricao
          ? v.descricao.substring(0, 5000)
          : `${title} em excelente estado.`
        const link = `https://www.carroeciamotors.com.br/estoque/${v.id}`
        const imageLink =
          v.fotos && Array.isArray(v.fotos) && v.fotos.length > 0
            ? v.fotos[0]
            : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp'
        const price = v.preco_venda ? `${Number(v.preco_venda).toFixed(2)} BRL` : '0.00 BRL'

        return `
  <vehicle>
    <vehicle_id><![CDATA[${v.id}]]></vehicle_id>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <url><![CDATA[${link}]]></url>
    <make><![CDATA[${v.marca || ''}]]></make>
    <model><![CDATA[${v.modelo || ''}]]></model>
    <year><![CDATA[${v.ano_modelo || v.ano_fabricacao || ''}]]></year>
    <mileage>
      <value><![CDATA[${v.quilometragem || 0}]]></value>
      <unit><![CDATA[KM]]></unit>
    </mileage>
    <price><![CDATA[${price}]]></price>
    <exterior_color><![CDATA[${v.cor || ''}]]></exterior_color>
    <transmission><![CDATA[${v.cambio || ''}]]></transmission>
    <fuel_type><![CDATA[${v.combustivel || ''}]]></fuel_type>
    <body_style><![CDATA[${v.categoria || ''}]]></body_style>
    <vin><![CDATA[${v.chassi || ''}]]></vin>
    <image>
      <url><![CDATA[${imageLink}]]></url>
    </image>
  </vehicle>`
      })
      .join('')

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <title><![CDATA[Carro e Cia Veículos - Estoque]]></title>
  <link><![CDATA[https://www.carroeciamotors.com.br]]></link>
${items}
</listings>`

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
