# Leads e SDR (Clara) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado/descartado — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. Espelha o padrão de `docs/webmotors-integracao.md`.

Última atualização: 2026-08-12.

## O caminho de um lead

```
Formulário/webhook
  ├─ LeadForm.tsx (maioria das páginas)
  │    └─ edge function lead-automation
  │         ├─ trava de duplicidade (telefone/e-mail, lead ainda ativo)
  │         └─ Brevo (lista por campanha)
  │         NÃO dispara e-mail de boas-vindas nem a Clara
  │
  ├─ Hero.tsx / cta-router.ts
  │    └─ src/services/leads.ts → createLead()
  │         ├─ trava de duplicidade (telefone/e-mail, lead ainda ativo)
  │         ├─ send-lead-email (alerta interno)
  │         ├─ on-lead-created (e-mail de boas-vindas + Brevo, lista única)
  │         └─ ai-sdr (Clara inicia conversa no WhatsApp)
  │
  └─ receive-leads (webhook Meta: leadgen ads, DM Instagram/WhatsApp)
       └─ trava de duplicidade por telefone (Meta) ou external_lead_id
```

**`LeadForm.tsx` e `Hero.tsx`/`cta-router.ts` têm comportamentos diferentes** —
só o segundo caminho dispara e-mail de boas-vindas e inicia conversa com a
Clara. Isso não foi unificado nesta sessão (12/08/2026), só a trava de
duplicidade e o envio ao Brevo. Se um lead reclamar "não recebi mensagem no
WhatsApp", confirme por qual caminho ele entrou antes de assumir bug.

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| O SDR se chama **Clara** | Confirmado por Adriana em 12/08/2026 — o código/config tinha "Luiz" (nome do CEO real, `src/lib/brand.ts`), corrigido nessa sessão |
| Existem **duas tabelas `leads`**: `public.leads` (ativa, 88 linhas) e `operacional.leads` (vazia, 0 linhas, não referenciada em nenhum arquivo do repo) | `information_schema.tables`/`.columns` ao vivo, 12/08/2026 |
| A tabela `leads` **não tem `veiculo_id` obrigatório** — muitos leads não são de um veículo específico | schema ao vivo, 12/08/2026 |
| Status possíveis: `novo`, `em_contato`, `negociando`, `fechado`, `perdido` (`fechado`/`perdido` = terminais) | `KanbanBoard.tsx`, `COLUMNS` |
| Chave de API do Brevo mora em `configuracoes_api` (portal='Brevo'), editável pelo admin sem deploy — não mais em env var | corrigido em 12/08/2026, ver "De/para" abaixo |
| O reengajamento por WhatsApp já usava `type: 'template'` (`reengajamento_frio`), respeitando a exigência da Meta de template aprovado fora da janela de 24h — isso **nunca foi o problema** | leitura do código, 12/08/2026 |
| **Achado e corrigido 23/08/2026 — imagem do cliente sumia em silêncio.** `receive-leads` só lia `msg.text?.body` — qualquer mensagem de imagem (ou áudio/vídeo/documento/figurinha) virava `message_text: ''`, era gravada vazia (52 mensagens confirmadas no banco, mais recente do dia anterior) e **nunca acionava a Clara** (`if (messageText)` também barrava). Corrigido: imagem baixa da Graph API e re-hospeda no R2 (mesmo padrão do `rehospedarThumbnail`), grava `[IMAGEM]<url>` no histórico (painel renderiza como foto), e a Clara recebe uma descrição textual (não tem visão). Outros tipos não suportados agora geram um aviso em vez de sumir. Testado ao vivo com payload simulado (media_id falso, caminho de fallback) — Clara respondeu de verdade pela primeira vez a uma mensagem de imagem. **As 52 imagens antigas não têm como ser recuperadas** — o media_id nunca foi salvo, e o link da Meta expira em minutos. Envio de imagem pelo painel (`ConversationPanel.tsx`) também não existia — `send-whatsapp` já sabia mandar imagem (Clara usa pra foto de veículo), só faltava a UI; adicionado botão de anexo, e o registro passou a usar o mesmo formato `[IMAGEM]<url>` (antes só gravava o rótulo "[Imagem Enviada]", sem a URL, o painel não conseguia mostrar de volta). |

