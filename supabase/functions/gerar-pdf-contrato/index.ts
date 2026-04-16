import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const contratoData = body.contratoData

    if (!contratoData) {
      throw new Error('Dados do contrato ausentes para a geração do PDF.')
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Header
    page.drawText(`CONTRATO DE CONSIGNAÇÃO - ${contratoData.numeroContrato || 'S/N'}`, {
      x: 50,
      y: height - 50,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    })

    let currentY = height - 100
    const drawLine = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: 50, y: currentY, size: 12, font: fontBold })
      page.drawText(`${value || 'Não informado'}`, { x: 180, y: currentY, size: 12, font })
      currentY -= 20
    }

    // Proprietário
    page.drawText(`1. Dados do Proprietário`, { x: 50, y: currentY + 10, size: 14, font: fontBold })
    currentY -= 15
    drawLine('Nome/Razão Social', contratoData.proprietario?.nome)
    drawLine('CPF/CNPJ', contratoData.proprietario?.cpfCnpj || contratoData.proprietario?.cpf)
    drawLine('E-mail', contratoData.proprietario?.email)
    drawLine('Telefone', contratoData.proprietario?.telefone)

    currentY -= 20

    // Veículo
    page.drawText(`2. Dados do Veículo`, { x: 50, y: currentY + 10, size: 14, font: fontBold })
    currentY -= 15
    drawLine('Marca', contratoData.veiculo?.marca)
    drawLine('Modelo', contratoData.veiculo?.modelo)
    drawLine(
      'Ano/Modelo',
      `${contratoData.veiculo?.ano_fabricacao || ''}/${contratoData.veiculo?.ano_modelo || ''}`,
    )
    drawLine('Placa', contratoData.veiculo?.placa)
    drawLine('Chassi', contratoData.veiculo?.chassi)
    drawLine('Renavam', contratoData.veiculo?.renavam)

    currentY -= 20

    // Condições
    page.drawText(`3. Condições Comerciais`, { x: 50, y: currentY + 10, size: 14, font: fontBold })
    currentY -= 15
    drawLine('Valor Mínimo', `R$ ${contratoData.condicoes?.valor_minimo || '0,00'}`)
    drawLine('Comissão Acordada', `${contratoData.condicoes?.comissao || '0'}%`)

    const pdfBytes = await pdfDoc.save()

    const filename = `contrato_consignacao_${contratoData.numeroContrato || Date.now()}.pdf`
    const filePath = `contratos/pdf/${filename}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('contratos-consignacao')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_path: filePath,
        message: 'PDF gerado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
