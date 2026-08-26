import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { gerarPdfDocumento } from '../_shared/pdf-generator.ts'

interface RequestBody {
  veiculo_id?: string
  document_type?: string
  proprietario_nome?: string
  proprietario_email?: string
  proprietario_cpf?: string
  proprietario_telefone?: string
  contrato_id?: string
  numero_contrato?: string
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
    return data[key] !== undefined ? data[key] : ''
  })
}

const DOC_NAMES: Record<string, string> = {
  consignacao: 'Contrato de Consignação',
  compra: 'Contrato de Compra',
  venda: 'Contrato de Venda',
  termo_entrega: 'Termo de Entrega',
}

// Reescrito em 18/08/2026 — achado durante a Documentação de API: a versão
// anterior não gerava PDF nenhum, só devolvia HTML pro navegador imprimir
// (sem upload, sem URL permanente). Isso é por que a assinatura eletrônica
// via Autentique nunca funcionou de ponta a ponta — precisa de uma URL de
// PDF real pra mandar pra lá. Agora segue o mesmo padrão real de
// gerar-pdf-proposta/gerar-pdf-avaliacao (jsPDF + upload) e cria/atualiza
// um registro em contratos_consignacao (ampliada com tipo_documento pra
// cobrir venda/compra/termo_entrega, não só consignação).
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
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (!body.veiculo_id && !body.proprietario_nome) {
      return new Response(
        JSON.stringify({ error: 'veiculo_id ou proprietario_nome é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const docType = body.document_type || 'consignacao'
    if (!DOC_NAMES[docType]) {
      return new Response(JSON.stringify({ error: `document_type inválido: ${docType}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
    const docName = DOC_NAMES[docType]

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
        proprietario_nome: body.proprietario_nome || veiculo.proprietario_nome || '',
        proprietario_cpf: body.proprietario_cpf || veiculo.proprietario_cpf || '',
        proprietario_email: body.proprietario_email || veiculo.proprietario_email || '',
        proprietario_telefone: body.proprietario_telefone || veiculo.proprietario_telefone || '',
        veiculo_modelo: veiculo.modelo || '',
        veiculo_id: veiculo.id || '',
        marca: veiculo.marca || '',
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
        proprietario_cpf: body.proprietario_cpf || '',
        proprietario_email: body.proprietario_email || '',
        proprietario_telefone: body.proprietario_telefone || '',
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
    const pdfBytes = gerarPdfDocumento(docName, renderedContent)

    // Número do contrato: usa o informado, ou o de um contrato existente
    // (regeneração), ou gera um novo sequencial simples.
    let numeroContrato = body.numero_contrato
    if (!numeroContrato && body.contrato_id) {
      const { data: existente } = await supabase
        .from('contratos_consignacao')
        .select('numero_contrato')
        .eq('id', body.contrato_id)
        .maybeSingle()
      numeroContrato = existente?.numero_contrato || undefined
    }
    if (!numeroContrato) {
      const { count } = await supabase
        .from('contratos_consignacao')
        .select('*', { count: 'exact', head: true })
      numeroContrato = `CTR-${(count || 0) + 1}`
    }

    const filePath = `contratos/pdf/${docType}_${numeroContrato}_${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('contratos-consignacao')
      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // O bucket contratos-consignacao é privado (tem CPF/telefone de cliente,
    // diferente do propostas-geradas que é público) — grava o CAMINHO no
    // banco, não uma URL pública. AssinaturaDialog.tsx já sabe gerar uma URL
    // assinada temporária a partir do caminho na hora de enviar pra
    // assinatura, então isso não quebra nada — só evita expor o PDF
    // permanentemente sem controle.
    const { data: signedUrlData } = await supabase.storage
      .from('contratos-consignacao')
      .createSignedUrl(filePath, 3600)

    const contratoRow = {
      veiculo_id: body.veiculo_id || null,
      tipo_documento: docType,
      proprietario_nome: vehicleData.proprietario_nome || null,
      proprietario_email: vehicleData.proprietario_email || null,
      proprietario_cpf: vehicleData.proprietario_cpf || null,
      proprietario_telefone: vehicleData.proprietario_telefone || null,
      numero_contrato: numeroContrato,
      pdf_url: filePath,
    }

    let contratoId = body.contrato_id
    if (contratoId) {
      const { error: updateError } = await supabase
        .from('contratos_consignacao')
        .update(contratoRow)
        .eq('id', contratoId)
      if (updateError) throw updateError
    } else {
      const { data: novoContrato, error: insertError } = await supabase
        .from('contratos_consignacao')
        .insert(contratoRow)
        .select('id')
        .single()
      if (insertError) throw insertError
      contratoId = novoContrato.id
    }

    return new Response(
      JSON.stringify({
        success: true,
        contrato_id: contratoId,
        url: signedUrlData?.signedUrl || null,
        document_type: docType,
        document_name: docName,
        numero_contrato: numeroContrato,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (error) {
    console.error('Erro ao gerar documento:', error)
    return new Response(
      JSON.stringify({
        error: 'Erro interno ao gerar documento',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
