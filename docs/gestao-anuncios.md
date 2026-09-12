# Gestão de Anúncios — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**.

Última atualização: 2026-09-10 (verificação OAuth do Google Ads aprovada).

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

### Saldo não é saldo — CORRIGIDO em 11/09/2026, achado anterior estava errado

**Achado original (10/09/2026), errado:** testando só o campo `balance`
do objeto de conta da API de Anúncios, ele vinha sempre perto de zero —
concluí que a conta não era pré-paga, seria cobrança automática por
`spend_cap`. A tela passou a mostrar gasto atual/limite/diferença como
"orçamento".

**Correção (11/09/2026):** auditando direto a Central de Pagamento do
Business Manager (`business.facebook.com/latest/billing_hub/payment_activity`)
a pedido da Adriana, achei o número real: **"Saldo pré-pago": R$
431,82** — a conta **é** pré-paga de verdade, abastecida por PIX/cartão,
debitada automaticamente todo dia conforme o gasto (transações reais:
R$6 a R$118/dia, batendo com o relato da Adriana de R$10-15/dia por
veículo em várias campanhas). Esse saldo pré-pago **não é o mesmo dado**
que `balance` ou `spend_cap − amount_spent` do objeto de conta da API de
Anúncios — são superfícies de API diferentes (Billing Hub vs. Marketing
API), com números que não batem entre si:

| Campo | Valor visto | Onde |
|---|---|---|
| `balance` (bruto, API de Anúncios) | R$ 43,99 | `get_account_balance` |
| `spend_cap − amount_spent` | R$ 381,14 | `get_account_balance` |
| `funding_source_details.display_string` | R$ 433,85 | `get_account_balance`, campo que a tela não usa hoje |
| **"Saldo pré-pago" (Billing Hub)** | **R$ 431,82** | Business Manager, não a Marketing API |

O `funding_source_details.display_string` é o que mais se aproxima do
saldo real do Billing Hub — não exatamente igual (diferença provável por
timing entre as duas consultas), mas é a pista mais confiável dentro da
própria resposta do `get_account_balance` hoje.

**FECHADO em 11/09/2026 (continuação 2) — não existe API exata, decisão
tomada:** pesquisa completa na documentação oficial confirmou que **não
existe** chamada de API (Marketing API ou Business Management API) que
devolva o "Saldo pré-pago" do Billing Hub com exatidão:
- `balance` é literalmente "Bill amount due" (valor devido, cobrança
  pós-paga) — por isso vem perto de zero numa conta pré-paga, onde não há
  fatura pendente.
- `is_prepay_account` (bool) só confirma que a conta é pré-paga, não
  devolve valor nenhum.
- `extendedcredits` (edge de linha de crédito) existe mas é pra cenário
  de conta corporativa com fatura (LOC), não se aplica a conta funded por
  carteira (PIX/cartão).
- `funding_source_details.display_string` continua sendo a aproximação
  mais próxima (R$ 433,85 vs. R$ 431,82 real), mas a doc oficial descreve
  esse campo só como texto de exibição do método de pagamento, sem
  garantia de refletir saldo em tempo real — é coincidência de
  proximidade, não um campo de saldo documentado.

**Decisão da Adriana (11/09/2026): não implementar o lembrete automático
de saldo por enquanto** — sem API confiável, o risco de mostrar número
errado é maior que o benefício. Item 6 do plano
(`docs/marketing-whatsapp-comandos.md`) fica de fora da implementação
atual. Não reabrir essa investigação — se aparecer uma API nova da Meta
pra isso no futuro, é achado novo, não retomar a pesquisa do zero.

**Achado à parte, não relacionado a saldo:** a página do Billing Hub
mostrava uma notificação ativa **"Erro no pagamento — selecione outra
forma de pagamento"**, sem data visível. Sinalizado pra Adriana conferir
direto — pode já estar resolvido, pode não estar. Fora do escopo de
código, é conta de pagamento dela.

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

## Verificação do app OAuth Google Ads (10/09/2026)

Enviado pra produção com o nome "Carro e Cia — Gestão de Anúncios Google
Ads" (conta dona: `lgacomerciodeveiculos@gmail.com`). Google rejeitou
**2 vezes seguidas com os 4 mesmos erros**, mesmo depois de corrigir o
conteúdo de verdade (política de privacidade Seção 4, página pública
`/integracao-google-ads`, nome do app renomeado no Console):

