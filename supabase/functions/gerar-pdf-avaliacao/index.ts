import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { gerarPdfDocumento } from '../_shared/pdf-generator.ts'

// Parte da feature "Avaliação de Veículo" (17/08/2026) — gera a proposta em
// PDF pro cliente a partir de uma linha de avaliacoes_veiculo. Mesmo padrão
// de gerar-pdf-proposta (template editável em /admin/modelos-documentos,
// tipo "proposta_avaliacao").
function formatCurrency(value: number | null | undefined): string {
  if (!value || isNaN(value)) return 'A combinar'
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
    const { avaliacao_id } = await req.json()
    if (!avaliacao_id) {
      return new Response(JSON.stringify({ error: 'avaliacao_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: avaliacao, error: avaliacaoError } = await supabase
      .from('avaliacoes_veiculo')
      .select('*, leads(nome, telefone)')
      .eq('id', avaliacao_id)
      .single()

    if (avaliacaoError || !avaliacao) {
      return new Response(JSON.stringify({ error: 'Avaliação não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: template } = await supabase
      .from('document_templates')
      .select('content, name')
      .eq('document_type', 'proposta_avaliacao')
      .maybeSingle()

    const dados: Record<string, string> = {
      proprietario_nome: avaliacao.leads?.nome || '',
      proprietario_telefone: avaliacao.leads?.telefone || '',
      marca: avaliacao.marca || '',
      veiculo_modelo: avaliacao.modelo || '',
      placa: avaliacao.placa || '',
      ano_fabricacao: String(avaliacao.ano_fabricacao || ''),
      ano_modelo: String(avaliacao.ano_modelo || ''),
      cor: avaliacao.cor || '',
      combustivel: avaliacao.combustivel || '',
      cambio: avaliacao.cambio || '',
      quilometragem: avaliacao.quilometragem
        ? Number(avaliacao.quilometragem).toLocaleString('pt-BR')
        : '0',
      estado_conservacao: avaliacao.estado_conservacao || 'Não informado',
      itens_opcionais: Array.isArray(avaliacao.itens_opcionais)
        ? avaliacao.itens_opcionais.join(', ')
        : 'Nenhum informado',
      valor_proposto: formatCurrency(avaliacao.valor_proposto),
    }

    const conteudoBase =
      template?.content ||
      'PROPOSTA DE AVALIAÇÃO\n\nCliente: {{proprietario_nome}}\nVeículo: {{marca}} {{veiculo_modelo}}\nValor proposto: {{valor_proposto}}'
    const corpo = replaceMarkers(conteudoBase, dados)
    const pdfBytes = gerarPdfDocumento(template?.name || 'Proposta de Avaliação', corpo)

    const filePath = `avaliacoes/avaliacao_${avaliacao_id}_${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('propostas-geradas')
      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: urlData } = supabase.storage.from('propostas-geradas').getPublicUrl(filePath)

    await supabase
      .from('avaliacoes_veiculo')
      .update({ destino: 'proposta_enviada', updated_at: new Date().toISOString() })
      .eq('id', avaliacao_id)

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
