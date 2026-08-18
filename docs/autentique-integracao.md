# Autentique (assinatura eletrônica) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18.

## O que é

Integração com a [Autentique](https://www.autentique.com.br/) (API GraphQL)
pra coletar assinatura eletrônica em contratos de consignação. Usada só em
`contratos_consignacao` hoje — nenhum outro tipo de documento do sistema
passa por aqui.

## O caminho de um contrato até a assinatura

```
contratos_consignacao (status: aguardando_assinatura)
  └─ enviar-para-assinatura     monta o documento e os 2 signatários
     │                          (cliente + loja), chama a API do Autentique
     ├─ POST api.autentique.com.br/v2/graphql   mutation createDocument
     └─ grava assinatura_link, assinatura_id_externo, assinatura_status='pendente'
        + assinatura_historico (evento 'link_enviado_autentique')

  ... cliente assina no link recebido por e-mail (fora do nosso sistema) ...

  └─ webhook-autentique          recebido quando o Autentique dispara o
     │                           evento 'document_signed'
     └─ grava assinatura_status='assinado', assinatura_data, pdf_assinado_url
        + assinatura_historico (evento 'assinado_autentique')
```

`enviar-para-assinatura` é chamada pelo frontend autenticado (`verify_jwt =
true`); `webhook-autentique` é pública (`verify_jwt = false`), chamada pelo
próprio Autentique.

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| A função tem um **modo mock silencioso**: se a chamada à API do Autentique falhar (token inválido/ausente, erro de rede) ou a resposta vier com `errors`, ela **não propaga o erro** — grava no banco um `assinatura_id_externo` fabricado (`autentique_` + string aleatória) e um `assinatura_link` que aponta pra uma URL que nunca existiu, e devolve `success: true, mock: true` | Leitura direta de `enviar-para-assinatura/index.ts`, linhas 87-112 |
| **O único contrato que já passou por essa function está com o link mock.** `CTR-41` (criado 16/04/2026): `assinatura_id_externo = "autentique_q69c16b79"`, status parado em `pendente` desde então | `select * from contratos_consignacao where assinatura_id_externo is not null` — 1 única linha, 18/08/2026 |
| O link salvo desse contrato retorna **404** — não existe no Autentique de verdade | `curl -I https://autentique.com.br/sign/autentique_q69c16b79`, 18/08/2026 |
| Cada envio cria **2 signatários**: o cliente (nome/e-mail do formulário) e a própria loja (`BREVO_SENDER_NAME`/`BREVO_SENDER_EMAIL`, com fallback pra "Carro e Cia Veículos"/`vendas@carroeciamotors.com.br`) | leitura do payload `variables.signers` em `enviar-para-assinatura/index.ts` |
| O prazo do documento no Autentique é fixo em **7 dias** (`expires_in: 7`), com lembrete automático (`auto_remind: true`) | mesmo arquivo |
| O webhook busca o contrato pelo `assinatura_id_externo` — **se esse campo não bater com o `document.id` que o Autentique manda, o webhook falha** com erro 400 e não atualiza nada (sem alerta pra ninguém) | leitura de `webhook-autentique/index.ts`, linhas 26-36 |

## Becos sem saída — não repetir

- Não adianta olhar `assinatura_status = 'assinado'` no banco como prova de
  que a integração funciona de ponta a ponta — o único registro existente
  nunca passou de `pendente`, e é mock. Não há nenhum caso real testado
  ainda.

## Em aberto

- **Achado em 18/08/2026, causa raiz encontrada** (ver
  `docs/admin-pdfs.md`): o `pdf_url` gravado em `CTR-41` **não é um
  contrato real** — é
  `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
  um PDF de teste público do W3C. Ou seja, o teste desse fluxo foi feito
  com um arquivo qualquer, não com um contrato gerado pelo sistema — e não
  poderia ter sido diferente, porque `gerar-pdf-contrato` **não gera
  arquivo PDF nenhum** (devolve HTML pro navegador imprimir, ver
  `docs/admin-pdfs.md`). Os dois problemas são a mesma história: pra esse
  fluxo funcionar de ponta a ponta, `gerar-pdf-contrato` precisaria virar
  um PDF de verdade com URL própria antes de mandar pro Autentique. Ainda
  não confirmado se `AUTENTIQUE_TOKEN` está configurado — decisão da
  Adriana foi documentar e seguir, corrigir fica pra quando ela priorizar.
- Enquanto isso não for resolvido, qualquer contrato novo mandado por aqui
  corre o mesmo risco de cair no mock sem ninguém perceber — a resposta da
  function parece sucesso (`success: true`) mesmo quando é fake.
