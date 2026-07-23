import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface VeiculoRecord {
  ano_modelo?: number | string | null
  marca?: string | null
  modelo?: string | null
  versao?: string | null
  combustivel?: string | null
  cambio?: string | null
  descricao?: string | null
  preco_venda?: number | string | null
  valor_fipe?: number | string | null
  fotos?: any[] | null
  is_zero_km?: boolean | null
  proprietario_cidade?: string | null
  proprietario_estado?: string | null
  ml_listing_type?: string | null
  quilometragem?: number | null
  cor?: string | null
  portas?: number | null
  direcao?: string | null
  cilindrada?: string | null
  final_placa?: string | null
  categoria?: string | null
  codigo_fipe?: string | null
}

export interface MlConfig {
  allowedListingTypes: string[]
  supabase: SupabaseClient
}

export interface MLValidationResult {
  success: boolean
  blockingErrors: string[]
  qualityAlerts: string[]
  corrections: Partial<{
    title: string
    description: string
    listing_type_id: string
    condition: string
  }>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  corrections: Record<string, any>
}

const LISTING_TYPE_HIERARCHY = [
  'gold_premium',
  'gold_pro',
  'gold_special',
  'gold',
  'silver',
  'classic',
  'bronze',
]

export function montarTituloML(veiculo: VeiculoRecord): {
  titulo: string
  truncado: boolean
  campos_removidos: string[]
} {
  const ano = veiculo.ano_modelo ? String(veiculo.ano_modelo) : ''
  const marca = veiculo.marca || ''
  const modelo = veiculo.modelo || ''
  const versao = veiculo.versao || ''
  const combustivel = veiculo.combustivel || ''
  const cambio = veiculo.cambio || ''
  const base = `${ano} ${marca} ${modelo}`.trim().replace(/\s+/g, ' ')
  const campos_removidos: string[] = []
  let titulo = base
  if (versao) titulo += ` ${versao}`
  if (combustivel) titulo += ` ${combustivel}`
  if (cambio) titulo += ` ${cambio}`
  titulo = titulo.replace(/\s+/g, ' ').trim()
  if (titulo.length > 60) {
    campos_removidos.push('Versão')
    titulo = `${base} ${combustivel} ${cambio}`.trim()
  }
  if (titulo.length > 60) {
    campos_removidos.push('Combustível')
    titulo = `${base} ${cambio}`.trim()
  }
  if (titulo.length > 60) {
    campos_removidos.push('Câmbio')
    titulo = base
  }
  let truncado = campos_removidos.length > 0
  if (titulo.length > 60) {
    titulo = titulo.substring(0, 60)
    truncado = true
  }
  return { titulo, truncado, campos_removidos }
}

export function filtrarDescricao(descricao: string): string {
  if (!descricao) return ''
  let f = descricao
  f = f.replace(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, '').replace(/\b\d{10,11}\b/g, '')
  f = f.replace(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '')
  f = f
    .replace(/https?:\/\/(?:wa\.me|whatsapp\.com|api\.whatsapp)[^\s]*/gi, '')
    .replace(/wa\.me\/\d+/gi, '')
  f = f.replace(/https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|telegram)[^\s]*/gi, '')
  f = f
    .replace(/\b(?:whatsapp|wpp|zap\s+zap|ligue\s+para)\b/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return f
}

