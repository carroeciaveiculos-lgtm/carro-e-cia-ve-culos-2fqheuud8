import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tipo, dados } = await req.json()

    const title = tipo
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `DOCUMENTO DE ${title.toUpperCase()}`,
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Este é um documento gerado automaticamente pelo sistema Carro e Cia Veículos.',
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    })

    const b64string = await Packer.toBase64String(doc)

    return new Response(
      JSON.stringify({
        success: true,
        document: b64string,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
