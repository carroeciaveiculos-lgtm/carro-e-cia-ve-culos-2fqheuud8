export function parseMarkdown(content: string): string {
  if (!content) return ''

  const hasHtmlTags =
    /<(h[1-6]|p|ul|ol|li|strong|em|a|div|section|table|blockquote|pre|code|img|br|hr)\b/i.test(
      content,
    )
  if (hasHtmlTags) return content

  let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`)

  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/^---+$/gm, '<hr />')

  const lines = html.split('\n')
  let result: string[] = []
  let inUl = false
  let inOl = false

  for (const line of lines) {
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/)
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/)

    if (ulMatch) {
      if (inOl) {
        result.push('</ol>')
        inOl = false
      }
      if (!inUl) {
        result.push('<ul>')
        inUl = true
      }
      result.push(`<li>${ulMatch[1]}</li>`)
    } else if (olMatch) {
      if (inUl) {
        result.push('</ul>')
        inUl = false
      }
      if (!inOl) {
        result.push('<ol>')
        inOl = true
      }
      result.push(`<li>${olMatch[1]}</li>`)
    } else {
      if (inUl) {
        result.push('</ul>')
        inUl = false
      }
      if (inOl) {
        result.push('</ol>')
        inOl = false
      }
      result.push(line)
    }
  }
  if (inUl) result.push('</ul>')
  if (inOl) result.push('</ol>')

  html = result.join('\n')

  const blocks = html.split(/\n\n+/)
  html = blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|div|section|table|img|p)/i.test(trimmed)) {
        return trimmed
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}
