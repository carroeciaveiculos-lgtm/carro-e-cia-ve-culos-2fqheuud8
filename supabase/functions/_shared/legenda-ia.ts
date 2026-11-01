// Limpeza e fecho da legenda escrita pela IA (gerar-conteudo-social) — 31/10/2026.
//
// Por que existe: a IA abria o texto com "Aqui está o post perfeito… pronto para copiar e colar",
// deixava campos para preencher ("[INSERIR LINK DO WHATSAPP AQUI]", "(XX) XXXXX-XXXX"), inventava
// aviso jurídico ("Reservamo-nos o direito…") e pedia "clique em Enviar Mensagem" / "comente EU QUERO"
// num post orgânico. Achado nos 24 rascunhos do orgânico diário (07 a 31/10/2026).
// O prompt pede para a IA não fazer isso, mas quem GARANTE o resultado é este código.
//
// Funções PURAS, sem imports: rodam em Deno e em Bun (o teste usa Bun).

const WHATSAPP_CLARA = '5534997384177' // Clara — atendimento geral (CLAUDE.md)

export const CTA_PREFIXO = 'Agende um teste drive agora mesmo pelo nosso WhatsApp:'

export function ctaTesteDrive(whatsapp: string = WHATSAPP_CLARA): string {
  return `${CTA_PREFIXO} https://wa.me/${whatsapp}`
}

// linha feita só de separadores/pontuação: "***", "---", "—", ".", "• "
const SO_SEPARADOR = /^[\s\-*_=—–.•]+$/

// frase de abertura da IA ("Aqui está…", "Basta copiar e colar o texto abaixo:")
// (sem \b no fim: o \b do JS não trata "á" como letra e "Aqui está" nunca casaria)
const ABERTURA_INICIO =
  /^(aqui est[aá]|segue|claro|certo|com certeza|perfeito|basta|pronto|ok)(?![a-zà-ú])/i
const ABERTURA_ASSUNTO = /post|legenda|texto|publica[cç][aã]o|copiar|colar|sugest|abaixo|bombar/i

// campos para preencher que a IA deixa no texto
const PLACEHOLDER_LINHA = new RegExp(
  [
    'ins[ei]r[a-z]*\\b.*\\baqui', // "Insira o seu link do WhatsApp aqui", "[INSERIR ... AQUI]"
    '\\[[^\\]]*(whatsapp|telefone|endere[cç]o|link|n[uú]mero)[^\\]]*\\]', // "[Inserir Link do WhatsApp ou Número]"
    'x{4,5}-?x{4}', // "(XX) XXXXX-XXXX"
  ].join('|'),
  'i',
)

// aviso inventado e chamadas que só fazem sentido em anúncio pago (post orgânico não tem botão)
const LINHA_PROIBIDA =
  /reservamo-nos o direito|valores sujeitos a altera|consulte nossos vendedores|bot[aã]o .?enviar mensagem|comente .?eu quero|deixe um coment[aá]rio/i

export function limparLegendaIA(entrada: string): string {
  let linhas = String(entrada ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/```[a-z]*/gi, '')
    .split('\n')
    // cabeçalho markdown ("### Título") vira texto simples; "#Hashtag" (sem espaço) não é tocado
    .map((l) => l.replace(/^\s{0,3}#{1,6}\s+/, ''))
    // negrito/itálico: "**texto**" -> "texto"; "* item" -> "• item"; sobra de asterisco sai
    .map((l) =>
      l
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/^\s*\*\s+/, '• ')
        .replace(/\*/g, '')
        .replace(/[ \t]+$/g, ''),
    )

  // 1) abertura da IA: só nas primeiras linhas, antes do texto de verdade
  const ehAbertura = (l: string) =>
    l.trim() !== '' &&
    (SO_SEPARADOR.test(l) ||
      (l.length <= 220 && ABERTURA_INICIO.test(l.trim()) && ABERTURA_ASSUNTO.test(l)) ||
      /copiar,? (e )?colar/i.test(l))
  while (linhas.length > 0 && (linhas[0].trim() === '' || ehAbertura(linhas[0]))) linhas.shift()

  // 2) campos para preencher, avisos inventados e separadores soltos em qualquer ponto
  linhas = linhas.filter(
    (l) =>
      l.trim() === '' ||
      !(SO_SEPARADOR.test(l) || PLACEHOLDER_LINHA.test(l) || LINHA_PROIBIDA.test(l)),
  )

  return linhas
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Texto final do post: legenda limpa + frase de teste drive SEMPRE por último e idêntica em todos
// os posts. Se a IA já escreveu a frase (ou parte dela), ela é trocada pela versão certa.
export function montarLegendaIA(entrada: string, whatsapp: string = WHATSAPP_CLARA): string {
  const cta = ctaTesteDrive(whatsapp)
  const corpo = limparLegendaIA(entrada)
    .split('\n')
    .filter((l) => !l.includes(CTA_PREFIXO))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return corpo ? `${corpo}\n\n${cta}` : ''
}
