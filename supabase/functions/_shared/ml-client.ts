import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface MLCredentials {
  access_token: string
  refresh_token: string
  expires_at: string
}

const LISTING_TYPE_MAP: Record<string, string> = {
  diamante: 'gold_pro',
  prata: 'silver',
  gold_pro: 'gold_pro',
  gold_special: 'gold_special',
  silver: 'silver',
}

function fixMojibakeLatin1ToUtf8(input: string): string {
  return input
    .replace(/Ã£/g, 'ã')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ã´/g, 'ô')
    .replace(/Ãµ/g, 'õ')
    .replace(/Ãº/g, 'ú')
    .replace(/Ãœ/g, 'Ü')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/ÃŠ/g, 'Ê')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ã”/g, 'Ô')
    .replace(/Ã•/g, 'Õ')
    .replace(/Ãš/g, 'Ú')
}

export function normalizeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const fixed = fixMojibakeLatin1ToUtf8(value)
  const trimmed = fixed.trim().toLowerCase()
  if (trimmed.length === 0) return null
  const noDiacritics = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const collapsed = noDiacritics.replace(/\s+/g, ' ').trim()
  if (collapsed.length === 0) return null
  return collapsed
}

function lookupNormalized(value: unknown, map: Record<string, string>): string | null {
  const normalized = normalizeValue(value)
  if (normalized === null) return null
  return map[normalized] || null
}

// Valores conferidos direto na API pública do ML (GET
// /categories/MLB1744/attributes) em 12/08/2026 — achado real: "Flex" não é
// um valor aceito pro atributo FUEL_TYPE (causava erro 400 silencioso, só
// visível como JSON cru no log). Nomes errados nunca usados ainda (Prata,
// Vinho, CVT, Automatizada, Sedán, Picape) também corrigidos aqui antes de
// darem o mesmo problema em outro veículo.
const ML_FUEL_MAP: Record<string, string> = {
  flex: 'Gasolina e álcool',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  alcool: 'Álcool',
  hibrido: 'Híbrido',
  eletrico: 'Elétrico',
}

const ML_TRANSMISSION_MAP: Record<string, string> = {
  manual: 'Manual',
  automatico: 'Automática',
  automatica: 'Automática',
  automatizada: 'Semiautomática',
  cvt: 'Automática CVT',
}

const ML_STEERING_MAP: Record<string, string> = {
  hidraulica: 'Hidráulica',
  eletrica: 'Elétrica',
  mecanica: 'Mecânica',
}

const ML_COLOR_MAP: Record<string, string> = {
  branco: 'Branco',
  preto: 'Preto',
  prata: 'Prateado',
  vermelho: 'Vermelho',
  azul: 'Azul',
  verde: 'Verde',
  amarelo: 'Amarelo',
  cinza: 'Cinza',
  marrom: 'Marrom',
  bege: 'Bege',
  dourado: 'Dourado',
  vinho: 'Bordô',
}

export const ML_BODY_TYPE_MAP: Record<
  string,
  { id: string; name: string; esportivo_fallback?: boolean }
> = {
  suv: { id: '452759', name: 'SUV' },
  picape: { id: '452756', name: 'Pick-Up' },
  hatch: { id: '479344', name: 'Hatch' },
  sedan: { id: '452758', name: 'Sedã' },
  van: { id: '452755', name: 'Van' },
  esportivo: { id: '452749', name: 'Coupé', esportivo_fallback: true },
}

// Traduz erro de sincronização (nosso ou do ML) pra uma frase curta em
// português que o operador entenda, sem precisar ler JSON. Usado por
// sync-plataforma na hora de gravar o erro e mostrar na tela.
const ML_ATTR_LABELS: Record<string, string> = {
  FUEL_TYPE: 'Tipo de combustível',
  VEHICLE_BODY_TYPE: 'Tipo de carroceria',
  COLOR: 'Cor',
  TRANSMISSION: 'Câmbio',
  STEERING: 'Direção',
  KILOMETERS: 'Quilometragem',
  ENGINE_DISPLACEMENT: 'Cilindrada',
  PLATE_FINAL_DIGIT: 'Final da placa',
  BRAND: 'Marca',
  MODEL: 'Modelo',
  VEHICLE_YEAR: 'Ano',
  DOORS: 'Portas',
  TRIM: 'Versão',
}

