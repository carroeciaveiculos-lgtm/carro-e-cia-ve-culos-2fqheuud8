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
}

export interface MlConfig {
  allowedListingTypes: string[]
  supabase: SupabaseClient
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  corrections: Partial<{
    title: string
    description: string
    listing_type_id: string
    condition: string
  }>
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
    titulo = base
    if (combustivel) titulo += ` ${combustivel}`
    if (cambio) titulo += ` ${cambio}`
    titulo = titulo.replace(/\s+/g, ' ').trim()
  }

  if (titulo.length > 60) {
    if (!campos_removidos.includes('Combustível')) campos_removidos.push('Combustível')
    titulo = base
    if (cambio) titulo += ` ${cambio}`
    titulo = titulo.replace(/\s+/g, ' ').trim()
  }

  if (titulo.length > 60) {
    if (!campos_removidos.includes('Câmbio')) campos_removidos.push('Câmbio')
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
  let filtered = descricao
  filtered = filtered.replace(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, '')
  filtered = filtered.replace(/\b\d{10,11}\b/g, '')
  filtered = filtered.replace(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '')
  filtered = filtered.replace(/https?:\/\/(?:wa\.me|whatsapp\.com|api\.whatsapp)[^\s]*/gi, '')
  filtered = filtered.replace(/wa\.me\/\d+/gi, '')
  filtered = filtered.replace(
    /https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|telegram)[^\s]*/gi,
    '',
  )
  filtered = filtered.replace(/\b(?:whatsapp|wpp|zap\s+zap|ligue\s+para)\b/gi, '')
  filtered = filtered
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return filtered
}

export async function validarPayloadML(
  veiculo: VeiculoRecord,
  config: MlConfig,
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const corrections: any = {}

  const titleResult = montarTituloML(veiculo)
  corrections.title = titleResult.titulo
  if (titleResult.truncado) {
    warnings.push(
      `Título truncado para 60 caracteres. Campos removidos: ${titleResult.campos_removidos.join(', ')}`,
    )
  }

  if (config.supabase && veiculo.marca) {
    const { data: brandData } = await config.supabase
      .from('ml_attribute_cache')
      .select('ml_value_id')
      .eq('attribute_id', 'BRAND')
      .or(`crm_value.ilike.${veiculo.marca},ml_value_name.ilike.${veiculo.marca}`)
      .limit(1)
      .maybeSingle()
    if (!brandData) {
      warnings.push(
        `Marca "${veiculo.marca}" não encontrada no cache do ML. Pode ser necessário popular o cache.`,
      )
    }
  }

  if (veiculo.descricao) {
    const filtered = filtrarDescricao(veiculo.descricao)
    if (filtered !== veiculo.descricao) {
      warnings.push(
        'Informações de contato removidas da descrição para conformidade com regras do ML.',
      )
      corrections.description = filtered
    }
  }

  const precoVenda = Number(veiculo.preco_venda)
  const valorFipe = Number(veiculo.valor_fipe)
  if (precoVenda > 0 && valorFipe > 0) {
    const diff = Math.abs(precoVenda - valorFipe) / valorFipe
    if (diff > 0.3) {
      warnings.push(`Preço de venda difere mais de 30% do valor FIPE (R$ ${valorFipe.toFixed(2)}).`)
    }
  }

  const fotoCount = Array.isArray(veiculo.fotos) ? veiculo.fotos.length : 0
  if (fotoCount < 3) {
    errors.push(`Mínimo de 3 fotos obrigatório. Encontradas: ${fotoCount}`)
  }

  if (veiculo.is_zero_km === null || veiculo.is_zero_km === undefined) {
    warnings.push('Campo is_zero_km não definido. Usando false como padrão.')
    corrections.condition = 'used'
  }

  if (!veiculo.proprietario_cidade) {
    errors.push('Cidade do proprietário não informada')
  }
  if (!veiculo.proprietario_estado) {
    errors.push('Estado do proprietário não informado')
  }

  if (config.allowedListingTypes.length > 0 && veiculo.ml_listing_type) {
    const resolvedType = veiculo.ml_listing_type
    if (!config.allowedListingTypes.includes(resolvedType)) {
      const downgrade = LISTING_TYPE_HIERARCHY.find((t) => config.allowedListingTypes.includes(t))
      if (downgrade) {
        warnings.push(`Tipo ${resolvedType} indisponível. Downgrade automático para ${downgrade}.`)
        corrections.listing_type_id = downgrade
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings, corrections }
}
