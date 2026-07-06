export interface ValidationCheck {
  name: string
  passed: boolean
  detail: string
}

export interface ValidationResult {
  passed: boolean
  checks: ValidationCheck[]
}

export function validateSeoContent(html: string, metaDescription?: string): ValidationResult {
  const checks: ValidationCheck[] = []

  const textContent = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const wordCount = textContent.split(' ').filter((w) => w.length > 0).length
  checks.push({
    name: 'Word Count',
    passed: wordCount >= 2500,
    detail: `${wordCount} palavras (mínimo: 2500)`,
  })

  const h4Matches = html.match(/<h4[^>]*>/gi) || []
  checks.push({
    name: 'FAQ Questions (H4)',
    passed: h4Matches.length >= 5 && h4Matches.length <= 7,
    detail: `${h4Matches.length} perguntas (esperado: 5-7)`,
  })

  const tableMatches = html.match(/<table[^>]*>/gi) || []
  checks.push({
    name: 'Data Tables',
    passed: tableMatches.length >= 1,
    detail: `${tableMatches.length} tabelas (mínimo: 1)`,
  })

  const linkMatches = html.match(/<a[^>]+href=["'](\/[^"']*)["']/gi) || []
  checks.push({
    name: 'Internal Links',
    passed: linkMatches.length >= 5,
    detail: `${linkMatches.length} links internos (mínimo: 5)`,
  })

  if (metaDescription) {
    const metaLen = metaDescription.length
    checks.push({
      name: 'Meta Description Length',
      passed: metaLen >= 155 && metaLen <= 160,
      detail: `${metaLen} caracteres (esperado: 155-160)`,
    })
  }

  const uberabaCount = (html.match(/Uberaba/gi) || []).length
  checks.push({
    name: 'Local SEO (Uberaba)',
    passed: uberabaCount >= 5,
    detail: `${uberabaCount} menções (mínimo: 5)`,
  })

  const passed = checks.every((c) => c.passed)
  return { passed, checks }
}