export async function validarPayloadML(
  veiculo: VeiculoRecord,
  config: MlConfig,
): Promise<MLValidationResult> {
  const blockingErrors: string[] = []
  const qualityAlerts: string[] = []
  const corrections: any = {}

  const titleResult = montarTituloML(veiculo)
  corrections.title = titleResult.titulo
  if (!titleResult.titulo || titleResult.titulo.trim().length < 5)
    blockingErrors.push('Título muito curto ou vazio após construção')
  if (titleResult.truncado)
    qualityAlerts.push(
      `Título truncado. Campos removidos: ${titleResult.campos_removidos.join(', ')}`,
    )

  const fotoCount = Array.isArray(veiculo.fotos) ? veiculo.fotos.length : 0
  if (fotoCount === 0) {
    blockingErrors.push('Nenhuma foto cadastrada (mínimo 1)')
  } else {
    const httpsPhotos = veiculo.fotos!.filter(
      (f: any) => typeof f === 'string' && f.startsWith('https://'),
    )
    if (httpsPhotos.length === 0) blockingErrors.push('Nenhuma foto com URL HTTPS válida')
  }
  if (fotoCount > 0 && fotoCount < 8)
    qualityAlerts.push(`Apenas ${fotoCount} fotos (recomendado: 8+)`)

  const isZeroKm = veiculo.is_zero_km === true
  const condition = isZeroKm ? 'new' : 'used'
  corrections.condition = condition
  if (!['used', 'new', 'not_specified'].includes(condition))
    blockingErrors.push('Condição do veículo inválida')

  if (!veiculo.descricao || veiculo.descricao.trim().length === 0) {
    blockingErrors.push('Descrição não pode estar vazia')
  }

  const precoVenda = Number(veiculo.preco_venda) || 0
  if (precoVenda < 1000)
    blockingErrors.push(`Preço abaixo do mínimo (R$ 1.000). Atual: R$ ${precoVenda}`)

  const valorFipe = Number(veiculo.valor_fipe) || 0
  if (valorFipe <= 0) {
    blockingErrors.push('Valor FIPE não informado')
  } else {
    const diff = Math.abs(precoVenda - valorFipe) / valorFipe
    if (diff > 0.3)
      blockingErrors.push(`Preço difere mais de 30% do FIPE (R$ ${valorFipe.toFixed(2)})`)
  }

  if (!veiculo.proprietario_cidade) blockingErrors.push('Cidade do proprietário não informada')
  if (!veiculo.proprietario_estado) blockingErrors.push('Estado do proprietário não informado')

  if (!veiculo.codigo_fipe && !veiculo.valor_fipe)
    qualityAlerts.push('Dados FIPE ausentes — categoria pode não ser compatível')

  if (config.supabase && veiculo.marca) {
    const { data: brandAlias } = await config.supabase
      .from('ml_brand_aliases')
      .select('brand_ml_id')
      .eq('brand_crm', veiculo.marca)
      .maybeSingle()
    if (!brandAlias) blockingErrors.push(`Marca "${veiculo.marca}" não mapeada em ml_brand_aliases`)

    const { data: perfScore } = await config.supabase
      .from('ml_quality_scores')
      .select('score')
      .eq('veiculo_id', (veiculo as any).id)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (perfScore?.score != null && perfScore.score < 70)
      qualityAlerts.push(`Score de performance anterior baixo: ${perfScore.score}/100`)
  }

  if (config.allowedListingTypes.length > 0 && veiculo.ml_listing_type) {
    if (!config.allowedListingTypes.includes(veiculo.ml_listing_type)) {
      const downgrade = LISTING_TYPE_HIERARCHY.find((t) => config.allowedListingTypes.includes(t))
      if (downgrade) {
        qualityAlerts.push(
          `Tipo ${veiculo.ml_listing_type} indisponível. Downgrade para ${downgrade}.`,
        )
        corrections.listing_type_id = downgrade
      }
    }
  }

  if (veiculo.descricao) {
    const filtered = filtrarDescricao(veiculo.descricao)
    if (filtered !== veiculo.descricao) {
      qualityAlerts.push('Informações de contato removidas da descrição')
      corrections.description = filtered
    }
  }

  return { success: blockingErrors.length === 0, blockingErrors, qualityAlerts, corrections }
}

export async function validatePayload(
  payload: any,
  veiculo: VeiculoRecord,
  config?: Partial<MlConfig>,
): Promise<ValidationResult> {
  const fullConfig: MlConfig = {
    allowedListingTypes: config?.allowedListingTypes || [],
    supabase: config?.supabase || (null as any),
  }
  const result = await validarPayloadML(veiculo, fullConfig)
  return {
    valid: result.success,
    errors: result.blockingErrors,
    warnings: result.qualityAlerts,
    corrections: result.corrections,
  }
}
