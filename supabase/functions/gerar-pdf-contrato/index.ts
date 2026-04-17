import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()

    // Use dynamic import for 'docx' to prevent Vite from resolving and processing it
    // in case this Edge Function file is imported in the frontend for type sharing.
    // This fixes the "Module 'buffer' has been externalized for browser compatibility" build error.
    const docxModule = await import('npm:docx@8.6.0')
    const { Document, Packer, Paragraph, TextRun } = docxModule

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Contrato',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    })

    const b64 = await Packer.toBase64String(doc)
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="contrato.docx"',
      },
    })
  } catch (error) {
    const err = error as Error
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
