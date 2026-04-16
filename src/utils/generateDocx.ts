import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx'
import { ContratoData } from '@/types/contrato'

/**
 * Gera um documento DOCX a partir dos dados do contrato.
 * @param data Dados do contrato.
 * @returns Promise<Blob> O documento DOCX como um Blob.
 */
export async function generateContratoDocx(data: ContratoData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'CARRO E CIA VEÍCULOS LTDA', bold: true, size: 36 })],
            alignment: 'center',
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Consignação de Veículos com Confiança e Transparência',
                size: 24,
              }),
            ],
            alignment: 'center',
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'CONTRATO DE CONSIGNAÇÃO DE VEÍCULO AUTOMOTOR',
                bold: true,
                size: 28,
              }),
            ],
            alignment: 'center',
            spacing: { after: 400 },
          }),

          // --- SEÇÃO 1: DADOS DO CONSIGNANTE ---
          new Paragraph({
            children: [
              new TextRun({
                text: '1. DADOS DO CONSIGNANTE (PROPRIETÁRIO DO VEÍCULO)',
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Nome Completo:')] }),
                  new TableCell({ children: [new Paragraph(data.proprietario.nome)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('CPF:')] }),
                  new TableCell({ children: [new Paragraph(data.proprietario.cpf)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('RG:')] }),
                  new TableCell({ children: [new Paragraph(data.proprietario.rg)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Telefone:')] }),
                  new TableCell({ children: [new Paragraph(data.proprietario.telefone)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Email:')] }),
                  new TableCell({ children: [new Paragraph(data.proprietario.email)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Endereço:')] }),
                  new TableCell({ children: [new Paragraph(data.proprietario.endereco)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Cidade/Estado:')] }),
                  new TableCell({
                    children: [
                      new Paragraph(`${data.proprietario.cidade}/${data.proprietario.estado}`),
                    ],
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
          }),
          new Paragraph({ spacing: { after: 400 } }),

          // --- SEÇÃO 2: DADOS DA LOJA ---
          new Paragraph({
            children: [
              new TextRun({ text: '2. DADOS DA CONSIGNATÁRIA (LOJA)', bold: true, size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Razão Social:')] }),
                  new TableCell({ children: [new Paragraph(data.loja.razaoSocial)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('CNPJ:')] }),
                  new TableCell({ children: [new Paragraph(data.loja.cnpj)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Endereço:')] }),
                  new TableCell({ children: [new Paragraph(data.loja.endereco)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Telefone:')] }),
                  new TableCell({ children: [new Paragraph(data.loja.telefone)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Responsável:')] }),
                  new TableCell({ children: [new Paragraph(data.loja.responsavel)] }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
          }),
          new Paragraph({ spacing: { after: 400 } }),

          // --- SEÇÃO 3: DADOS DO VEÍCULO ---
          new Paragraph({
            children: [
              new TextRun({ text: '3. DADOS DO VEÍCULO CONSIGNADO', bold: true, size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Placa:')] }),
                  new TableCell({ children: [new Paragraph(data.veiculo.placa)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Chassi:')] }),
                  new TableCell({ children: [new Paragraph(data.veiculo.chassi)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Marca/Modelo:')] }),
                  new TableCell({
                    children: [new Paragraph(`${data.veiculo.marca} ${data.veiculo.modelo}`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Ano Fabricação/Modelo:')] }),
                  new TableCell({
                    children: [new Paragraph(`${data.veiculo.anoFab}/${data.veiculo.anoModelo}`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Combustível:')] }),
                  new TableCell({ children: [new Paragraph(data.veiculo.combustivel)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Cor:')] }),
                  new TableCell({ children: [new Paragraph(data.veiculo.cor)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Quilometragem:')] }),
                  new TableCell({ children: [new Paragraph(`${data.veiculo.quilometragem} km`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Renavam:')] }),
                  new TableCell({ children: [new Paragraph(data.veiculo.renavam)] }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
          }),
          new Paragraph({ spacing: { after: 400 } }),

          // --- SEÇÃO 4: CONDIÇÕES COMERCIAIS ---
          new Paragraph({
            children: [new TextRun({ text: '4. CONDIÇÕES COMERCIAIS', bold: true, size: 24 })],
            spacing: { after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Preço de Venda Sugerido:')] }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `R$ ${data.condicoesComerciais.precoVendaSugerido.toFixed(2).replace('.', ',')}`,
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Preço Mínimo Aceito:')] }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `R$ ${data.condicoesComerciais.precoMinimoAceito.toFixed(2).replace('.', ',')}`,
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Comissão da Loja:')] }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `${data.condicoesComerciais.comissaoPercentual}% ou R$ ${data.condicoesComerciais.comissaoValor.toFixed(2).replace('.', ',')}`,
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Período de Consignação:')] }),
                  new TableCell({
                    children: [
                      new Paragraph(`${data.condicoesComerciais.periodoConsignacaoDias} dias`),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Data de Início:')] }),
                  new TableCell({ children: [new Paragraph(data.condicoesComerciais.dataInicio)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Data de Vencimento:')] }),
                  new TableCell({
                    children: [new Paragraph(data.condicoesComerciais.dataVencimento)],
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
          }),
          new Paragraph({ spacing: { after: 400 } }),

          // --- SEÇÃO 5: CLÁUSULAS IMPORTANTES ---
          new Paragraph({
            children: [
              new TextRun({ text: '5. CLÁUSULAS E RESPONSABILIDADES', bold: true, size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '5.1 Responsabilidade da Loja:', bold: true })],
          }),
          new Paragraph({ text: 'A Carro e Cia Veículos compromete-se a:' }),
          new Paragraph({ text: '• Manter o veículo em local seguro e protegido;' }),
          new Paragraph({
            text: '• Anunciar o veículo em plataformas de venda (iCarros, Webmotors, Mercado Livre);',
          }),
          new Paragraph({ text: '• Manter o veículo em bom estado de apresentação;' }),
          new Paragraph({
            text: '• Informar o proprietário sobre interessados e propostas de compra;',
          }),
          new Paragraph({ text: '• Realizar a venda dentro do período de consignação acordado.' }),
          new Paragraph({ spacing: { after: 200 } }),

          new Paragraph({
            children: [new TextRun({ text: '5.2 Responsabilidade do Proprietário:', bold: true })],
          }),
          new Paragraph({ text: 'O proprietário do veículo compromete-se a:' }),
          new Paragraph({ text: '• Fornecer documentação completa e original do veículo;' }),
          new Paragraph({
            text: '• Garantir que o veículo não possui ônus, restrições ou débitos;',
          }),
          new Paragraph({ text: '• Manter contato com a loja para atualizações;' }),
          new Paragraph({ text: '• Aceitar o preço final negociado dentro da faixa acordada.' }),
          new Paragraph({ spacing: { after: 200 } }),

          new Paragraph({
            children: [new TextRun({ text: '5.3 Rescisão do Contrato:', bold: true })],
          }),
          new Paragraph({
            text: 'Este contrato pode ser rescindido a qualquer momento por ambas as partes, com aviso prévio de 5 dias úteis.',
          }),
          new Paragraph({ spacing: { after: 400 } }),

          // --- SEÇÃO 6: ASSINATURAS ---
          new Paragraph({
            children: [new TextRun({ text: '6. ASSINATURAS E CONFIRMAÇÃO', bold: true, size: 24 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Pelo presente, as partes concordam com os termos e condições acima descritos.',
          }),
          new Paragraph({ spacing: { after: 400 } }),

          new Paragraph({
            children: [new TextRun({ text: `Uberaba, ${data.dataContrato}` })],
            alignment: 'center',
          }),
          new Paragraph({
            children: [new TextRun({ text: '' })],
            alignment: 'center',
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Assinatura do Proprietário' })],
            alignment: 'center',
          }),
          new Paragraph({
            children: [new TextRun({ text: data.proprietario.nome })],
            alignment: 'center',
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: `Uberaba, ${data.dataContrato}` })],
            alignment: 'center',
          }),
          new Paragraph({
            children: [new TextRun({ text: '' })],
            alignment: 'center',
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Assinatura da Loja' })],
            alignment: 'center',
          }),
          new Paragraph({
            children: [new TextRun({ text: data.loja.razaoSocial })],
            alignment: 'center',
            spacing: { after: 400 },
          }),

          // Rodapé
          new Paragraph({
            children: [
              new TextRun({ text: `Contrato de Consignação - ${data.loja.razaoSocial}`, size: 16 }),
            ],
            alignment: 'center',
            spacing: { before: 800 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Número do Contrato: ${data.numeroContrato}`, size: 16 }),
            ],
            alignment: 'center',
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                size: 16,
              }),
            ],
            alignment: 'center',
          }),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
