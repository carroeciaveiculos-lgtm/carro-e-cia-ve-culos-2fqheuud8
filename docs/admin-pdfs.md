# Geração de PDF (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18.

## Resumo — 2 padrões bem diferentes, apesar do nome parecido

| Function | Gera PDF de verdade? | Como |
|---|---|---|
| `gerar-pdf-proposta` | ✅ Sim | jsPDF (`_shared/pdf-generator.ts`) → upload real no bucket `propostas-geradas` (Supabase Storage) → devolve URL pública |
| `gerar-pdf-avaliacao` | ✅ Sim | Mesmo padrão de `gerar-pdf-proposta`, mesmo bucket |
| `gerar-pdf-contrato` | ❌ **Não** | Monta um HTML pronto pra impressão e devolve **no corpo da resposta** (`{ html: "..." }`) — não gera arquivo, não salva em lugar nenhum |

## `gerar-pdf-proposta` e `gerar-pdf-avaliacao`

Mesmo padrão nas duas: buscam o template editável em `document_templates`
(`/admin/modelos-documentos`, tipos `proposta_comercial` e
`proposta_avaliacao`), substituem os `{{marcadores}}` pelos dados reais do
veículo/cliente/avaliação, geram o PDF com `gerarPdfDocumento()` (jsPDF) e
sobem pro bucket `propostas-geradas` do Supabase Storage. `gerar-pdf-proposta`
foi reescrita do zero em 17/08/2026 — a versão anterior fazia upload de um
PDF fixo com texto "Mocked PDF", nunca usada de verdade (zero arquivos reais
antes da correção, ver `MEMORY_WORK.MD`).

## `gerar-pdf-contrato` — não gera PDF, e isso explica outro achado

Apesar do nome, essa function monta HTML (com CSS de impressão,
`@media print`) e devolve no JSON de resposta — quem vira PDF de verdade é o
**navegador**, não o servidor. Confirmado nos dois consumidores dela:

- **`ContratoPdfGenerator.tsx`**: abre uma janela nova, escreve o HTML
  recebido e chama `window.print()` — a pessoa salva como PDF manualmente
  pela caixa de diálogo de impressão do navegador.
- **`Administrativo.tsx`** (botão de documento rápido): baixa o HTML como
  arquivo `.html` direto (nem chega a abrir a impressão).
- Existe ainda um terceiro caminho, **`ContratoDocxGenerator.tsx`**, não
  investigado a fundo nesta sessão (gera `.docx`, formato diferente).

**Consequência prática**: nenhum desses três caminhos guarda um arquivo PDF
de verdade em lugar nenhum do sistema — não existe `pdf_url` real gerado
automaticamente pra um contrato de consignação.

### Achado 18/08/2026 — isso explica por que o Autentique nunca funcionou de verdade

Documentei em `docs/autentique-integracao.md` que o único contrato que já
passou por `enviar-para-assinatura` (`CTR-41`, 16/04/2026) ficou com um link
de assinatura falso. Investigando aqui, achei a causa provável: o campo
`contratos_consignacao.pdf_url` desse registro **não é um contrato real** —
é `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
um arquivo de teste público usado pra testar visualizadores de PDF. Ou seja,
foi um teste manual (provavelmente durante o desenvolvimento) que nunca
chegou a gerar um contrato real — porque, como visto acima, `gerar-pdf-
contrato` não produz um arquivo com URL própria, então quem quer que tenha
testado o envio pro Autentique precisou inventar uma URL de PDF qualquer pra
preencher o campo.

## Becos sem saída — não repetir

- Não adianta procurar onde `gerar-pdf-contrato` faz upload de arquivo —
  ela não faz. Se o objetivo for ter um contrato assinável de verdade (URL
  permanente), o fluxo de HTML+impressão do navegador não serve — precisaria
  ser reescrita no mesmo padrão de `gerar-pdf-proposta` (gerar bytes de PDF
  no servidor e subir pro Storage/R2).

## Em aberto

- **Decisão pendente da Adriana**: se o fluxo de assinatura eletrônica de
  contrato de consignação for retomado, `gerar-pdf-contrato` provavelmente
  precisa ser reescrita pra gerar um PDF real com URL (hoje ela e o
  Autentique são incompatíveis entre si — uma não produz o que a outra
  espera). Não alterado nesta sessão, só documentado.
- `ContratoDocxGenerator.tsx` (gera `.docx`) não foi investigado a fundo —
  desconhecido se esse caminho tem o mesmo problema ou se já resolve de
  outra forma.
