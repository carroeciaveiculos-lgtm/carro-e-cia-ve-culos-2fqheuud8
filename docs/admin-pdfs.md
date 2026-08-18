# Geração de PDF (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18.

## Resumo — as 3 geram PDF real agora

| Function | Bucket | Bucket é público? |
|---|---|---|
| `gerar-pdf-proposta` | `propostas-geradas` | Sim — devolve URL pública direto |
| `gerar-pdf-avaliacao` | `propostas-geradas` | Sim — devolve URL pública direto |
| `gerar-pdf-contrato` | `contratos-consignacao` | **Não** — devolve URL assinada temporária (1h); o banco guarda só o caminho do arquivo |

Todas as três usam o mesmo motor (`gerarPdfDocumento()`, jsPDF, em
`_shared/pdf-generator.ts`) e o mesmo padrão de template editável em
`document_templates` (`/admin/modelos-documentos`).

## `gerar-pdf-proposta` e `gerar-pdf-avaliacao`

Buscam o template editável (tipos `proposta_comercial` e
`proposta_avaliacao`), substituem os `{{marcadores}}` pelos dados reais do
veículo/cliente/avaliação, geram o PDF e sobem pro bucket `propostas-geradas`
(público). `gerar-pdf-proposta` foi reescrita do zero em 17/08/2026 — a
versão anterior fazia upload de um PDF fixo com texto "Mocked PDF", nunca
usada de verdade.

## `gerar-pdf-contrato` — reescrita em 18/08/2026, gera PDF real agora

**Antes**: apesar do nome, essa function montava HTML e devolvia no JSON de
resposta — quem virava PDF de verdade era o **navegador**
(`window.print()`), nada era salvo. Isso é por que a assinatura eletrônica
via Autentique nunca funcionou de ponta a ponta (achado anterior: o único
contrato que já passou por `enviar-para-assinatura`, `CTR-41`, tinha um
`pdf_url` que era literalmente um arquivo de teste do W3C, porque não
existia PDF real pra apontar).

**Depois**: gera PDF de verdade (mesmo padrão de `gerar-pdf-proposta`),
agora pra **qualquer um dos 4 tipos de contrato**
(`consignacao`/`compra`/`venda`/`termo_entrega`, não só consignação — pedido
da Adriana, já que qualquer documento que precise de assinatura remota deve
ter essa opção). Sobe pro bucket `contratos-consignacao` e cria/atualiza um
registro em `contratos_consignacao` (ver `tipo_documento` abaixo).

### Achado no caminho — bucket com tipo MIME inválido

O bucket `contratos-consignacao` tinha `allowed_mime_types = ['document/pdf',
'document/docx']` — **"document/pdf" não é um MIME type real** (o correto é
`application/pdf`). Isso bloquearia qualquer upload de PDF de verdade que já
tivesse sido tentado, mesmo com código correto. Corrigido pra
`['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']`.

### `contratos_consignacao.tipo_documento` — tabela ampliada

Migration `contratos_consignacao_tipo_documento` (18/08/2026) adicionou a
coluna `tipo_documento` (`consignacao`/`venda`/`compra`/`termo_entrega`,
padrão `consignacao` nos registros antigos). A tabela em si já tinha
estrutura genérica o suficiente (proprietário, veículo, PDF, controle de
assinatura) — só faltava saber qual tipo de documento é. Não foi criada
tabela nova nem renomeada a existente.

### Bucket privado — como isso afeta a URL

`contratos-consignacao` é **privado** (tem CPF/telefone de cliente,
diferente do `propostas-geradas` que é público). Por isso
`contratos_consignacao.pdf_url` guarda o **caminho do arquivo**, não uma URL
— `AssinaturaDialog.tsx` já sabia gerar uma URL assinada temporária a partir
do caminho na hora de mandar pro Autentique (não precisou mexer nesse
componente).

### Nova UI: `/admin/modelos-documentos`, seção "Gerar Documento de Contrato"

Antes disso, a tela de Modelos de Documentos só editava o **texto** dos
templates — não tinha como gerar um documento de um contrato de verdade.
Achado 18/08/2026: o painel que faria isso (`PainelContratoAcoes.tsx`, com
os botões DOCX/PDF/Assinatura Autentique) existia no código mas **nunca
tinha sido colocado em nenhuma tela** — `AssinaturaDialog` também estava
importado (mas não usado) em `VehicleFormModal.tsx`. Em vez de reaproveitar
esses componentes órfãos (shape de dado `ContratoData` não bate — tem campos
de comissão/período específicos de consignação), foi construída uma seção
nova e mais simples: escolher tipo de documento + veículo (opcional,
preenche proprietário automaticamente) + dados do cliente → gera o PDF →
libera "Baixar PDF" e o `AssinaturaDialog` (que já funcionava tecnicamente,
só nunca tinha sido exposto em tela nenhuma).

### Testado ao vivo (18/08/2026)

- Gerado um "Contrato de Venda" de teste via `curl` direto na function —
  PDF real confirmado (`file` → `PDF document, version 1.3, 1 page(s)`,
  magic bytes `%PDF-1.3` corretos, 5.6 KB).
- Testado o envio pro Autentique — a chave já estava configurada (a
  Adriana confirmou), mas achamos **3 bugs reais de integração** na
  `enviar-para-assinatura` (schema errado, campos inventados, índice
  errado do assinante) — corrigidos e testados com **2 documentos reais
  criados no Autentique** (2 dos 20/mês usados, autorizado pela Adriana).
  Detalhe completo em `docs/autentique-integracao.md`. Fluxo confirmado
  funcionando de ponta a ponta.
- Registros de teste (`CTR-2`, `CTR-3`, `CTR-4`) apagados do banco depois
  dos testes; os PDFs de teste ficaram no Storage (privado, sem dado
  sensível de cliente real) — não consegui apagar sem uma sessão de
  usuário logado, baixa prioridade.

## Becos sem saída — não repetir

- Não usar `getPublicUrl()` pro bucket `contratos-consignacao` — ele é
  privado, a URL não vai funcionar pra ninguém de fora (inclusive o
  Autentique). Usar `createSignedUrl()`.

## Em aberto

- `ContratoDocxGenerator.tsx` (gera `.docx`) não foi investigado nem
  mexido — segue como estava, fora do escopo desta correção (que focou no
  fluxo de assinatura via PDF).
- Sem controle de quantos documentos já foram usados dos 20/mês do
  Autentique — se vale a pena adicionar um contador, é decisão futura.
- Não confirmado se `numero_contrato` gerado automaticamente
  (`CTR-{sequencial}`) pode colidir em uso simultâneo por duas pessoas ao
  mesmo tempo — baixo risco dado o volume de uso esperado, mas não é
  garantido.
