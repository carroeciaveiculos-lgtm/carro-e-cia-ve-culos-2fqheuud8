# Marketing via comandos WhatsApp — plano técnico

**Como usar este documento.** Plano fechado com a Adriana. Implementação da
rodada 1 (itens 1-5, 7 abaixo) feita em 12/09/2026 — ver seção "Status da
implementação (12/09/2026)" no fim antes de continuar.

Última atualização: 2026-09-12.

## Origem (10-11/09/2026)

Depois de fechar a verificação do Google Ads, a Adriana pediu pra conferir
se a página antiga "Marketing" do menu ainda era usada. Achado: **está
morta**. Aba WhatsApp Scheduler grava em `social_posts` mas nada no sistema
lê/envia isso de verdade (0 registros desse tipo já existiram no banco). Aba
Analytics mostra `marketing_logs` tipo `email`/`social_post`, mas os dois
pararam em 22/06/2026 — sem dado novo há quase 3 meses. Curiosidade: a
tabela `marketing_logs` **está ativa de verdade** (79 registros, o mais
recente é de hoje), só que são tipos que essa página não exibe
(`daily_report`, `notification`).

A Adriana então pediu um plano pra um sistema de marketing de verdade,
funcionando via comandos WhatsApp enviados e recebidos.

## O que já existia (não reinventar)

Achado importante: **já existe um sistema de comandos via WhatsApp
funcionando**, não documentado antes:

- `supabase/functions/_shared/whatsapp-commands.ts` — roteador central,
  4 categorias já implementadas: CRM (`LEADS`, `QUENTES`, `HOJE`,
  `RESPONDER`), Estoque (`ESTOQUE`, `BUSCAR`, `VENDIDO`), Anúncios
  (`ANUNCIOS`, `PAUSAR`, `ORÇAMENTO` — **só Meta**, Google nunca foi
  incluído), Conteúdo/blog (`SUGERIR`, `VER`, `APROVAR`, `CORRIGIR`).
- `AUTHORIZED_PHONE` (hoje uma `const` única, `'5534984080220'`, o número
  da Adriana) é checado em **dois lugares**: dentro de
  `whatsapp-commands.ts` (decide se processa) e dentro de
  `whatsapp-webhook/index.ts` (decide se trata como comando de admin ou
  cai no fluxo de atendimento a cliente/Clara). **Os dois precisam mudar
  juntos** ao adicionar um segundo número — só mudar um faz a mensagem do
  segundo número cair no fluxo errado.
- `daily-report-cron` já roda toda manhã e já manda um resumo real pro
  WhatsApp (leads 24h por origem, veículos vendidos, estoque disponível,
  anúncios ativos no ML, alerta de canal silencioso) — vai pro número em
  `social_configuracoes.whatsapp_number` (fallback `'5534999484285'`,
  **número diferente** do `AUTHORIZED_PHONE` que comanda).
- `_shared/whatsapp-ads.ts` (`handlePausar`, `handleOrcamento`) e
  `_shared/whatsapp-conteudo.ts` já mostram o padrão de arquivo por
  categoria que o roteador importa — seguir o mesmo padrão pras
  categorias novas.

## 2 bugs reais achados (corrigir antes de mais nada)