export function traduzirErroSyncML(rawMessage: string): string {
  const missingMatch = /Missing mandatory attribute\(s\): (.+)/i.exec(rawMessage)
  if (missingMatch) {
    const labels = missingMatch[1]
      .split(',')
      .map((id) => ML_ATTR_LABELS[id.trim()] || id.trim())
    return `Faltam informações obrigatórias no cadastro pro Mercado Livre: ${labels.join(', ')}.`
  }

  try {
    const data = JSON.parse(rawMessage)
    const causas = Array.isArray(data?.cause) ? data.cause : []
    const bloqueantes = causas.filter((c: any) => !c.type || c.type === 'error')
    if (bloqueantes.length > 0) {
      const frases = bloqueantes.map((c: any) => {
        if (c.code === 'item.address.city_id.not_found') {
          return 'a cidade cadastrada no sistema não é reconhecida pelo Mercado Livre'
        }
        const attrId = /\[([A-Z_]+)\]/.exec(c.message || '')?.[1]
        const label = attrId ? ML_ATTR_LABELS[attrId] || attrId : null
        if (label && c.code === 'item.attributes.missing_required') {
          return `o campo "${label}" é obrigatório e não foi enviado`
        }
        return label
          ? `o campo "${label}" foi rejeitado pelo Mercado Livre (valor não reconhecido)`
          : c.message || 'erro de validação não identificado'
      })
      const unicas = [...new Set(frases)]
      return `Mercado Livre recusou o anúncio: ${unicas.join('; ')}.`
    }
    if (data?.message) return `Mercado Livre recusou o anúncio: ${data.message}`
  } catch {
    // não é JSON — provavelmente já é uma mensagem nossa, em português
  }
  return rawMessage
}

export function getVehicleBodyType(
  categoria: string | null | undefined,
): { id: string; name: string; esportivo_fallback?: boolean } | null {
  if (!categoria) return null
  return ML_BODY_TYPE_MAP[categoria.toLowerCase().trim()] || null
}

export function resolveListingType(mlListingType: string | null | undefined): string {
  if (!mlListingType) return 'gold_special'
  const key = mlListingType.toLowerCase()
  return LISTING_TYPE_MAP[key] || mlListingType
}

export async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      return res
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
        continue
      }
    }
  }
  throw lastError || new Error('Max retries exceeded')
}

export async function lookupMLCityId(token: string, zipCode: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mercadolibre.com/countries/BR/zip_codes/${zipCode}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.city?.id || null
  } catch {
    return null
  }
}

export async function getValidMLToken(
  supabase: SupabaseClient,
): Promise<{ token: string | null; error: string | null }> {
  const { data: cred, error } = await supabase
    .from('ml_credentials')
    .select('access_token, refresh_token, expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !cred) {
    return { token: null, error: 'No ML credentials found. Please authenticate first.' }
  }

  const now = new Date()
  const expires = new Date(cred.expires_at)
  const buffer = 15 * 60 * 1000

  if (expires.getTime() - now.getTime() > buffer) {
    return { token: cred.access_token, error: null }
  }

  const clientId = Deno.env.get('ML_CLIENT_ID')!
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET')!

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: cred.refresh_token,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { token: null, error: `Token refresh failed: ${errText}` }
  }

  const tokenData = await res.json()
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabase
    .from('ml_credentials')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('access_token', cred.access_token)

  return { token: tokenData.access_token, error: null }
}

export function formatVehicleTitle(v: any): string {
  const modelo = (v.modelo || '').trim()
  const versao = (v.versao || '').trim()
  const versaoComplementar =
    versao && !modelo.toLowerCase().includes(versao.toLowerCase()) ? versao : ''
  const parts = [v.marca, modelo, versaoComplementar].filter(Boolean)
  const yearPart = v.ano_modelo ? ` ${v.ano_modelo}` : ''
  return `${parts.join(' ')}${yearPart}`.substring(0, 60)
}

