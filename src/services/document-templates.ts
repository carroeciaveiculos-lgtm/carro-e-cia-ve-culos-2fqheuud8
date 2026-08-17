import { supabase } from '@/lib/supabase/client'

export interface DocumentTemplate {
  id: string
  document_type: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export const DOCUMENT_TYPES = [
  { type: 'consignacao', label: 'Contrato de Consignação' },
  { type: 'compra', label: 'Contrato de Compra' },
  { type: 'venda', label: 'Contrato de Venda' },
  { type: 'termo_entrega', label: 'Termo de Entrega' },
  { type: 'proposta_comercial', label: 'Proposta Comercial (PDF)' },
  { type: 'proposta_avaliacao', label: 'Proposta de Avaliação (PDF)' },
] as const

export const TEMPLATE_MARKERS = [
  'proprietario_nome',
  'proprietario_cpf',
  'proprietario_email',
  'proprietario_telefone',
  'veiculo_modelo',
  'veiculo_id',
  'marca',
  'versao',
  'placa',
  'chassi',
  'renavam',
  'ano_fabricacao',
  'ano_modelo',
  'preco_venda',
  'cor',
  'combustivel',
  'cambio',
  'quilometragem',
  'data_entrega',
  'estado_conservacao',
  'itens_opcionais',
  'valor_proposto',
] as const

export async function fetchDocumentTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await (supabase as any)
    .from('document_templates')
    .select('*')
    .order('document_type')
  if (error) throw error
  return (data || []) as DocumentTemplate[]
}

export async function saveDocumentTemplate(documentType: string, content: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('document_templates')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('document_type', documentType)
  if (error) throw error
}

export function renderTemplate(content: string, data: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return data[key] !== undefined ? String(data[key]) : `{{${key}}}`
  })
}

export function getSampleData(): Record<string, string> {
  return {
    proprietario_nome: 'João da Silva',
    proprietario_cpf: '123.456.789-00',
    proprietario_email: 'joao@email.com',
    proprietario_telefone: '(34) 99999-9999',
    veiculo_modelo: 'Corolla',
    veiculo_id: '123e4567-e89b-12d3-a456-426614174000',
    marca: 'Toyota',
    versao: 'XE-R 2.0',
    placa: 'ABC1D23',
    chassi: '9BRBL8HE123456789',
    renavam: '12345678901',
    ano_fabricacao: '2022',
    ano_modelo: '2023',
    preco_venda: 'R$ 125.000,00',
    cor: 'Prata',
    combustivel: 'Flex',
    cambio: 'Automático',
    quilometragem: '25.000',
    data_entrega: new Date().toLocaleDateString('pt-BR'),
    estado_conservacao: 'Bom, com pequenos riscos na lateral direita',
    itens_opcionais: 'Bancos de couro, Teto solar, Central multimídia',
    valor_proposto: 'R$ 78.000,00',
  }
}
