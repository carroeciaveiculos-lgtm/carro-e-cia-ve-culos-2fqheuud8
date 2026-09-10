# Gestão de Anúncios — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**.

Última atualização: 2026-09-10.

## Pedido original (10/09/2026)

Adriana pediu um painel pra monitorar anúncios, receber recomendações da
plataforma, ver saldo e solicitar ajuste em Meta Ads e Google Ads, com
uma seção dedicada de verdade (não a "Gestão de Anúncios" fake que já
existia). Prioridade decidida por ela: **Meta primeiro, Google depois**
(Fase 2, ainda não iniciada). Decisão de segurança: **nenhum ajuste de
orçamento ou status vai direto pra API — sempre passa por uma fila de
aprovação antes.**

## O que já existia (achado na auditoria do menu Marketing)

- `supabase/functions/ads-agent/index.ts` já listava campanhas, métricas
  (Insights API) e tinha `update_budget`/`toggle_status` — mas o
  parâmetro `platform` nunca era usado pra decidir a API: tudo caía na
  Meta, mesmo quando a aba dizia "Google Ads". A aba Google do painel era
  decorativa, sem nenhuma integração real por trás dela.
- Existe uma integração Google Ads real, mas **fora do site** — um
  servidor MCP em Python (`C:\Projeto\carroecia-api-google-ads`), token
  OAuth expirado no achado de 27/08/2026 (ver
  `[[google-ads-mcp-conector]]` na memória do projeto). Não é código
  reaproveitável direto (Python local, não Deno) — serve de referência
  de quais chamadas funcionam pra quando a Fase 2 começar.
- `ads_audit_logs` (tabela) já existia desde 04/07/2026 mas nunca tinha
  tela nenhuma mostrando ela.

## Fase 1 (Meta) — o que foi construído

### Saldo não é saldo

Testado ao vivo contra a conta real (`act_515820120462587`): o campo
`balance` da Meta vem sempre próximo de zero — essa conta não é
pré-paga, é cobrança automática por `spend_cap` (limite de gasto). Não
existe "saldo disponível pra gastar" no sentido de carteira. A tela
mostra 3 números reais: gasto atual (`amount_spent`), limite de cobrança
(`spend_cap`), e a diferença entre os dois (quanto falta pra próxima
cobrança automática no cartão).

### Recomendação é por conta, não por campanha

Testado `/{campaign_id}/recommendations` → erro "nonexisting field".
`act_{id}/recommendations` funciona e traz recomendação real da Meta
(texto, estimativa de ganho, link direto pro Gerenciador de Anúncios).
**A maioria dos tipos de recomendação da Meta não tem aplicação via API**
— por isso a tela não tem um botão "aplicar" fake, só o link pra abrir
no Gerenciador de Anúncios de verdade.

### Fila de aprovação

- Tabela `ads_solicitacoes_ajuste` — todo pedido de mudar orçamento ou
  status nasce com `status='pendente'`. **Criar o pedido nunca chama a
  API da Meta.**
- `ads-agent` ganhou `criar_solicitacao` (só grava, nunca chama a Meta) e
  `aplicar_solicitacao` (só essa chama a Meta de verdade — dispara
  quando alguém clica "Aprovar" na tela). "Rejeitar" atualiza o status
  direto pelo cliente, sem nunca tocar na function.
- `CampaignPanel.tsx`: pra `platform === 'meta'`, o clique em
  "Orçamento"/"Pausar"/"Ativar" cria uma solicitação em vez de aplicar
  na hora (comportamento antigo mantido intacto pra `platform ===
  'google'`, que continua chamando a Meta por engano até a Fase 2
  corrigir isso de vez).
- `MetaAdsDashboard.tsx` (novo componente, substitui `CampaignPanel`
  sozinho na aba "Meta Ads" do `AdsManager.tsx`) — reúne gasto, recomendações,
  fila de aprovação, a tabela de campanhas (`CampaignPanel` continua
  dentro, reaproveitado) e o histórico de `ads_audit_logs`.

### `pause_sold_ads` não entra na fila

Decisão deliberada: pausar automaticamente o anúncio de um veículo que
foi marcado como Vendido não é um ajuste de verba que precisa de
aprovação — é limpeza básica que já existia e continua direta,
sem fila.

## Testado ao vivo (10/09/2026)

Fluxo completo numa campanha de teste (`Campanha FUSCA`, sem uso real):
criar solicitação de orçamento → apareceu na fila sozinha (sem F5) →
clicar "Aprovar" → `resultado_api: {"success":true}` gravado, orçamento
mudou de verdade na Meta (confirmado reconsultando `list_campaigns`
depois, "R$ 1500" apareceu). Testado também o caminho de rejeição
(`Campanha BMW X4`, ajuste de status): `status='rejeitado'`,
`resultado_api: null` — confirmado que rejeitar nunca chama a API.

## Becos sem saída — não repetir

- Não tentar achar `/recommendations` no nível de campanha — não existe,
  dá erro "nonexisting field". É sempre `act_{id}/recommendations`.
- Não assumir que dá pra "aplicar" toda recomendação da Meta via API —
  a maioria só tem link pro Gerenciador de Anúncios, não tem mutação
  programática documentada.
- A coluna "Orçamento/Dia" vazia (`R$ -`) na maioria das campanhas
  **não é bug** — são campanhas sem orçamento em nível de campanha
  (orçamento gerenciado por conjunto de anúncios/ABO). Confirmado ao
  vivo: depois de definir um orçamento via fila, o valor passou a
  aparecer certinho pra aquela campanha.