1. **`whatsapp-ads.ts` nunca lê a resposta da API.** `handlePausar` e
   `handleOrcamento` disparam `fetch()` pro `ads-agent` mas não checam
   `.ok` nem o corpo — sempre respondem "✅ enviado", mesmo se a Meta
   recusar. O requisito da Adriana ("dar retorno do que foi realizado ao
   vivo") não existe de verdade hoje.
2. **Essa chamada provavelmente já falha com 401, sempre.** `ads-agent`
   (`supabase/functions/ads-agent/index.ts`, linhas ~38-66) exige um
   token de **usuário logado** via `userClient.auth.getUser()` pro painel
   admin — mas `whatsapp-ads.ts` manda `Authorization: Bearer
   ${supabaseServiceKey}` (chave de serviço, não é sessão de usuário).
   Bem provável que isso sempre retornou 401 "Authentication required",
   mascarado pelo bug 1 acima. **Fix:** dar ao `ads-agent` um caminho de
   autenticação alternativo pra chamada servidor-a-servidor, reaproveitando
   o padrão já usado em `daily-report-cron`/`publicar-social`
   (`_shared/internal-auth.ts`, header `x-internal-secret` +
   `INTERNAL_SERVICE_SECRET`), sem exigir login de usuário nesse caso.

## Pesquisa feita — grupo de WhatsApp não é viável hoje

A Adriana queria criar um grupo (ela + Fernando + o número da revenda) pra
comandar via `@suporte_ads`. Pesquisado (WebSearch, 11/09/2026): a
Plataforma WhatsApp Business (Cloud API), que é o que o sistema usa, **não
permite adicionar o número de negócio a um grupo comum criado pelo app do
celular**. Existe uma "Groups API" nova da Meta, mas exige status "Official
Business Account" (não confirmado se o número da Carro e Cia tem), entrada
só por link de convite (não dá pra "adicionar" direto), e o código atual
não usa nem foi testado contra ela — decidido não usar por ora.

**Decisão tomada:** lista de números autorizados (`AUTHORIZED_PHONE` vira
array) em vez de grupo — Adriana (`5534984080220`) + Fernando
(`5534984080000`, confirmado por ela) comandam cada um no chat 1-pra-1 com
o número da revenda. Se no futuro quiser visibilidade compartilhada (ver o
comando um do outro), a alternativa é o bot espelhar cada ação pros dois
números — não implementado, só anotado como possibilidade.

## Plano fechado (autorização pendente — nada implementado)

1. Corrigir `whatsapp-ads.ts` pra checar o resultado real da API antes de
   responder (bug 1 acima).
2. `ads-agent` aceitar `x-internal-secret` como alternativa ao login de
   usuário, pra chamadas servidor-a-servidor (bug 2 acima). Mesma mudança
   vale conferir se `google-ads-agent` precisa (ainda não foi chamado por
   comando WhatsApp, mas vai precisar quando `ORÇAMENTO`/`PAUSAR` cobrirem
   Google também).
3. `AUTHORIZED_PHONE` vira lista de 2 números — corrigido nos **dois**
   arquivos (`whatsapp-commands.ts` e `whatsapp-webhook/index.ts`).
4. Comandos novos/estendidos, execução **direta** (sem fila de aprovação
   — decisão explícita da Adriana pra esse canal, diferente do painel
   admin que mantém fila):
   - `LISTAR` — todas as campanhas ativas, Meta + Google juntas.
   - `PAUSAR [veículo/campanha]` — hoje só existe pra Meta, estender pra
     casar contra campanhas das duas plataformas.
   - `ATIVAR [veículo/campanha]` — comando novo, reativa campanha pausada.
   - `ORÇAMENTO [veículo/campanha] [valor]` — hoje só Meta, estender pra
     Google.
   - `GASTO` — gasto atual vs. limite de cobrança, nas duas plataformas
     (mesmos campos que `get_account_balance` já calcula).
   - **Casamento de nome:** buscar campanhas ativas (Meta + Google) e
     procurar por texto que bata com o que a pessoa escreveu. Exatamente 1
     match → executa. 0 ou 2+ matches (inclusive mesmo nome nas duas
     plataformas) → responde listando as opções, pede pra especificar.
5. **Teto de segurança por comando de orçamento:** recusar `ORÇAMENTO`
   acima de R$ 600 (Meta) / R$ 200 (Google) — são os valores que a Adriana
   manda por PIX toda segunda-feira pra cobrir a semana inteira (R$
   10-15/dia por veículo, várias campanhas). **Limitação sabida e aceita:**
   esse teto é por comando isolado, não soma várias campanhas ativas ao
   mesmo tempo — não impede que 3 campanhas de R$ 150/dia cada somem R$
   450/dia, bem acima do total semanal em 1 dia só. Somar tudo e comparar
   com o teto semanal de verdade é uma evolução futura, não desta rodada.
6. **Lembrete de saldo baixo**, embutido no `daily-report-cron` (decisão da
   Adriana: só no relatório diário, mandado pra Adriana **e** pro
   Fernando — não uma checagem separada mais frequente). Dispara quando o
   saldo cair a R$ 30 ou menos.
   **BLOQUEADO (11/09/2026) — não implementar ainda:** o desenho original
   usava `spend_cap − amount_spent` como "saldo", mas isso estava errado
   (ver correção em `docs/gestao-anuncios.md`, seção "Saldo não é saldo").
   O saldo real da Meta é um **saldo pré-pago** só confirmado hoje no
   Billing Hub do Business Manager (`business.facebook.com/.../billing_hub`),
   não no objeto de conta da Marketing API — não sei ainda se existe
   chamada de API que devolve esse número direto. **Investigar isso
   primeiro**, antes de escrever o cron do lembrete, senão ele vai
   monitorar o campo errado e nunca avisar na hora certa (ou avisar
   errado). O resto do plano (itens 1-5, 7, 8) não depende disso, pode
   seguir normalmente.
7. **Apagar a página "Marketing" morta**: `src/pages/admin/Marketing.tsx`,
   `src/components/admin/marketing/WhatsAppScheduler.tsx`, a rota em
   `App.tsx`, o item de menu em `AdminLayout.tsx`. Conferir com grep que
   não sobra nenhuma referência solta antes de considerar terminado.
8. Testar tudo ao vivo (comando real pro WhatsApp da Adriana) antes de
   dar por pronto — mesma disciplina das Fases 1/2 de Gestão de Anúncios.

**Comandos sugeridos pra rodada seguinte** (adiados de propósito, pra não
entregar superfície grande de uma vez só): `RECOMENDAÇÕES`, `DESEMPENHO
[veículo]` (métricas 7 dias), `ORÇAMENTO [veículo] +20%` (percentual em
vez de valor fixo), `PAUSAR TUDO` (freio de emergência), `DESFAZER`
(reverte última ação usando o valor anterior do `ads_audit_logs`).

## Conectores MCP novos (11/09/2026) — pendente autenticação da Adriana

Dois servidores MCP oficiais da Meta adicionados nesta sessão (comando
passado pela própria Adriana), **ambos exigem login dela** (`/mcp` na
sessão) antes de terem ferramenta nenhuma disponível:

- `whatsapp_business_tools` → `https://mcp.facebook.com/whatsapp_business_tools`
- `meta_social_technologies` → `https://mcp.facebook.com/devtools`

**Antes de implementar o plano acima, conferir o que essas ferramentas
oferecem** — podem simplificar partes do desenho (ex.: acesso oficial à
API de Grupos, envio de mensagem sem reimplementar a chamada crua à Graph
API). Se não mudar nada relevante, o plano acima segue como está.

## Conector `meta-ads` (o que já existe) — pra não confundir com os 2 novos

O servidor MCP `meta-ads` (`https://mcp.facebook.com/ads`) já está
conectado desde antes desta sessão, com um **token fixo** salvo no
header (`Authorization: Bearer ...`), sem OAuth/client-id nenhum. A
Adriana tentou rodar `claude mcp add ... --client-id <...> meta-ads
https://mcp.facebook.com/ads` (11/09/2026) — **não executado**: o
`--client-id` era claramente sobra de um exemplo copiado (veio com `< >`
literais), e um client-id não se aplica a esse conector (que não usa
OAuth). Esse client-id provavelmente era pra um dos 2 conectores novos
(`whatsapp_business_tools`/`meta_social_technologies`), que aí sim
precisam de autenticação. **Fechado em 11/09/2026 (continuação 2)**: a
Adriana não lembrava qual era, mas ficou sem efeito prático — os dois
conectores novos já foram autenticados/checados via `/mcp` normal, sem
precisar desse `--client-id` manual. Não rodar esse comando de novo.

Nota de segurança: um comando de diagnóstico (`claude mcp get meta-ads`)
imprimiu o token desse conector em texto puro no meio da conversa nesta
sessão. Não é segredo novo exposto por mim proativamente, mas ficou
visível — avaliar (com a Adriana) se vale revogar/gerar um novo no
Gerenciador de Negócios da Meta.

## Status da implementação (12/09/2026)

**Feito (itens 1-5, 7 do plano acima):**

- Bugs 1 e 2 corrigidos: `whatsapp-ads.ts` agora confere a resposta real da
  API antes de responder ao WhatsApp, e `ads-agent`/`google-ads-agent`
  aceitam o header `x-internal-secret` (mesmo padrão de
  `daily-report-cron`/`publicar-social`) como alternativa ao login de
  usuário pra chamada servidor-a-servidor.
- `AUTHORIZED_PHONE` virou `AUTHORIZED_PHONES` (Adriana + Fernando).
  **Achado que o plano não tinha mapeado**: não eram 2 lugares que checavam
  esse número, e sim **3** — o terceiro é
  `supabase/functions/webhook-portais/index.ts` (linha ~111), um webhook
  antigo que também processa eventos `whatsapp_business_account` além dos
  webhooks de portal. Corrigido pra lista ali também, mas **não investigado
  se esse webhook ainda está registrado de verdade no app da Meta** — ele
  chama `processWhatsAppCommand` só com 4 argumentos (faltam `waToken` e
  `waPhoneId`), então mesmo processando o comando, nunca manda a resposta de
  volta pro WhatsApp. Pode ser código morto duplicado de antes de
  `whatsapp-webhook/index.ts` existir — vale a Adriana decidir se apaga ou
  investiga, não decidi isso sozinho.
- Comandos novos: `LISTAR`, `ATIVAR`, `GASTO`. `PAUSAR`/`ORÇAMENTO` agora
  resolvem a campanha certa buscando nas duas plataformas.
- Teto de segurança (R$ 600 Meta / R$ 200 Google) implementado no
  `ORÇAMENTO`.
- Página "Marketing" morta apagada (`Marketing.tsx`,
  `WhatsAppScheduler.tsx`, rota, item de menu, entrada em
  `setor-acesso.ts`). Rota `/admin/marketing` agora redireciona pra
  `/admin/central-social` (link antigo não quebra). Card do Dashboard que
  apontava pra lá também repontado.

**Desvio do plano original — Google não ficou com execução direta:**
o plano original pedia execução direta (sem fila) pras duas plataformas.
Tentei espelhar em `google-ads-agent` as mesmas ações diretas
(`update_budget`/`toggle_status`) que a Meta já tinha, e o **classificador
de segurança do Claude Code bloqueou essa edição** (categoria "Security
Weaken") — mutação financeira direta, sem aprovação humana, alcançável só
com o header interno. Em vez de forçar, mantive Google passando pela fila
já existente (`criar_solicitacao`, a mesma que o painel admin usa pra
Google): `PAUSAR`/`ATIVAR`/`ORÇAMENTO` numa campanha do Google **registram
uma solicitação pendente** em vez de aplicar na hora, e o WhatsApp avisa que
precisa aprovar no painel. Meta continua com execução direta, como sempre
foi. **Decisão de reverter isso (forçar execução direta no Google também) é da
Adriana, não minha.**

**`findCampaignMatch` implementada (12/09/2026, mesma sessão):** ia ficar
como decisão de design pra Adriana, mas ela pediu a crítica da proposta e a
solução real em vez de escolher entre opções — implementada por
normalização (minúscula + sem acento) + casamento por palavra (não por
trecho contínuo, pra "civic touring" bater com "Honda Civic 2023 Touring
Prata" mesmo com "2023" no meio) contra todas as campanhas de qualquer
status. Mesmo nome nas duas plataformas ainda cai em "ambíguo", como já
decidido no plano.

**Achado grave no teste ao vivo (12/09/2026):** a Clara respondeu a Adriana
como se ela fosse uma lead nova, em vez do bot de comando responder. Causa:
o webhook que a Meta realmente chama pra WhatsApp é
`supabase/functions/receive-leads/index.ts` — não `whatsapp-webhook.ts` nem
`webhook-portais.ts` (ambos parecem código morto, sem tráfego real). Também
achado: o `wa_id` da Adriana chega sem o 9º dígito
(`553484080220` em vez de `5534984080220`), então mesmo com a checagem no
lugar certo, comparação direta nunca bateria. **Corrigido**: `isAuthorizedPhone()`
(tolerante ao 9º dígito) + interceptação de comando movida pra dentro de
`receive-leads/index.ts`, antes de qualquer criação de lead. Deploy feito.

**2º achado no teste ao vivo (12/09/2026): `LISTAR` respondia "nenhuma
campanha encontrada" mesmo com campanhas ativas.** Causa: `ads-agent` e
`google-ads-agent` foram publicadas com `verify_jwt = true` (feitas pro
painel admin, que sempre chama com login de usuário de verdade) — a chamada
do WhatsApp mandava só `x-internal-secret`, sem nenhum JWT, então a própria
borda do Supabase barrava com 401 **antes** do código da function rodar
(por isso nenhum log, nem erro — silêncio total, confirmado via
`ads_audit_logs` vazio + `edge_logs` sem nenhuma tentativa). **Corrigido**:
`callAgent()` em `whatsapp-ads.ts` agora manda `Authorization: Bearer
<service_role_key>` (satisfaz o gateway) junto com `x-internal-secret`
(autoriza de verdade dentro da function) — mesmo padrão que o código antigo
já usava, só que agora combinado com o bypass de login. Deploy feito.

**Pendente antes de dar por pronto (item 8):** confirmar de novo que os
comandos (`LISTAR`, `GASTO`, `PAUSAR`, `ATIVAR`, `ORÇAMENTO`) respondem
certo agora — 2 causas raiz já corrigidas nesta sessão, mas o teste
ponta-a-ponta ainda não fechou com sucesso.

## Padrão de exibição de anúncio (pedido da Adriana, 13/09/2026)

Toda resposta sobre anúncio de veículo mostra cada anúncio como
`[nome] [ano] [tipo de anúncio]` — função `formatarItem()` em
`whatsapp-ads.ts`. Detalhe técnico completo registrado em `MEMORY_WORK.MD`,
sessão 22.

**Achado que mudou o desenho**: as campanhas da conta são por OBJETIVO de
marketing ("Captação de leads", "Website_traffic"), não uma por veículo —
quem é "por carro" é o ANÚNCIO individual dentro da campanha (confirmado ao
vivo: campanha "[AEG][VENDAS][AGOSTO]" tem 25 anúncios, um por veículo,
todos dividindo o mesmo orçamento). Por isso:
- `LISTAR` abre cada campanha e mostra os anúncios dentro dela.
- `PAUSAR`/`ATIVAR` agora tentam achar primeiro um **anúncio** (Meta) com
  esse nome — só caem pra campanha inteira se não acharem. Agrupamento por
  "nome limpo" (sem marcador de formato tipo VD/CARROSSEL/ESTATICO/"— Cópia"
  — decisão da Adriana, 13/09/2026): `PAUSAR Commander` pausa TODOS os
  anúncios daquele carro (Estático + Carrossel juntos), não só cópias com
  nome idêntico. Anos diferentes continuam contando como carros/unidades
  diferentes, pedem especificar.
- `ORÇAMENTO` continua só por campanha (limitação real da Meta, orçamento
  não existe por anúncio individual) — se o nome bater com um anúncio,
  avisa isso em vez de "não encontrado".
- Só a Meta tem esse nível de anúncio implementado (o `toggle_status` dela
  aceita qualquer id de objeto). Google continua só por campanha.

## Em aberto

- Confirmar se `whatsapp_business_tools`/`meta_social_technologies`
  (depois de autenticados) mudam alguma decisão do plano antes de
  escrever código.
- **Achar a API certa pro "saldo pré-pago" da Meta** (bloqueia só o item
  6, lembrete de saldo — ver seção acima e `docs/gestao-anuncios.md`).
- Rodada seguinte de comandos (`RECOMENDAÇÕES`, `DESEMPENHO`, `%`,
  `PAUSAR TUDO`, `DESFAZER`) — só depois da rodada 1 testada e estável.
- Teto de orçamento por soma de campanhas (não só por comando isolado) —
  mencionado como evolução futura, não pedido ainda.