## Becos sem saída — não repetir

- **Mexer em `operacional.leads` achando que é a tabela real.** Está vazia,
  órfã, não é lida nem escrita por nenhum código do repositório. Provável
  resto de uma tentativa de arquitetura abandonada. Não vale a pena
  investigar de novo — só limpar (`DROP`) um dia, com autorização, se
  confirmado que não tem uso planejado.
- **Assumir que `LeadForm.tsx` e `createLead()` fazem a mesma coisa.** Não
  fazem — ver "O caminho de um lead" acima. Um lead sem Clara pode ser
  comportamento esperado, não bug.

## De/para do que foi corrigido em 12/08/2026

| Antes | Depois |
|---|---|
| SDR se apresentava como "Luiz" (código + `ai_prompts_config.prompt_text`/`default_prompt` + `social_configuracoes.ai_system_prompt`) | "Clara", nos 3 lugares. Deploy: `ai-sdr` |
| `lead-automation` inseria lead sempre, sem checar duplicado | Reaproveita lead ativo (mesmo telefone/e-mail) via `_shared/lead-dedup.ts`, anexa nota em vez de duplicar |
| `createLead()` (client-side) inseria sempre, sem checar duplicado — cliente podia receber 2+ mensagens de boas-vindas da Clara pro mesmo contato | Mesma trava, client-side em `src/services/leads.ts`. Duplicado não dispara `on-lead-created`/`ai-sdr` de novo, só `send-lead-email` (alerta interno) |
| Branch genérico de `receive-leads` (`payload.nome && payload.telefone && !payload.object`) inseria sempre | Mesma trava via `_shared/lead-dedup.ts` |
| `on-lead-created` e `lead-automation` mandavam contato ao Brevo cada um do seu jeito — chave de API de fontes diferentes (env var vs banco), log de erro em tabelas diferentes (`logs_integracao` vs `lead_integracao_log`) | Helper único `_shared/brevo.ts` (`enviarContatoBrevo`) — chave sempre de `configuracoes_api`, log sempre em `lead_integracao_log`. Seleção de lista por campanha continua em `lead-automation` (isso é legítimo, não duplicação) |
| `re-engagement-cron` reenviava o mesmo template pro mesmo lead frio a cada 7 dias, pra sempre, sem limite | Limite de **3 envios por lead** (constante `MAX_REENGAJAMENTOS`, ajustável), contado via `conversation_history` (sem migration nova) |
| 4ª ocorrência de "Luiz" achada em `brain_ia_knowledge` (entrada "Regras de atendimento SDR", injetada no prompt da Clara) | Corrigida também |
| `brain_ia_knowledge` sem categoria — a Clara recebia as 10 entradas mais recentes de qualquer assunto (inclusive regras de SEO de blog) | Coluna `categoria` (migration `20260812190000`), valores `sdr`/`seo_blog`/`geral`. `ai-sdr` só lê `sdr`+`geral`. Seletor de categoria adicionado na tela Configurações |
| 81 dos 88 leads com `origem = "whatsapp"` genérico — não dava pra saber se veio de anúncio do Facebook/Instagram ou contato orgânico | `receive-leads` agora lê o campo `referral` que a Meta manda quando a mensagem vem de anúncio "clique para WhatsApp" — grava `facebook_ads`/`instagram_ads`/`whatsapp_organico` + `campanha`/`utm_campaign` quando disponível |

**Deploys feitos:** `ai-sdr` (2x), `lead-automation` (2x), `receive-leads`
(2x), `on-lead-created`, `re-engagement-cron`.

