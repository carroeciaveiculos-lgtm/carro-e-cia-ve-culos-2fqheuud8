import { jsPDF } from 'npm:jspdf@2.5.2'

// Geração de PDF real (17/08/2026) — substitui o gerar-pdf-proposta antigo,
// que era 100% fake (PDF fixo com texto "Mocked PDF", nunca lia os dados
// reais). jsPDF roda direto na Edge Function (Deno), sem precisar de
// browser/Puppeteer — testado isoladamente antes de usar aqui.
export function gerarPdfDocumento(titulo: string, corpo: string): Uint8Array {
  const doc = new jsPDF()
  const margemEsquerda = 20
  const larguraUtil = 170
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('CARRO E CIA VEÍCULOS', 105, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text('CNPJ: 10.196.974/0001-46 · Av. Guilherme Ferreira, 1119 - Uberaba/MG', 105, y, {
    align: 'center',
  })
  y += 3
  doc.setDrawColor(180)
  doc.line(margemEsquerda, y, margemEsquerda + larguraUtil, y)
  y += 10

  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(titulo, margemEsquerda, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const linhas = doc.splitTextToSize(corpo, larguraUtil)
  for (const linha of linhas) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(linha, margemEsquerda, y)
    y += 5.5
  }

  if (y > 240) {
    doc.addPage()
    y = 20
  } else {
    y += 20
  }
  doc.setFontSize(9)
  doc.text('_______________________________', margemEsquerda, y)
  doc.text('_______________________________', margemEsquerda + 90, y)
  y += 5
  doc.text('Cliente', margemEsquerda + 25, y)
  doc.text('Carro e Cia Veículos', margemEsquerda + 105, y)

  doc.setFontSize(7)
  doc.setTextColor(140)
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} · TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA`,
    105,
    290,
    { align: 'center' },
  )

  return new Uint8Array(doc.output('arraybuffer'))
}