export async function checkMLPackages(
  token: string,
): Promise<{ hasPackage: boolean; activeCount: number; error: string | null }> {
  try {
    const userRes = await fetchWithBackoff('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) {
      return {
        hasPackage: false,
        activeCount: 0,
        error: 'Não foi possível obter informações do usuário',
      }
    }
    const user = await userRes.json()
    const listingsRes = await fetchWithBackoff(
      `https://api.mercadolibre.com/users/${user.id}/items/search?status=active&search_type=classifieds`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!listingsRes.ok) {
      return {
        hasPackage: false,
        activeCount: 0,
        error: 'Não foi possível verificar anúncios ativos',
      }
    }
    const listings = await listingsRes.json()
    return { hasPackage: true, activeCount: listings.results?.length || 0, error: null }
  } catch (err: any) {
    return { hasPackage: false, activeCount: 0, error: err.message }
  }
}

export async function fetchCategoryAttributes(
  token: string,
  categoryId = 'MLB1744',
): Promise<string[]> {
  try {
    const res = await fetch(`https://api.mercadolibre.com/categories/${categoryId}/attributes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const attrs = await res.json()
    return attrs
      .filter((a: any) => a.tags?.required === true || a.required === true)
      .map((a: any) => a.id)
  } catch {
    return []
  }
}

// CRÍTICO — CORRIGIDO em 12/08/2026 (auditoria de vazamento de dado, pedido
// da Adriana): usava proprietario_logradouro/numero/bairro/cep — o endereço
// RESIDENCIAL de quem consignou o carro — como local do anúncio PÚBLICO no
// Mercado Livre. Isso publicava o endereço pessoal do dono na internet, em
// todo anúncio já sincronizado. Agora usa o endereço fixo da loja (mesmo
// texto usado em public-inventory-feed e no prompt da Clara).
const ENDERECO_LOJA = {
  logradouro: 'Av. Guilherme Ferreira, 1131',
  bairro: 'São Benedito',
  cep: '38022200',
}

function buildLocation(_v: any, cityId?: string | null): any {
  const location: any = {
    address_line: `${ENDERECO_LOJA.logradouro}, ${ENDERECO_LOJA.bairro}`,
  }
  // Formato conferido na documentação oficial do ML (publicacao-de-automoveis):
  // a cidade vai aninhada em location.city.id, não em location.city_id "solto"
  // — o ML não reconhecia o campo solto e recusava o anúncio.
  if (cityId) location.city = { id: cityId }
  if (ENDERECO_LOJA.cep) location.zip_code = ENDERECO_LOJA.cep
  return location
}

// cilindrada no cadastro aceita tanto litros ("1.5") quanto cc direto
// ("1598"), sem padrão fixo. O ML só aceita um número em cc como texto
// (ex.: "1500cc"), então valores pequenos (<10) são tratados como litros.
function formatCilindradaCC(cilindrada: string | null | undefined): string | undefined {
  if (!cilindrada) return undefined
  const raw = parseFloat(String(cilindrada).replace(',', '.'))
  if (!raw || Number.isNaN(raw)) return undefined
  const cc = raw < 10 ? Math.round(raw * 1000) : Math.round(raw)
  return `${cc}cc`
}

function buildAttributes(v: any, isZeroKm: boolean): any[] {
  const bodyType = getVehicleBodyType(v.categoria)
  if (!bodyType) {
    const categoriasAceitas = Object.keys(ML_BODY_TYPE_MAP)
      .map((k) => ML_BODY_TYPE_MAP[k].name)
      .join(', ')
    throw new Error(
      `Categoria do veículo ('${v.categoria || 'em branco'}') não é reconhecida pelo Mercado Livre. Categorias aceitas: ${categoriasAceitas}.`,
    )
  }
  return [
    { id: 'VEHICLE_TYPE', value_id: '398351', value_name: 'Carros e caminhonetes' },
    { id: 'VEHICLE_BODY_TYPE', value_id: bodyType.id, value_name: bodyType.name },
    { id: 'BRAND', value_name: v.marca || undefined },
    { id: 'MODEL', value_name: v.modelo || undefined },
    { id: 'VEHICLE_YEAR', value_name: v.ano_modelo ? String(v.ano_modelo) : undefined },
    {
      id: 'KILOMETERS',
      value_name: v.quilometragem != null ? `${Number(v.quilometragem)}km` : undefined,
    },
    {
      id: 'COLOR',
      value_name: v.cor
        ? (lookupNormalized(v.cor, ML_COLOR_MAP) ?? normalizeValue(v.cor) ?? undefined)
        : undefined,
    },
    {
      id: 'FUEL_TYPE',
      value_name: v.combustivel
        ? (lookupNormalized(v.combustivel, ML_FUEL_MAP) ??
          normalizeValue(v.combustivel) ??
          undefined)
        : undefined,
    },
    {
      id: 'TRANSMISSION',
      value_name: v.cambio
        ? (lookupNormalized(v.cambio, ML_TRANSMISSION_MAP) ?? normalizeValue(v.cambio) ?? undefined)
        : undefined,
    },
    { id: 'DOORS', value_name: v.portas ? String(v.portas) : undefined },
    {
      id: 'STEERING',
      value_name: v.direcao
        ? (lookupNormalized(v.direcao, ML_STEERING_MAP) ?? normalizeValue(v.direcao) ?? undefined)
        : undefined,
    },
    { id: 'ENGINE_DISPLACEMENT', value_name: formatCilindradaCC(v.cilindrada) },
    { id: 'TRIM', value_name: v.versao || undefined },
    { id: 'ITEM_CONDITION', value_name: isZeroKm ? 'Nuevo' : 'Usado' },
  ].filter((a: any) => a.value_name !== undefined || a.value_struct !== undefined)
}

export function buildMLItemPayload(
  v: any,
  listingType?: string,
  mandatoryAttrs?: string[],
  cityId?: string | null,
): any {
  const fotos: string[] = Array.isArray(v.fotos)
    ? v.fotos.filter((url: any) => typeof url === 'string')
    : []
  const resolvedListingType = resolveListingType(listingType || v.ml_listing_type)
  const isZeroKm = v.is_zero_km === true
  const condition = isZeroKm ? 'new' : 'used'
  const attributes = buildAttributes(v, isZeroKm)

  if (mandatoryAttrs && mandatoryAttrs.length > 0) {
    const presentIds = new Set(attributes.map((a) => a.id))
    const missing = mandatoryAttrs.filter((id) => !presentIds.has(id))
    if (missing.length > 0) {
      throw new Error(`Missing mandatory attribute(s): ${missing.join(', ')}`)
    }
  }

  return {
    title: formatVehicleTitle(v),
    category_id: 'MLB1744',
    price: Number(v.preco_venda) || 0,
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'classified',
    condition,
    listing_type_id: resolvedListingType,
    channels: ['marketplace'],
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes,
    location: buildLocation(v, cityId),
    description: { plain_text: v.descricao || `${v.marca} ${v.modelo}` },
  }
}

export function buildMLUpdatePayload(
  v: any,
  mandatoryAttrs?: string[],
  cityId?: string | null,
): any {
  const fotos: string[] = Array.isArray(v.fotos)
    ? v.fotos.filter((url: any) => typeof url === 'string')
    : []
  const isZeroKm = v.is_zero_km === true
  const attributes = buildAttributes(v, isZeroKm)

  if (mandatoryAttrs && mandatoryAttrs.length > 0) {
    const presentIds = new Set(attributes.map((a) => a.id))
    const missing = mandatoryAttrs.filter((id) => !presentIds.has(id))
    if (missing.length > 0) {
      throw new Error(`Missing mandatory attribute(s): ${missing.join(', ')}`)
    }
  }

  return {
    title: formatVehicleTitle(v),
    price: Number(v.preco_venda) || 0,
    pictures: fotos.map((url: string) => ({ source: url })),
    attributes,
    location: buildLocation(v, cityId),
    available_quantity: 1,
  }
}

export async function validatePhotos(
  photos: string[],
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  for (const url of photos) {
    if (!url.startsWith('https://')) {
      errors.push(`URL não é HTTPS: ${url}`)
      continue
    }
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        errors.push(`Imagem inacessível (HTTP ${res.status}): ${url}`)
      }
    } catch {
      try {
        const res2 = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          signal: AbortSignal.timeout(10000),
        })
        if (!res2.ok && res2.status !== 206) {
          errors.push(`Imagem inacessível (HTTP ${res2.status}): ${url}`)
        }
      } catch {
        errors.push(`Falha ao acessar imagem: ${url}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
