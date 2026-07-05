export interface BlogPostImageInfo {
  image_url?: string | null
  category?: string | null
  title?: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  'Vender Carro': 'bg-[#25D366] text-white',
  'Comprar Carro': 'bg-[#3b82f6] text-white',
  'Crédito e Finanças': 'bg-[#a855f7] text-white',
  'Manutenção e Mobilidade': 'bg-[#f97316] text-white',
  'Estilo de Vida': 'bg-[#ef4444] text-white',
}

export function getCategoryColor(category?: string | null): string {
  return CATEGORY_COLORS[category || ''] || 'bg-primary text-white'
}

export function getBlogImageUrl(post: BlogPostImageInfo, width = 600, height = 338): string {
  if (
    post?.image_url &&
    post.image_url.trim() !== '' &&
    !post.image_url.includes('modelo-veiculo') &&
    !post.image_url.includes('consignacao')
  ) {
    return post.image_url.replace(/\.(jpg|jpeg|png)$/, '.webp')
  }

  const titleWords = (post?.title || '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(' ')
  let searchContext = 'car dealership'

  const cat = post?.category || ''
  const titleLower = (post?.title || '').toLowerCase()

  if (cat === 'Vender Carro' || titleLower.includes('vender') || titleLower.includes('consigna'))
    searchContext = 'car sale agreement'
  else if (
    cat === 'Comprar Carro' ||
    titleLower.includes('comprar') ||
    titleLower.includes('seminovo')
  )
    searchContext = 'buying used car'
  else if (
    cat === 'Crédito e Finanças' ||
    titleLower.includes('financ') ||
    titleLower.includes('crédito')
  )
    searchContext = 'car finance money'
  else if (cat === 'Manutenção e Mobilidade' || titleLower.includes('manuten'))
    searchContext = 'car maintenance mechanic'
  else if (cat === 'Estilo de Vida') searchContext = 'lifestyle car driving'
  else if (titleWords.length > 0) searchContext = `car ${titleWords.slice(0, 2).join(' ')}`

  const query = encodeURIComponent(searchContext)
  let color = 'gray'
  if (cat === 'Vender Carro') color = 'green'
  else if (cat === 'Comprar Carro') color = 'blue'
  else if (cat === 'Crédito e Finanças') color = 'purple'
  else if (cat === 'Manutenção e Mobilidade') color = 'orange'
  else if (cat === 'Estilo de Vida') color = 'red'

  return `https://img.usecurling.com/p/${width}/${height}?q=${query}&color=${color}&dpr=2`
}

export function extractFAQSchema(content: string): { question: string; answer: string }[] | null {
  const faqMatch = content.match(
    /<h2[^>]*>(?:.*?(?:FAQ|Perguntas Frequentes).*?)<\/h2>([\s\S]*?)(?:<h2|$)/i,
  )
  if (!faqMatch) return null

  const faqSection = faqMatch[1]
  const pairs = faqSection.matchAll(
    /<h3[^>]*>(.*?)<\/h3>\s*(?:<p[^>]*>(.*?)<\/p>|(<ul[\s\S]*?<\/ul>))/gis,
  )
  const faqs: { question: string; answer: string }[] = []

  for (const match of pairs) {
    const question = match[1].replace(/<[^>]+>/g, '').trim()
    const answerText = match[2] || match[3] || ''
    const answer = answerText.replace(/<[^>]+>/g, '').trim()
    if (question && answer) faqs.push({ question, answer })
  }

  return faqs.length > 0 ? faqs : null
}

export function formatUpdateDate(dateString?: string | null): string | null {
  if (!dateString) return null
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return null
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]
  return `${months[d.getMonth()]} de ${d.getFullYear()}`
}