- A role usada pelo MCP `supabase` padrão não tem permissão em
  `public.get_internal_service_secret()` nem em algumas chamadas
  server-to-server — usar o MCP `claude_ai_Supabase` quando precisar
  testar algo que exige essa role (mesmo achado documentado em
  `docs/modelo-versao-corte.md`).

## Fase 2 (Google) — o que foi construído (10/09/2026, mesmo dia da Fase 1)

**Bloqueio resolvido**: o token OAuth do servidor MCP local
(`C:\Projeto\carroecia-api-google-ads`) estava expirado desde 27/08/2026
— a Adriana rodou `generate_user_credentials.py` (login manual no
navegador, só ela pode fazer), gerou um refresh_token novo, atualizado
tanto no `google-ads.yaml` local quanto nas secrets do Supabase.

**Testado ao vivo antes de escrever a function** (mesma disciplina da
Fase 1 — 2 achados que mudaram o desenho original):
- **API REST funciona igual à lib Python**, mas só a partir da versão
  `v25` — `v20` (chute inicial) dá 404. Confirmado via chamada REST crua
  (`requests`, não a lib `google-ads` oficial) antes de escrever
  qualquer Deno.
- **"Saldo" no Google também não existe** — mesmo padrão do Meta, é
  `account_budget` (limite aprovado vs. já servido), não carteira
  pré-paga. Testado: `approved_spending_limit_micros: 900000000` (R$
  900,00), `amount_served_micros: 849110000` (R$ 849,11) — a mesma conta
  tem `billing_setup` com `payments_account` (cobrança automática).
- **Recomendação existe** (`recommendation` resource) mas só devolve um
  enum de tipo (`PERFORMANCE_MAX_OPT_IN` etc.), sem texto pronto como a
  Meta — precisou de um dicionário de tradução pra português
  (`TIPOS_RECOMENDACAO` em `google-ads-agent/index.ts`, curto, só os
  tipos mais comuns — completar se aparecer tipo novo).

**Nova Edge Function `google-ads-agent`** — espelha `ads-agent` (Meta)
mas fala REST puro com a API do Google (sem a lib oficial, que é Python/
gRPC e não roda em Deno): `getAccessToken()` troca o refresh_token por
um access_token via `oauth2.googleapis.com/token` a cada chamada,
`gaqlSearch`/`gaqlMutate` chamam `googleads.googleapis.com/v25/...`
direto. Mesmas 6 ações que a Meta tem: `list_campaigns`, `get_metrics`,
`get_account_balance`, `get_recommendations`, `criar_solicitacao`,
`aplicar_solicitacao` — mesma fila de aprovação (`ads_solicitacoes_ajuste`,
tabela compartilhada entre as duas plataformas), mesma regra: criar
pedido nunca chama a API, só "Aprovar" chama de verdade.

**Frontend generalizado**: `MetaAdsDashboard.tsx` virou
`AdsDashboard.tsx` (aceita `platform: 'meta' | 'google'`), evitando
duplicar toda a tela. `src/services/ads-manager.ts` ganhou um roteador
(`fnFor(platform)`) que decide entre `ads-agent` e `google-ads-agent`
conforme a plataforma. `CampaignPanel.tsx` parou de ter um `if
(platform === 'meta')` — a fila agora vale pras duas plataformas sem
distinção.

**Achado de segurança corrigido no meio do caminho**: o chat "Agente
IA" (`AdsAgentChat.tsx`) ainda chamava `update_budget`/`toggle_status`
**direto**, contornando a fila nova inteira — só a tela de campanhas
(`CampaignPanel`) tinha sido corrigida antes. Corrigido: `handleConfirm`
agora cria solicitação pendente pros dois tipos de ajuste, só ações de
leitura (`list_campaigns`, `get_metrics`) continuam indo direto.

**Detalhe de texto (achado só testando ao vivo, não no lint/build)**: "a
Meta" é feminino (empresa) mas "o Google" é masculino (produto) — sem
cuidado, saía "A Google cobra..." errado. `AdsDashboard.tsx` tem uma
tabela de formas por plataforma (`TEXTO_PLATAFORMA`: artigo, contrações
de "em"/"de"/"para") em vez de compor a frase ingenuamente.

**Testado ao vivo de ponta a ponta na conta real** (`customer
8695704366`): `list_campaigns`, `get_metrics`, `get_account_balance`,
`get_recommendations` — todos confirmados com dado real batendo com o
que o script Python já tinha mostrado. `criar_solicitacao` +
`aplicar_solicitacao` testados numa campanha real (`Leads_pesquisa`,
pausada) com **mudança neutra de propósito** (orçamento pro mesmo valor
que já tinha) — `resultado_api` confirmou mutate real aceito pela API
(`resourceName` do orçamento atualizado devolvido), sem efeito prático
real, registro de teste apagado do banco depois.

## Em aberto

- Nenhuma tabela de histórico de métricas (impressões/cliques/gasto ao
  longo do tempo) — tudo é buscado ao vivo (Insights API / GAQL) toda
  vez que a tela abre. Se quiser gráfico de tendência, precisa de
  tabela nova + cron salvando 1x/dia.
- `TIPOS_RECOMENDACAO` (tradução de recomendação do Google) só cobre os
  tipos mais comuns — se aparecer um tipo novo não mapeado, cai num
  texto genérico ("Recomendação: TIPO_X"), não quebra, mas fica menos
  claro pra Adriana.
- `ads-agent`'s `update_budget`/`toggle_status` (Meta) e o equivalente
  no `google-ads-agent` continuam existindo como ações separadas
  (chamadas só internamente por `aplicar_solicitacao` agora) — não
  foram removidas, só pararam de ser chamadas direto pelo front-end.