1. Política de privacidade sem conteúdo suficiente.
2. Homepage atrás de login.
3. Homepage não explica o propósito do app.
4. Nome do app não bate com o da homepage.

**Causa raiz (achada testando com `curl`, sem rodar JS):** o site
principal é uma SPA React/Vite. O HTML que o servidor entrega pra
qualquer rota é sempre o mesmo: `<div id="root"></div>` vazio e
`<title>Carro e Cia Veículos</title>` genérico — confirmado idêntico nas
3 páginas (raiz, `/integracao-google-ads`, `/politica-de-privacidade`).
`wrangler.jsonc` do site tem `"not_found_handling":
"single-page-application"`: sem prerender/SSR, todo conteúdo só existe
depois do JS rodar no navegador. O revisor de verificação do Google (ao
que tudo indica) não executa JavaScript — por isso os 4 erros voltaram
idênticos, palavra por palavra, na segunda tentativa.

**Solução escolhida — micro-site estático separado, não prerender do
site principal.** Adriana lembrou que também tem o registro de
`carroeciaveiculos.com.br` (domínio antigo, hoje só com um redirect pra
`carroeciamotors.com.br`, na mesma conta Cloudflare). Em vez de mexer no
pipeline de build do site (mais arriscado, cria dependência de
build-script), foi criado um subdomínio novo, `hub.` — sem tocar nos
registros DNS existentes:

- Repositório `hub-carroeciaveiculos` (fora do monorepo do site,
  conta GitHub `carroeciaveiculos-lgtm`, público): `worker.js` (HTML puro
  em template string, sem framework, sem build — serve `/` e
  `/politica-de-privacidade`), `wrangler.jsonc` (documenta a config, não
  testada via `wrangler deploy`), `README.md`.
- Publicado via API da Cloudflare direto (`PUT
  /accounts/{id}/workers/scripts/hub-carroeciaveiculos` multipart +
  `PUT /accounts/{id}/workers/domains` pro domínio customizado
  `hub.carroeciaveiculos.com.br`, zona `d5d420ba92e73d9ee3e509a79eeb9c9a`).
- Testado com `curl` (sem JS): título do app bate exatamente com o
  Console, as 5 subseções da política aparecem em texto puro. Confirmado
  que o redirect antigo do domínio (`carroeciaveiculos.com.br` →
  `carroeciamotors.com.br`) continua intacto.
- Commit `2e25bcd` no repo novo; **push ainda não feito** (remote
  configurado, falta autorização/pedido).

**3ª tentativa de verificação (10/09/2026) — erro novo, diferente dos 4
antigos (sinal de que a causa raiz foi resolvida):**

> O site do URL da sua página inicial "https://hub.carroeciaveiculos.com.br/"
> não está registrado para você.

Esse é um requisito separado: o Google exige que o domínio da homepage
esteja verificado no **Google Search Console**, com a mesma conta que é
dona do projeto (`lgacomerciodeveiculos@gmail.com`). Passo pendente (só a
Adriana, precisa do login dela):

1. `search.google.com/search-console` → Adicionar propriedade → tipo
   **Domínio** (não "Prefixo de URL") → `carroeciaveiculos.com.br` (cobre
   o subdomínio `hub.` junto).
2. Na prática o Search Console não pediu TXT manual — reconheceu o
   Cloudflare como provedor de DNS e ofereceu verificação automática via
   autorização OAuth direta na conta Cloudflare (`Lgacomerciodeveiculos@gmail.com`).
   Adriana autorizou, verificação instantânea, sem precisar de nenhum
   passo manual meu no DNS.
3. Reenviado pra verificação do app — **aprovado em 10/09/2026.**
   Confirmação recebida: "Sua marca foi verificada e está aparecendo
   para os usuários."

**Status final: verificação OAuth do app "Carro e Cia — Gestão de
Anúncios Google Ads" concluída e aprovada. Item fechado, não reabrir**
(a menos que o Google exija renovação/nova verificação no futuro, o que
não é o caso hoje).

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
