# Automações internas (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. Complementa `docs/leads-e-sdr.md` (o caminho de um
lead) — aqui é sobre as automações que rodam nos bastidores sem tela
própria.

Última atualização: 2026-08-18.

## Mapa das 9 functions

| Function | Trigger | O que faz |
|---|---|---|
| `on-lead-created` | Chamada por `src/services/leads.ts` (`createLead`) | E-mail de boas-vindas (Resend) + contato no Brevo, quando o lead entra pelo caminho "completo" (Hero/CTA) |
| `lead-automation` | Chamada por `LeadForm.tsx` | Cria/atualiza lead com trava de duplicidade + Brevo — **não** manda e-mail nem aciona a Clara (ver `docs/leads-e-sdr.md`) |
| `notify-new-vehicle` | Trigger de banco ao cadastrar veículo | Avisa a equipe por WhatsApp que um veículo novo entrou no estoque |
| `content-workflow-notification` | Chamada por `PageVisualEditor.tsx` | E-mail avisando que um conteúdo está aguardando revisão |
| `agendamento-no-show-cron` | Cron, de hora em hora | Marca "não compareceu" quem passou 2h do horário e não foi confirmado, avisa cliente e dono |
| `lembrete-agendamento-cron` | Cron, de hora em hora | Manda lembrete de agendamento 1-3h antes, uma vez só por agendamento |
| `daily-report-cron` | Cron, diário | Manda resumo do dia (leads, vendas, estoque, anúncios ativos) por WhatsApp |
| `re-engagement-cron` | Cron, periódico | Reengaja lead frio inativo há 7+ dias, no máximo 3 vezes por lead |
| `enviar-candidatura` | Público (formulário "Trabalhe Conosco") | Recebe candidatura, sobe currículo (PDF) pro R2, notifica RH |

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| **Achado 18/08/2026 — `notify-new-vehicle` pode estar avisando o número errado.** O destinatário padrão vem de `WHATSAPP_SALES_TEAM_PHONE`; se essa variável não estiver configurada, cai no fallback **`5534997384177` — que é o número da Clara**, reservado pra atendimento geral do site (regra de roteamento documentada no `CLAUDE.md`). Essa variável não aparece em nenhum outro lugar do projeto — indício de que nunca foi configurada, ou seja, o aviso interno de "veículo novo" provavelmente está caindo no WhatsApp de atendimento ao cliente, não da equipe de vendas | leitura de `notify-new-vehicle/index.ts`, linha 38; grep por `WHATSAPP_SALES_TEAM_PHONE` no projeto inteiro — só aparece nesse arquivo |
| `agendamento-no-show-cron` e `daily-report-cron` também têm um número de fallback estranho (`5534999484285`, não bate com nenhum número documentado no `CLAUDE.md`) — mas **não é um problema ativo**: as duas leem `social_configuracoes.whatsapp_number` primeiro, e esse campo está configurado com o número real da Adriana (`5534984080220`, o mesmo que a regra de roteamento manda usar pra alerta administrativo interno) | leitura das duas functions + `select whatsapp_number from social_configuracoes`, 18/08/2026 |
| `content-workflow-notification` manda o e-mail de revisão de conteúdo pra `adriana.araujo@kmzero.com.br` **hardcoded** — mesma conta kmzero já achada hardcoded em `admin-plataformas-api` (ver `docs/admin-orquestracao-portais.md`) e que tem senha exposta numa migration antiga (decisão da Adriana foi não trocar) | leitura de `content-workflow-notification/index.ts`, linha 47 |
| `re-engagement-cron` tem limite de **3 reengajamentos por lead**, contado via marcador de texto em `conversation_history` (não por coluna própria) — motivo documentado no código: mandar template repetido pra quem não responde prejudica a "quality rating" do número no WhatsApp Business, não é só sobre incomodar o cliente | leitura de `re-engagement-cron/index.ts`, linhas 37-44 |
| `on-lead-created` lê o ID da lista do Brevo do campo `configuracoes_api.auth_token` — apesar do nome do campo sugerir uma chave de API, aqui ele guarda um **número de lista** (`parseInt`) | leitura de `on-lead-created/index.ts`, linha 68 |
| `enviar-candidatura` valida tipo (`application/pdf` ou extensão `.pdf`) e tamanho (máx. 8MB) do currículo antes de subir pro R2 — validação de verdade, não só decorativa | leitura de `enviar-candidatura/index.ts`, linhas 78-92 |
| `lembrete-agendamento-cron` e `agendamento-no-show-cron` usam **templates aprovados pela Meta** (não texto livre) porque pode já ter passado mais de 24h desde a última mensagem do cliente — WhatsApp Business bloqueia texto livre fora dessa janela | comentário no código das duas functions |

## Becos sem saída — não repetir

- Não adianta procurar uma tabela dedicada de contagem de reengajamento —
  `re-engagement-cron` conta pelo texto exato
  `'[Template Automático de Reengajamento Enviado]'` em
  `conversation_history`. Mudar esse texto sem atualizar a function quebra
  o limite de 3 silenciosamente (voltaria a mandar sem parar).

## Em aberto

- **Decisão pendente da Adriana**: confirmar se `WHATSAPP_SALES_TEAM_PHONE`
  está configurada — se não estiver, os avisos de "veículo novo no
  estoque" estão indo pro número da Clara em vez da equipe de vendas desde
  que essa function foi implantada. Não corrigido nesta sessão (só
  documentar, mesmo padrão dos achados anteriores).
- Não confirmado se `RESEND_API_KEY` está ativa hoje pra
  `content-workflow-notification` e `on-lead-created` — mesma pendência já
  registrada em `docs/admin-usuarios-acesso.md`.
