import { supabase } from '@/lib/supabase/client'

export interface PhotoValidationResult {
  hasEnoughPhotos: boolean
  photoCount: number
  missingCategories: string[]
  suggestedOrder: number[]
}

export async function validatePhotoGallery(fotos: string[]): Promise<PhotoValidationResult> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: {
      prompt: `Valide a galeria de fotos deste veiculo. Ele tem ${fotos.length} fotos. A regra e ter 18 fotos obrigatorias cobrindo: frente, traseira, lateral esquerda, lateral direita, teto, motor, painel, bancos dianteiros, bancos traseiros, porta-malas, rodas dianteiras, rodas traseiras, retrovisores, console central, volante, hodometro, radiador, e detalhe da cor. Retorne JSON com hasEnoughPhotos (boolean), photoCount (number), missingCategories (array de strings), suggestedOrder (array de indices numericos).`,
      context: `Fotos disponiveis: ${fotos.length}`,
    },
  })
  if (error || !data?.result) {
    return {
      hasEnoughPhotos: fotos.length >= 18,
      photoCount: fotos.length,
      missingCategories: fotos.length < 18 ? ['Minimo 18 fotos necessarias'] : [],
      suggestedOrder: fotos.map((_, i) => i),
    }
  }
  try {
    return JSON.parse(data.result)
  } catch {
    return {
      hasEnoughPhotos: fotos.length >= 18,
      photoCount: fotos.length,
      missingCategories: [],
      suggestedOrder: fotos.map((_, i) => i),
    }
  }
}

export async function suggestVehiclePricing(
  marca: string,
  modelo: string,
  ano: number,
  km: number,
  valorFipe?: number,
): Promise<{ suggestedPrice: number; reasoning: string }> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: {
      prompt: `Sugira um preco de venda competitivo para um ${marca} ${modelo} ${ano} com ${km} km no mercado de Uberaba MG. Valor FIPE: ${valorFipe ?? 'N/A'}. Retorne JSON: {"suggestedPrice": number, "reasoning": "string em portugues"}`,
      context: 'Mercado de veiculos seminovos em Uberaba MG',
    },
  })
  if (error || !data?.result)
    return { suggestedPrice: valorFipe ?? 0, reasoning: 'Nao foi possivel gerar sugestao' }
  try {
    return JSON.parse(data.result)
  } catch {
    return { suggestedPrice: valorFipe ?? 0, reasoning: data.result }
  }
}

export async function diagnosePortalError(errorMsg: string, platform: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: {
      prompt: `Traduza este erro da plataforma ${platform} para uma instrucao clara em portugues para o usuario: "${errorMsg}". Responda apenas com a instrucao, sem JSON.`,
      context: `Plataforma: ${platform}`,
    },
  })
  if (error || !data?.result) return errorMsg
  return data.result
}

export async function analyzeStagnantVehicle(
  diasNoEstoque: number,
  marca: string,
  modelo: string,
  precoAtual: number,
  visualizacoes: number,
): Promise<{ recommendation: string; suggestedAction: string }> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: {
      prompt: `Analise este veiculo parado no estoque: ${marca} ${modelo}, ${diasNoEstoque} dias no estoque, preco atual R$ ${precoAtual}, ${visualizacoes} visualizacoes. Sugira acao: ajuste de preco, upgrade de tier de anuncio (ex: Upgrade para Diamante), ou outra estrategia. Retorne JSON: {"recommendation": "string em portugues", "suggestedAction": "string em portugues"}`,
      context: 'Consultoria preditiva de estoque',
    },
  })
  if (error || !data?.result)
    return { recommendation: 'Sem recomendacao disponivel', suggestedAction: 'Nenhuma' }
  try {
    return JSON.parse(data.result)
  } catch {
    return { recommendation: data.result, suggestedAction: 'Revisar manualmente' }
  }
}