## Em aberto

- **Dedup testado ao vivo em 12/08/2026** (via `lead-automation`, mesmo
  telefone duas vezes): confirmado, vira 1 lead só, segunda tentativa vira
  nota anexada. **Ainda não testado**: (1) confirmar que a Clara não manda 2
  mensagens de boas-vindas pro mesmo contato (caminho `createLead`); (2)
  confirmar no Brevo que o contato caiu na lista certa.
- **Limite de 3 reengajamentos é um número escolhido, não confirmado com a
  Adriana.** Ajustar a constante `MAX_REENGAJAMENTOS` em
  `re-engagement-cron/index.ts` se ela quiser outro valor.
- **Nenhum lead tem origem Webmotors/Mercado Livre**, mesmo depois da captura
  de `referral` (12/08/2026) — essa correção só cobre anúncio Facebook/
  Instagram que vira mensagem de WhatsApp. Leads vindos de portal (Webmotors/
  ML) passam por `wm-webhook-leads`/`wm-process-lead`, não investigados
  ainda — ver item da sobreposição logo abaixo.
- **Painel de cadastro de templates de WhatsApp — pedido por Adriana em
  12/08/2026, não existe ainda.** Hoje `whatsapp_templates` só é lida (tela
  `WhatsAppScheduler.tsx`, filtra `status='APPROVED'`) — não há função que
  sincroniza da Meta nem UI de criar/editar. Aguardando Adriana mandar um
  modelo de referência antes de desenhar.
- **"Fase 4 — tela Conversador" (inbox das conversas da Clara, separado do
  Kanban) — escopo já definido e aprovado, plano completo em
  `C:\Users\adria\.claude\plans\sequential-sleeping-alpaca.md`. Fases 1-3
  (function-calling, pipeline nova no Kanban, envio de foto/vídeo) já
  implementadas — só falta a Fase 4 (a tela em si). Bloqueada esperando
  Adriana mandar o modelo visual de referência que ela mencionou.
- **`operacional.leads` (tabela vazia, órfã, sem referência no código) —
  limpeza pedida por Adriana em 12/08/2026, deixada pendente a pedido dela.**
  Não fazer `DROP` sem autorização explícita separada quando ela pedir.
