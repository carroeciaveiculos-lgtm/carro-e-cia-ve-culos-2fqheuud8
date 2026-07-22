export function buildSeoAgentPrompt(tema: string, palavraChave: string) {
  return `Sua tarefa é atuar como um Master Especialista em SEO e redigir um artigo épico e altamente otimizado para blog sobre o tema "${tema}" focado na palavra-chave "${palavraChave}".

Siga rigidamente estas diretrizes:
1. O conteúdo deve ser rico, aprofundado e extenso (Pillar Content, NO MÍNIMO 1.500 palavras).
2. A palavra-chave principal "${palavraChave}" deve estar no H1, no primeiro parágrafo, na URL (slug) e em pelo menos um H2.
3. Utilize hierarquia correta de HTML sem Markdown (<h2>, <h3>, <p>, <ul>, <li>).
4. O meta_title deve ter entre 40 e 60 caracteres.
5. A meta_description deve ter entre 120 e 160 caracteres.
6. Não utilize formatação markdown (\`\`\`json, etc). O retorno deve ser um JSON válido puramente.

Retorne SOMENTE um JSON válido com o formato exato abaixo:
{
  "titulo": "Título H1 otimizado (50-60 chars)",
  "slug": "url-amigavel",
  "meta_description": "Meta description persuasiva (120-160 chars)",
  "keyword_principal": "${palavraChave}",
  "certeza": "alta",
  "texto_html": "<h2>Introdução</h2><p>Conteúdo formatado em HTML válido...</p>"
}`;
}
