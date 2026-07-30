import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

interface RequestBody {
  veiculo_id?: string
  document_type?: string
  proprietario_nome?: string
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

function formatCurrency(value: number | null | undefined): string {
  if (!value || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR')
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function replaceMarkers(content: string, data: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return data[key] !== undefined ? escapeHtml(data[key]) : ''
  })
}

function buildHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',serif;font-size:12px;line-height:1.6;color:#1a1a1a;padding:40px}
.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:15px}
.header h1{font-size:18px;font-weight:bold}
.header p{font-size:11px;color:#555;margin-top:3px}
.content{white-space:pre-wrap;text-align:justify}
.signatures{margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:60px}
.sig-block{text-align:center}
.sig-line{border-top:1px solid #333;margin-top:60px;padding-top:5px;font-size:10px}
.footer{margin-top:40px;text-align:center;font-size:10px;color:#777;border-top:1px solid #eee;padding-top:10px}
@media print{@page{margin:20mm}}
</style>
</head>
<body>
<div class="header">
<h1>CARRO E CIA VEÍCULOS</h1>
<p>CNPJ: 10.196.974/0001-46 · AV GUILHERME FERREIRA, 1119 - São Benedito, Uberaba - MG</p>
<p>Telefone: (34) 3316-7701</p>
</div>
<div class="content">${bodyContent}</div>
<div class="signatures">
<div class="sig-block"><div class="sig-line">${escapeHtml('Proprietário / Cliente')}</div></div>
<div class="sig-block"><div class="sig-line">Carro e Cia Veículos</div></div>
</div>
<div class="footer"><p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} · TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA</p></div>
</body>
</html>`
}

const DOC_NAMES: Record<string, string> = {
  consignacao: 'Contrato de Consignação',
  compra: 'Contrato de Compra',
  venda: 'Contrato de Venda',
  termo_entrega: 'Termo de Entrega',
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

    let body: RequestBody
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição inválido. JSON esperado.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    if (!body.veiculo_id && !body.proprietario_nome) {
      return new Response(
        JSON.stringify({ error: 'veiculo_id ou proprietario_nome é obrigatório' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const docType = body.document_type || 'consignacao'
    const docName = DOC_NAMES[docType] || DOC_NAMES.consignacao

    let vehicleData: Record<string, any> = {}

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

      vehicleData = {
        proprietario_nome: veiculo.proprietario_nome || body.proprietario_nome || '',
        proprietario_cpf: veiculo.proprietario_cpf || '',
        proprietario_email: veiculo.proprietario_email || '',
        proprietario_telefone: veiculo.proprietario_telefone || '',
        veiculo_modelo: veiculo.modelo || '',
        veiculo_id: veiculo.id || '',
        marca: veiculo.marca || '',
        versao: veiculo.versao || '',
        placa: veiculo.placa || '',
        chassi: veiculo.chassi || '',
        renavam: veiculo.renavam || '',
        ano_fabricacao: String(veiculo.ano_fabricacao || ''),
        ano_modelo: String(veiculo.ano_modelo || ''),
        preco_venda: formatCurrency(veiculo.preco_venda),
        cor: veiculo.cor || '',
        combustivel: veiculo.combustivel || '',
        cambio: veiculo.cambio || '',
        quilometragem: veiculo.quilometragem ? veiculo.quilometragem.toLocaleString('pt-BR') : '0',
        data_entrega: formatDate(new Date().toISOString()),
      }
    } else {
      vehicleData = {
        proprietario_nome: body.proprietario_nome || '',
        data_entrega: formatDate(new Date().toISOString()),
      }
    }

    let templateContent = ''
    try {
      const { data: template } = await supabase
        .from('document_templates')
        .select('content')
        .eq('document_type', docType)
        .single()
      templateContent = template?.content || ''
    } catch {
      templateContent = ''
    }

    if (!templateContent) {
      templateContent = `${docName}\n\nProprietário: {{proprietario_nome}}\nCPF: {{proprietario_cpf}}\n\nVeículo: {{marca}} {{veiculo_modelo}}\nPlaca: {{placa}}\nAno: {{ano_fabricacao}}/{{ano_modelo}}\nValor: {{preco_venda}}`
    }

    const renderedContent = replaceMarkers(templateContent, vehicleData)
    const html = buildHtml(docName, escapeHtml(renderedContent).replace(/\n/g, '<br>'))

    return new Response(
      JSON.stringify({
        success: true,
        html,
        document_type: docType,
        document_name: docName,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (error) {
    console.error('Erro ao gerar documento:', error)
    return new Response(
      JSON.stringify({
        error: 'Erro interno ao gerar documento',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})