- **Descrição gerada por IA com erro real, achado em 12/08/2026, não
  investigado ainda** (fora do escopo de leads/SDR, é do gerador de conteúdo
  do cadastro de veículo): o campo `veiculos.descricao` do VW T-Cross
  (`78ffd6ed-b1c2-49e1-ab6d-b0e0c3b2f498`) diz "câmbio manual" com o veículo
  cadastrado como automático, e tem uma frase gramaticalmente quebrada ("está
  à de 25 anos no mercado"). Adriana pediu pra investigar depois.
- **Sobreposição `receive-leads` / `wm-webhook-leads` / `wm-process-lead`**
  (achado da auditoria original, não investigado): três funções com nome
  parecido relacionadas a lead vindo de portal — não confirmado se são
  redundantes ou cobrem casos diferentes.
- **`crm_conversas`/`crm_mensagens` vs `conversation_history`** (achado da
  auditoria original, não investigado): pode ser tabela redundante ou servir
  outro propósito (atendimento humano pós-handoff). Não mexer sem confirmar.
- **`followups`** (lembretes manuais do operador) está com 0 registros — não
  parece estar em uso ainda. Não é automação, é só agenda.

## Projeto "Clara ponta a ponta" (12/08/2026) — Fases 1-3

Plano completo em `C:\Users\adria\.claude\plans\sequential-sleeping-alpaca.md`
(aprovado por Adriana). Resumo do que foi feito e achado, tudo testado ao vivo
contra produção (não tem homologação separada pro CRM/SDR).

**Fase 1 — function-calling de verdade.** `ai-sdr` só mandava a 1ª mensagem e
nunca executava nenhuma função que o Gemini decidia chamar (agendar visita,
etc. eram só "decisão", nunca gravava nada). Corrigido: `executeFunction()`
(padrão copiado de `ai-agents/index.ts`) + `runGemini()` agora faz até 3
rodadas de function-calling encadeado antes da resposta final em texto (pra
"tem o carro X? manda foto" funcionar numa mensagem só). Reativada a resposta
a mensagens depois da primeira (`action: 'continue_conversation'`,
chamada por `receive-leads`, respeitando `leads.ai_enabled`).

**Bugs críticos achados e corrigidos nessa fase:**
- `GEMINI_API_KEY` não existia — o secret real chama-se `GEMINI_APY_KEY`
  (erro de digitação histórico). Código aceita os dois nomes agora.
- **O modelo `gemini-1.5-flash` está descontinuado (404 em toda chamada).**
  Isso significa que o Gemini **nunca funcionou nesse projeto** — toda
  resposta "da Clara" até hoje era o fallback de texto fixo. Corrigido pra
  `gemini-3.6-flash`.
- Adicionado fallback pro Groq (`GROQ_API_KEY`, já configurado) se o Gemini
  falhar — pedido por Adriana. Atenção: o plano gratuito do Groq tem limite
  baixo de tokens/minuto (12.000 TPM), estourou algumas vezes durante teste
  intenso; normal na operação diária, mas monitorar se o Gemini principal
  ficar instável de novo.
- A IA não sabia a data de hoje e quase agendou uma visita em **2024** — o
  prompt agora recebe data/hora atual (fuso de Brasília) a cada chamada, mais
  uma trava que rejeita `data_hora` no passado.
- **CRÍTICO DE SEGURANÇA:** `consultar_estoque` fazia `select('*')` em
  `veiculos`, mandando pro Gemini (e por tabela, pra resposta ao cliente) os
  dados do PROPRIETÁRIO do veículo — CPF, telefone, endereço, data de
  nascimento, nome da mãe. Corrigido pra só as colunas relevantes a um
  cliente final, em `ai-sdr` **e** em `ai-agents` (mesmo bug lá).

## Auditoria de vazamento de dado (12/08/2026, pedido da Adriana)

Depois de achar o vazamento de PII do proprietário na Fase 1 (`ai-sdr`),
auditei o projeto inteiro atrás do mesmo padrão. Achados:

| Onde | O que vazava | Pra quem | Corrigido |
|---|---|---|---|
| `ai-sdr` (Clara) | CPF, telefone, endereço, nascimento, nome da mãe do dono do carro | Pro Gemini, e daí pra resposta a QUALQUER cliente perguntando sobre aquele veículo | Sim — `COLUNAS_VEICULO_SEGURAS` |
| `ai-agents` (mesmo bug, função irmã) | Idem | Pro Gemini (uso interno da equipe, risco menor mas mesma falha) | Sim — mesma constante |
| `_shared/ml-client.ts` (`buildLocation`) | **Endereço residencial completo** (rua, número, bairro, CEP) do proprietário | **Publicado no anúncio público do Mercado Livre** — já no ar, não só um risco teórico | Sim — usa o endereço fixo da loja agora |

**Criada `_shared/veiculo-safe-fields.ts`** com `COLUNAS_VEICULO_SEGURAS` —
lista única de colunas de `veiculos` sem nenhum campo `proprietario_*`, com
comentário explicando a regra: `select('*')` em `veiculos` só é aceitável
quando o resultado não sai da função, ou é pra gerar contrato/documento legal
(onde o dado do proprietário é necessário de verdade — `gerar-pdf-contrato`,
`enviar-para-assinatura`, `webhook-autentique`, conferidos e OK). Qualquer
função nova que manda dado de veículo pra um LLM, API de portal público, ou
resposta HTTP externa deve importar essa constante em vez de reinventar a
lista ou usar `'*'`.

**Verificado e OK, sem mudança:** `public-inventory-feed`/`crm-inventory-feed`
fazem `select('*')` mas mapeiam pra um objeto de saída curado antes de
responder — não vazam, só são ineficientes. `gerar-conteudo-social`/
`ad-copy-generator`/`ads-agent` não consultam `veiculos` diretamente.
`validate-payload.ts` só usa `proprietario_cidade`/`estado` (nível de
cidade, não endereço — aceitável pra exigência de campo obrigatório do ML).

**Pendente, não fiz ainda (mexe em dado público de terceiro, quero
confirmar antes):** existem **27 anúncios ativos no Mercado Livre**
sincronizados antes dessa correção — o código novo só previne daqui pra
frente, os já publicados continuam com o endereço pessoal do proprietário até
serem ressincronizados. Rodar `sync-plataforma`/`ml-sync` de novo pra esses
27 veículos corrige o que já está público.

**Fase 2 — pipeline nova.** Coluna "Negociando" removida (0 leads lá no dia,
sem backfill necessário). Colunas novas: `agendamento`("Agendamentos") e
`visita`("Visitas") — sem CHECK constraint no banco pra travar isso.
`KanbanBoard.tsx`, `Leads.tsx` (`getStatusColor`, badge "Clara (IA)" via
`leads.ai_enabled` em vez do texto fixo "LUIZ"), trigger de notificação e
tabela nova `agendamentos_visita` (migration `20260812200000`) todos
atualizados. Botão "Cliente chegou" (Agendamentos → Visitas) é sempre ação
manual do vendedor — decisão da Adriana, sistema não tem como saber sozinho.

**Fase 3 — mídia do veículo.** `send-whatsapp` ganhou `action: 'video'`
(espelha `action: 'image'`, que já existia mas nunca tinha sido chamada por
nenhuma tela). `enviar_midia_veiculo` funciona e encadeia certo com
`consultar_estoque` (Fase 1 resolveu isso).

**BLOQUEADOR CRÍTICO achado no fim da Fase 3, não é bug meu — pré-existente:**
o envio de mensagem pela API do WhatsApp (Meta) está falhando desde pelo
menos **12/08/2026 10:00** (confirmado via logs — 54 erros só naquela hora,
do `re-engagement-cron`, e continuou aparecendo o dia todo). Erro:
`"Object with ID '1231947963330780' does not exist, cannot be loaded due to
missing permissions"` — sintoma típico de **token de acesso (`WHATSAPP_TOKEN`)
expirado ou inválido**, não de ID errado. Isso afeta TUDO que manda mensagem
pra fora (Clara, reengajamento, notificação de novo lead) — as respostas da
Clara ficam certinhas no banco (`conversation_history`), mas **é incerto se
estão chegando de verdade no WhatsApp do cliente**. Precisa gerar um token
novo (de preferência permanente, via System User) no Meta Business Manager —
fora do que eu consigo fazer.

## Diagnóstico rápido

```sql
-- confirmar schema ativo (não usar operacional.leads)
select table_schema, count(*) from (
  select table_schema, table_name from information_schema.tables where table_name = 'leads'
) t join lateral (select 1) x on true group by table_schema;

-- leads possivelmente duplicados por telefone (mesmo telefone, status não-terminal)
select telefone, count(*), array_agg(id) from public.leads
where status not in ('fechado','perdido') and telefone is not null
group by telefone having count(*) > 1;

-- quantas vezes um lead já foi reengajado
select lead_id, count(*) from conversation_history
where message_text = '[Template Automático de Reengajamento Enviado]'
group by lead_id order by count(*) desc;

-- config do Brevo em uso
select portal, ativo, auth_token from configuracoes_api where portal = 'Brevo';

-- prompt atual da Clara (o que realmente está em uso, por ordem de prioridade)
select prompt_text, default_prompt from ai_prompts_config where slug = 'sdr_whatsapp';
select ai_system_prompt from social_configuracoes;
```
