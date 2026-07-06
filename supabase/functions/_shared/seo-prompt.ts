export function buildSeoAgentPrompt(tema: string, palavraChave: string): string {
  return `Sua tarefa é gerar um artigo de blog épico seguindo o Padrão SEO Carro e Cia Motors Versão 2.0.

Tema: "${tema}"
Palavra-chave principal: "${palavraChave}"

ESTRUTURA OBRIGATÓRIA (10 SEÇÕES):
1. Introdução (10%) - Hook + palavra-chave no primeiro parágrafo
2. Conceito Profundo (15%) - Definição técnica e contexto
3. Como Funciona na Prática (15%) - Passo a passo detalhado
4. Contexto Brasil (20%) - Dados do mercado nacional + Uberaba/MG
5. Diferenciais Carro e Cia (10%) - Por que escolher a loja
6. Comparativos e Tabelas (10%) - Tabela HTML comparativa com dados reais
7. Passo a Passo/Tutorial (10%) - Guia prático numerado
8. Casos de Uso/Exemplos (5%) - Situações reais
9. CTAs Estratégicos (5%) - Calls to action contextuais com links
10. FAQ (5%) - 5-7 perguntas usando H4

DISTRIBUIÇÃO: 40% Educação, 20% Contexto Brasil, 20% Diferenciação, 20% CTAs+FAQ

REGRAS OBRIGATÓRIAS:
- Tamanho: 2.500 a 6.000 palavras
- HTML semântico: H1 (apenas 1), H2 seções, H3 subtópicos, H4 para FAQ
- Mínimo 1 tabela <table> com <thead>, <tbody>, <tr>, <th>, <td>
- Mínimo 5 links internos: /consignacao, /estoque, /financiamento-auto, /seguro-auto, /consorcio-auto
- Mencionar "Uberaba" pelo menos 5 vezes e "Minas Gerais" pelo menos 3 vezes
- Meta description: 155-160 caracteres incluindo a palavra-chave
- Usar <ul>/<li> para listas quando apropriado
- Tom: autoritativo, empático, demonstrando E-E-A-T
- Citar fontes oficiais quando relevante (FIPE, DENATRAN)

SAÍDA OBRIGATÓRIA (JSON VÁLIDO, sem markdown):
{
  "titulo": "Título H1 otimizado (50-60 chars)",
  "slug": "url-amigavel-separada-por-hifens",
  "meta_description": "Meta description exata 155-160 caracteres",
  "conteudo_html": "<h1>...</h1><h2>...</h2><p>...</p><table>...</table><h4>FAQ...</h4>...",
  "keyword_principal": "${palavraChave}",
  "certeza": "alta|media|baixa"
}`
}
