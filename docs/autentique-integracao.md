# Autentique (assinatura eletrônica) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18 — **funcionando de ponta a ponta, testado com
documento real**.

## O que é

Integração com a [Autentique](https://www.autentique.com.br/) (API GraphQL,
limite de 20 documentos/mês no plano atual) pra coletar assinatura
eletrônica remota — cliente assina pelo celular, de onde estiver, em vez de
precisar ir à loja. Usada em `contratos_consignacao`, que desde 18/08/2026
cobre **qualquer** tipo de documento que precise de assinatura (venda,
compra, consignação, termo de entrega — ver `tipo_documento` em
`docs/admin-pdfs.md`), não só consignação.

## O caminho de um contrato até a assinatura

```
contratos_consignacao
  └─ enviar-para-assinatura
     ├─ baixa os bytes do PDF (pdf_url, URL assinada temporária do
     │  bucket privado contratos-consignacao)
     ├─ monta multipart/form-data (operations + map + file) — o Autentique
     │  exige upload de arquivo de verdade, não aceita URL como texto
     ├─ POST api.autentique.com.br/v2/graphql   mutation createDocument
     │  signatários: cliente (só nome, sem e-mail — ver achado abaixo) +
     │  loja (vendas@carroeciamotors.com.br)
     └─ grava assinatura_link (link do CLIENTE, não da loja — ver achado),
        assinatura_id_externo, assinatura_status='pendente'
        + assinatura_historico (evento 'link_enviado_autentique')

  ... loja manda o link por WhatsApp ou e-mail (Resend), cliente assina ...

  └─ webhook-autentique          recebido quando o Autentique dispara o
     │                           evento 'document_signed'
     └─ grava assinatura_status='assinado', assinatura_data, pdf_assinado_url
        + assinatura_historico (evento 'assinado_autentique')
```

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| **[RESOLVIDO 18/08/2026] Não era o `AUTENTIQUE_TOKEN`.** A Adriana confirmou que a chave já estava configurada — o problema real eram **3 bugs de integração** no código, nunca detectados porque a function tinha um modo mock silencioso (removido, ver abaixo) que escondia qualquer falha | testado ao vivo, ver os 3 achados abaixo |
| **Achado 1 — campo `file` precisa ser upload de verdade.** O código antigo mandava `document.file = pdf_url` (uma URL como texto) — o schema real do Autentique exige `file: Upload!`, um upload multipart de verdade (`graphql-multipart-request-spec`). Confirmado na documentação oficial (`docs.autentique.com.br/api/mutations/criando-um-documento`) | erro real do Autentique: `"Field \"createDocument\" argument \"file\" of type \"Upload!\" is required but not provided"` |
| **Achado 2 — campos inventados em `DocumentInput`.** `webhook_url`, `auto_remind`, `expires_in` **não existem** no schema real — o código antigo assumia que existiam. Removidos. Webhook de conclusão é configurado uma vez direto no painel da conta Autentique, não por chamada de API | erro real: `"Field \"webhook_url\" is not defined by type \"DocumentInput\""` (e o mesmo pros outros dois) |
| **Achado 3 — o cliente não é sempre `signatures[0]`.** O Autentique adiciona a conta dona do token (`lgacomerciodeveiculos@gmail.com`) automaticamente como 1º signatário/aprovador — o array de signatures na resposta tem 3 itens, não 2, e a ordem não é garantida. Código antigo lia `signatures[0].url` (campo que também não existe — o certo é `signatures[].link.short_link`) achando que era o cliente. Corrigido pra buscar pelo nome (`signatures.find(s => s.name === nome_cliente)`) | consulta real ao documento criado nos testes, 18/08/2026 — resposta teve 3 signatures, cliente no índice 1 |
| **Cliente é adicionado só por NOME, sem e-mail — decisão deliberada.** O campo `link.short_link` (o link de assinatura) só vem preenchido quando o signatário **não tem e-mail** — com e-mail, é o próprio Autentique quem manda o convite direto, sem devolver link nenhum pra gente. Como a Adriana quer controlar o envio (WhatsApp ou e-mail via Resend, não Autentique mandando direto), o e-mail do cliente não vai pro Autentique — só é usado do nosso lado | documentação oficial + confirmado ao vivo: com e-mail, `link` veio `null`; sem e-mail, veio a URL real (`https://assina.ae/...`) |
| **E-mail da loja não pode vir de `BREVO_SENDER_EMAIL`.** A Adriana confirmou (18/08/2026): esse tipo de documento transacional deve usar o domínio do Resend (e-mails internos), não o do Brevo (marketing) — além disso, o valor de `BREVO_SENDER_EMAIL` estava causando erro de validação (`must_be_a_valid_email_address`) mesmo depois de tentar extrair um possível formato "Nome \<email\>". Fixado em `vendas@carroeciamotors.com.br` (domínio já verificado no Resend) | erro real do Autentique + decisão da Adriana |
| **Modo mock silencioso removido.** A versão antiga, quando a chamada falhava por qualquer motivo, gravava um `assinatura_id_externo` fabricado e devolvia `success: true, mock: true` — foi isso que escondeu os 3 bugs acima por 4 meses (`CTR-41`, criado 16/04/2026, nunca chegou a `assinado`). Agora erro de verdade devolve `success: false` de verdade, sem fingir sucesso | leitura do código antigo vs. novo |
| **Testado ao vivo com documento real (18/08/2026)**: 2 documentos de teste criados de verdade no Autentique (consumindo 2 dos 20/mês, autorizado pela Adriana) — o segundo confirmou o link de assinatura do cliente vindo certo (`https://assina.ae/...`). Registros de teste apagados do banco depois (dado fake, "Cliente Teste Diagnostico") — os documentos em si continuam existindo do lado do Autentique (não há como apagar por lá sem acesso ao painel deles) | testes diretos via `curl`, 18/08/2026 |

## Becos sem saída — não repetir

- Não confiar na documentação/exemplos genéricos do Autentique sem testar
  ao vivo — o schema real tem diferenças (`webhook_url`/`auto_remind`/
  `expires_in` não existem; `signatures[].url` não existe, é
  `signatures[].link.short_link`) que só apareceram testando de verdade.
- Não assumir que `signatures[0]` é o cliente — a conta dona do token
  entra automaticamente como assinante extra.
- Não adicionar o cliente com e-mail achando que isso ajuda — tira o
  `link` da resposta (o Autentique passa a mandar convite direto, sem
  devolver link pra gente controlar o envio).

## Em aberto

- Nenhum bloqueio técnico conhecido — o fluxo funciona de ponta a ponta,
  testado com documento real.
- **Decisão futura**: hoje "Enviar E-mail" no `AssinaturaDialog.tsx` só
  copia/mostra o link gerado — não dispara um e-mail de verdade via
  Resend ainda. Se a Adriana quiser um botão que realmente manda o e-mail
  (não só copia o link), é um passo pequeno a mais (chamar uma function
  de envio de e-mail com o link, mesmo padrão já usado em
  `on-lead-created`/`enviar-candidatura`).
- Webhook de conclusão (`webhook-autentique`) não foi testado ao vivo
  nesta sessão — precisa confirmar se está registrado no painel da conta
  Autentique (não é configurado por API, ver achado acima).
