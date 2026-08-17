import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { gerarPdfDocumento } from '../_shared/pdf-generator.ts'

// Reescrito em 17/08/2026 — achado em auditoria: a versão anterior fazia
// upload de um PDF fixo (base64 hardcoded, texto "Mocked PDF"), ignorando
// completamente veiculo/cliente. Nunca tinha sido usada de verdade
// (confirmado: zero arquivos em storage/documentos/propostas/ antes desta
// correção), mas o botão "Gerar Proposta PDF Automática" em /admin/crm já
// existe há tempo — agora gera o PDF de verdade, com o template editável
// em /admin/modelos-documentos (tipo "proposta_comercial").
function formatCurrency(value: number | null | undefined): string {
  if (!value || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function replaceMarkers(content: string, data: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return data[key] !== undefined ? data[key] : ''
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { veiculo, cliente } = await req.json()
    if (!veiculo || !cliente) {
      return new Response(JSON.stringify({ error: 'veiculo e cliente são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: template } = await supabase
      .from('document_templates')
      .select('content, name')
      .eq('document_type', 'proposta_comercial')
      .maybeSingle()

    const dados: Record<string, string> = {
      proprietario_nome: cliente.nome || '',
      proprietario_telefone: cliente.telefone || '',
      marca: veiculo.marca || '',
      veiculo_modelo: veiculo.modelo || '',
      versao: veiculo.versao || '',
      placa: veiculo.placa || '',
      ano_fabricacao: String(veiculo.ano_fabricacao || ''),
      ano_modelo: String(veiculo.ano_modelo || ''),
      cor: veiculo.cor || '',
      combustivel: veiculo.combustivel || '',
      cambio: veiculo.cambio || '',
      quilometragem: veiculo.quilometragem ? Number(veiculo.quilometragem).toLocaleString('pt-BR') : '0',
      preco_venda: formatCurrency(veiculo.preco_venda),
    }

    const conteudoBase =
      template?.content ||
      'PROPOSTA COMERCIAL\n\nCliente: {{proprietario_nome}}\nVeículo: {{marca}} {{veiculo_modelo}}\nValor: {{preco_venda}}'
    const corpo = replaceMarkers(conteudoBase, dados)
    const pdfBytes = gerarPdfDocumento(template?.name || 'Proposta Comercial', corpo)

    const filePath = `comerciais/proposta_${cliente?.id || 'gen'}_${Date.now()}.pdf`
    const { error } = await supabase.storage
      .from('propostas-geradas')
      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: urlData } = supabase.storage.from('propostas-geradas').getPublicUrl(filePath)

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
