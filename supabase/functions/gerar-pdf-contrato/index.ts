import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

interface ContratoData {
  veiculo_id?: string
  proprietario_nome?: string
  proprietario_cpf?: string
  proprietario_email?: string
  proprietario_telefone?: string
  proprietario_endereco?: string
  marca?: string
  modelo?: string
  versao?: string
  ano_fabricacao?: number
  ano_modelo?: number
  placa?: string
  chassi?: string
  renavam?: string
  cor?: string
  quilometragem?: number
  combustivel?: string
  cambio?: string
  valor_anuncio?: number
  valor_minimo?: number
  comissao?: number
  numero_contrato?: string
  data_entrada?: string
  data_vencimento?: string
}

function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(value: number | undefined | null): string {
  if (!value || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function buildContratoHtml(data: ContratoData): string {
  const today = new Date().toLocaleDateString('pt-BR')
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Consignação - ${escapeHtml(data.numero_contrato || 'N/A')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.6; color: #1a1a1a; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .header p { font-size: 11px; color: #555; }
    .title-section { text-align: center; margin: 25px 0; }
    .title-section h2 { font-size: 14px; font-weight: bold; text-transform: uppercase; }
    .section { margin-bottom: 20px; }
    .section h3 { font-size: 12px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 10px; }
    .info-grid .label { font-weight: bold; color: #444; }
    .info-grid .value { color: #1a1a1a; }
    .clause { margin-bottom: 12px; text-align: justify; }
    .clause .number { font-weight: bold; }
    .signatures { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
    .signature-block { text-align: center; }
    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 10px; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
    @page { margin: 20mm; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CARRO E CIA VEÍCULOS</h1>
    <p>CNPJ: XX.XXX.XXX/0001-XX | Endereço: Uberaba - MG</p>
  </div>
  <div class="title-section">
    <h2>Contrato de Consignação de Veículo</h2>
    <p>Nº ${escapeHtml(data.numero_contrato || 'N/A')}</p>
  </div>
  <div class="section">
    <h3>Identificação das Partes</h3>
    <div class="info-grid">
      <div class="label">CONSIGNANTE (Proprietário):</div>
      <div class="value">${escapeHtml(data.proprietario_nome || 'N/A')}</div>
      <div class="label">CPF:</div>
      <div class="value">${escapeHtml(data.proprietario_cpf || 'N/A')}</div>
      <div class="label">Telefone:</div>
      <div class="value">${escapeHtml(data.proprietario_telefone || 'N/A')}</div>
      <div class="label">E-mail:</div>
      <div class="value">${escapeHtml(data.proprietario_email || 'N/A')}</div>
      <div class="label">Endereço:</div>
      <div class="value">${escapeHtml(data.proprietario_endereco || 'N/A')}</div>
    </div>
    <div style="margin-top: 5px; font-size: 11px;">
      Pelo presente instrumento, o CONSIGNANTE confia ao CONSIGNATÁRIO (Carro e Cia Veículos) o veículo abaixo descrito, para fins de venda por consignação.
    </div>
  </div>
  <div class="section">
    <h3>Dados do Veículo</h3>
    <div class="info-grid">
      <div class="label">Marca/Modelo:</div>
      <div class="value">${escapeHtml(data.marca || 'N/A')} ${escapeHtml(data.modelo || '')}</div>
      <div class="label">Versão:</div>
      <div class="value">${escapeHtml(data.versao || 'N/A')}</div>
      <div class="label">Ano Fabricação/Modelo:</div>
      <div class="value">${data.ano_fabricacao || 'N/A'} / ${data.ano_modelo || 'N/A'}</div>
      <div class="label">Placa:</div>
      <div class="value">${escapeHtml(data.placa || 'N/A')}</div>
      <div class="label">Chassi:</div>
      <div class="value">${escapeHtml(data.chassi || 'N/A')}</div>
      <div class="label">RENAVAM:</div>
      <div class="value">${escapeHtml(data.renavam || 'N/A')}</div>
      <div class="label">Cor:</div>
      <div class="value">${escapeHtml(data.cor || 'N/A')}</div>
      <div class="label">Combustível:</div>
      <div class="value">${escapeHtml(data.combustivel || 'N/A')}</div>
      <div class="label">Câmbio:</div>
      <div class="value">${escapeHtml(data.cambio || 'N/A')}</div>
      <div class="label">Quilometragem:</div>
      <div class="value">${(data.quilometragem || 0).toLocaleString('pt-BR')} km</div>
    </div>
  </div>
  <div class="section">
    <h3>Valores e Condições</h3>
    <div class="info-grid">
      <div class="label">Valor de Anúncio:</div>
      <div class="value">${formatCurrency(data.valor_anuncio)}</div>
      <div class="label">Valor Mínimo Aceito:</div>
      <div class="value">${formatCurrency(data.valor_minimo)}</div>
      <div class="label">Comissão do Consignatário:</div>
      <div class="value">${formatCurrency(data.comissao)}</div>
      <div class="label">Data de Entrada:</div>
      <div class="value">${formatDate(data.data_entrada)}</div>
      <div class="label">Data de Vencimento:</div>
      <div class="value">${formatDate(data.data_vencimento)}</div>
    </div>
  </div>
  <div class="section">
    <h3>Claúsulas e Condições</h3>
    <div class="clause">
      <span class="number">Cláusula 1ª.</span> O CONSIGNANTE declara ser o legítimo proprietário do veículo descrito, livre e desembaraçado de quaisquer ônus ou dívidas, assumindo total responsabilidade civil e criminal pela veracidade desta declaração.
    </div>
    <div class="clause">
      <span class="number">Cláusula 2ª.</span> O CONSIGNATÁRIO fica autorizado a anunciar e expor o veículo para venda em suas instalações, plataformas digitais e classificados, pelo valor de anúncio estipulado, não podendo vender por valor inferior ao mínimo aceito sem autorização expressa do CONSIGNANTE.
    </div>
    <div class="clause">
      <span class="number">Cláusula 3ª.</span> A comissão do CONSIGNATÁRIO será paga mediante a diferença entre o valor de venda efetivo e o valor a ser repassado ao CONSIGNANTE, conforme valores acordados neste contrato.
    </div>
    <div class="clause">
      <span class="number">Cláusula 4ª.</span> O veículo permanecerá sob responsabilidade do CONSIGNATÁRIO durante o período de consignação. Em caso de dano, roubo ou furto durante este período, o CONSIGNATÁRIO ressarcirá o CONSIGNANTE pelo valor mínimo aceito.
    </div>
    <div class="clause">
      <span class="number">Cláusula 5ª.</span> Este contrato tem validade a partir da data de entrada e vence na data de vencimento acima estipulada. Findo o prazo, o veículo deverá ser devolvido ao CONSIGNANTE ou o contrato poderá ser renovado mediante acordo entre as partes.
    </div>
    <div class="clause">
      <span class="number">Cláusula 6ª.</span> As partes elegem o foro da Comarca de Uberaba/MG para dirimir quaisquer dúvidas oriundas deste contrato.
    </div>
  </div>
  <div class="signatures">
    <div class="signature-block">
      <div class="signature-line">${escapeHtml(data.proprietario_nome || 'Consignante')}</div>
      <p>CONSIGNANTE</p>
    </div>
    <div class="signature-block">
      <div class="signature-line">Carro e Cia Veículos</div>
      <p>CONSIGNATÁRIO</p>
    </div>
  </div>
  <div class="footer">
    <p>Contrato gerado em ${today} | Carro e Cia Veículos - Uberaba/MG</p>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let body: ContratoData
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição inválido. JSON esperado.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (!body.veiculo_id && !body.proprietario_nome) {
      return new Response(
        JSON.stringify({ error: 'veiculo_id ou proprietario_nome é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    let contratoData: ContratoData = { ...body }

    if (body.veiculo_id) {
      const { data: veiculo, error: veiculoError } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', body.veiculo_id)
        .single()

      if (veiculoError || !veiculo) {
        return new Response(JSON.stringify({ error: 'Veículo não encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      contratoData = {
        ...contratoData,
        proprietario_nome: contratoData.proprietario_nome || veiculo.proprietario_nome,
        proprietario_cpf: contratoData.proprietario_cpf || veiculo.proprietario_cpf,
        proprietario_email: contratoData.proprietario_email || veiculo.proprietario_email,
        proprietario_telefone: contratoData.proprietario_telefone || veiculo.proprietario_telefone,
        proprietario_endereco:
          contratoData.proprietario_endereco ||
          [
            veiculo.proprietario_logradouro,
            veiculo.proprietario_numero,
            veiculo.proprietario_bairro,
            veiculo.proprietario_cidade,
            veiculo.proprietario_estado,
          ]
            .filter(Boolean)
            .join(', '),
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        versao: veiculo.versao,
        ano_fabricacao: veiculo.ano_fabricacao,
        ano_modelo: veiculo.ano_modelo,
        placa: veiculo.placa,
        chassi: veiculo.chassi,
        renavam: veiculo.renavam,
        cor: veiculo.cor,
        quilometragem: veiculo.quilometragem,
        combustivel: veiculo.combustivel,
        cambio: veiculo.cambio,
        valor_anuncio: contratoData.valor_anuncio || veiculo.preco_venda,
        valor_minimo: contratoData.valor_minimo || veiculo.preco_minimo,
      }
    }

    if (!contratoData.numero_contrato) {
      const now = new Date()
      contratoData.numero_contrato = `CCV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    }

    if (!contratoData.data_entrada) {
      contratoData.data_entrada = new Date().toISOString()
    }

    if (!contratoData.data_vencimento) {
      const venc = new Date()
      venc.setDate(venc.getDate() + 90)
      contratoData.data_vencimento = venc.toISOString()
    }

    const html = buildContratoHtml(contratoData)

    return new Response(
      JSON.stringify({
        success: true,
        html,
        numero_contrato: contratoData.numero_contrato,
        data_entrada: contratoData.data_entrada,
        data_vencimento: contratoData.data_vencimento,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (error) {
    console.error('Erro ao gerar PDF do contrato:', error)
    return new Response(
      JSON.stringify({
        error: 'Erro interno ao gerar contrato',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
