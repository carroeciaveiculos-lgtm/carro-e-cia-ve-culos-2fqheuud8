import { supabase } from '@/lib/supabase/client'

export interface CnpjData {
  razao_social: string
  nome_fantasia: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
}

export async function consultarCnpj(cnpj: string): Promise<CnpjData> {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.')
  }
  const { data, error } = await supabase.functions.invoke('consultar-cnpj', {
    body: { cnpj: cleanCnpj },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.message || 'Erro ao consultar CNPJ')
  return data as CnpjData
}
