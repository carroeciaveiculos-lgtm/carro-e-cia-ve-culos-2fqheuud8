# Meta Ads MCP — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-16 (achado grande sobre como gerar token válido — ver seção "Conexão por token").

## Contexto

Adriana pediu ajuda pra criar campanhas de anúncio Meta (Facebook/Instagram)
pra loja, sem entender do assunto. Em vez de eu operar via API "por fora", a
Meta lançou em 29/04/2026 um conector oficial de IA — servidor MCP de
anúncios — que dá acesso direto (com autorização dela a cada ação) à conta de
anúncios pelo chat.

## Dados da conta

| Item | Valor |
|---|---|
| ID da conta de anúncios | `4333456556917039` |
| Nome da conta | `carroecia_bot_claude` — conta nova, criada 14/08/2026 especificamente pra testar essa integração (isolada da conta principal) |
| Business Manager | mesmo usado pro WhatsApp/Catálogo |

## Conector MCP — estado atual

- Servidor: `https://mcp.facebook.com/ads` (oficial da Meta, mesmo URL pra todos os agentes de IA suportados: ChatGPT, Claude, Claude Code, Perplexity).
- **CONECTADO (14/08/2026)** — via token de acesso (Bearer), não via OAuth (ver "Becos sem saída"). Confirmado com `claude mcp get meta-ads` → `✔ Connected`.
- Config local (`~/.claude.json`, projeto `C:\Users\adria\.local\bin`):
  ```
  claude mcp add --transport http meta-ads https://mcp.facebook.com/ads \
    --header "Authorization: Bearer <token do Graph API Explorer, gerado 14/08/2026>"
  ```
- **Pendente:** confirmar que as ferramentas `mcp__meta-ads__*` aparecem numa
  conversa NOVA — a conexão foi feita "por fora" (via Bash, não via `/mcp`
  interativo), então a conversa que estava rodando no momento não conseguiu
  carregar as ferramentas em si mesma (só validou que a conexão funciona).
  Isso deve resolver sozinho na próxima conversa, que carrega o config do
  zero.
- Se `claude mcp get meta-ads` mostrar status diferente de `Connected` numa
  sessão futura, o token provavelmente expirou (validade curta, 1-2h) —
  gerar um novo no Graph API Explorer e repetir o `claude mcp add` (primeiro
  `claude mcp remove meta-ads -s local`).

## Como confirmar se a conta já tem acesso ao recurso

Meta Business Suite → Configurações → Integrações → **"Servidor MCP de
anúncios"**. Se essa opção não aparecer na lista, a conta ainda não tem
acesso liberado (confirmado pela documentação oficial da Meta, não é bug
nosso).

Nesse mesmo painel dá pra configurar limites antes de conectar (ex: bloquear
criação de campanha, travar orçamento máximo por ação) — vale configurar
antes do primeiro uso.

## Escopos pedidos no OAuth

`ads_mcp_management`, `ads_read`, `ads_management`, `catalog_management`,
`business_management`, `pages_show_list`, `instagram_basic`.

## Becos sem saída

- **`claude mcp login meta-ads` via Bash (tool do Claude Code) falha sempre**
  com `stdin isn't a terminal`. O comando chega a gerar a URL de autorização
  real da Meta, mas não completa o fluxo porque a chamada de ferramenta não
  tem TTY. Não adianta tentar de novo do mesmo jeito — precisa ser a própria
  Adriana rodando `!claude mcp login meta-ads` (prefixo `!` roda na sessão
  real dela, com terminal de verdade).
- **`/mcp` digitado pela Adriana "não abriu nada"** (14/08/2026) — causa
  ainda não confirmada, pode ser específico do cliente/app que ela usa pra
  conversar. Não investigado a fundo ainda.
- **CONFIRMADO (14/08/2026): `claude mcp login meta-ads` não funciona nem
  comigo nem com a Adriana rodando** — mesmo erro `stdin isn't a terminal`
  nos dois lados. Não é específico de quem roda; é o ambiente de conversa
  (harness) que não oferece terminal de verdade pra nenhum dos dois. **Não
  tentar de novo por esse caminho** — usar token de acesso estático em vez de
  OAuth (ver seção "Conexão por token", abaixo).
- **Token de Usuário de Sistema (Configurações do Negócio) nunca vai ter
  `ads_mcp_management`** — testado 16/08/2026, permissão não aparece na
  lista pra marcar, mesmo já tendo sido concedida uma vez pro usuário
  pessoal. Não tentar de novo por esse caminho, mesmo sendo o único que
  oferece "Nunca expira" na tela — ver seção "Conexão por token" acima pro
  caminho que funciona (token pessoal + troca por longa duração).
- A doc técnica (`developers.facebook.com/.../ads-mcp-server-get-started`)
  mostra um comando com `--client-id <META_APP_ID>`, que exige criar um app
  de desenvolvedor Meta. **Isso não deveria ser necessário** — a Central de
  Ajuda confirma que Claude Code está na lista de agentes com integração
  simples, sem precisar de app próprio. Fica registrado caso o caminho
  simples continue falhando e a gente precise cair pro caminho com app.

## Conexão por token (alternativa ao OAuth quebrado)

A doc oficial confirma um segundo método: gerar um token de acesso pelo
Explorador da Graph API e passar direto como header, sem fluxo de login
nenhum:

```
claude mcp remove meta-ads -s local
claude mcp add --transport http meta-ads https://mcp.facebook.com/ads \
  --header "Authorization: Bearer <TOKEN>"
```

### Achado importante (16/08/2026): `ads_mcp_management` só existe num tipo de token

Testamos os dois caminhos possíveis de gerar token com essa permissão:

- **Usuário de Sistema** (Configurações do Negócio → Usuários do Sistema →
  "Gerar token"): a permissão `ads_mcp_management` **não aparece na lista**
  pra marcar, nem antes nem depois de ela já ter sido concedida uma vez pro
  usuário pessoal da Adriana. Testado duas vezes, confirmado nas duas.
  **Não adianta insistir por esse caminho** — token de Usuário de Sistema
  não serve pro conector MCP de anúncios, mesmo sendo o único tipo que
  oferece "Nunca expira" na tela.
- **Explorador da Graph API, token de usuário pessoal** (não Usuário de
  Sistema): a permissão **existe** na lista de permissões — é preciso
  clicar em **"Generate Access Token"** (não o assistente de Usuário de
  Sistema) pra abrir a tela de consentimento de verdade, que pede
  aprovação da Adriana pra cada permissão marcada, `ads_mcp_management`
  incluída. Só assim ela é concedida. Confirmar com `GET me/permissions`
  no Explorer — deve aparecer `"status": "granted"`.

Passos pra gerar o token que funciona:
1. `developers.facebook.com/tools/explorer/`
2. App: `APP CARRO E CIA`. Usuário: **Token do usuário** (não Usuário do
   Sistema).
3. Marcar as permissões: `ads_mcp_management`, `ads_read`, `ads_management`,
   `catalog_management`, `business_management`, `pages_show_list`,
   `instagram_basic`.
4. Clicar em **"Generate Access Token"** e aprovar a tela de consentimento
   que abre.
5. Copiar o token do campo "Token de acesso".

Esse token dura só 1-2h (mesmo prazo curto de sempre) — **usar na hora**,
sem deixar passar tempo entre gerar e testar/trocar, senão expira antes.

### Como virar um token que não expira

Trocar o token curto por um de longa duração, via `oauth/access_token` no
próprio Explorer (barra de consulta), **na sequência**, sem deixar passar
tempo:

```
oauth/access_token?grant_type=fb_exchange_token&client_id=1369928368361968&client_secret=<CHAVE_SECRETA_DO_APP>&fb_exchange_token=<TOKEN_CURTO_RECEM_GERADO>
```

A chave secreta do app fica em
`developers.facebook.com/apps/1369928368361968/settings/basic/` → "Mostrar"
em "Chave secreta do aplicativo". **Nunca colar essa chave no chat** — ela
vale bem mais que um token comum (dá acesso de admin ao app inteiro). Se
ela vazar (ex.: colada sem querer numa conversa), gerar uma nova ali mesmo
("Gerar novo") assim que possível.

Resultado: um `access_token` novo. Confirmado com `debug_token` que ele tem
**`expires_at: 0`** (não expira) — comportamento da Meta pra usuários com
papel de Admin/Developer/Tester no app (a Adriana é Admin do
`APP CARRO E CIA`). Tem um campo separado, `data_access_expires_at`
(~90 dias à frente), que é uma exigência de reconfirmação de acesso a
dados da própria Meta — não derruba o token, só é bom lembrar dele daqui a
uns 3 meses caso algo pare de responder sem motivo aparente.

Esse token efetivamente permanente fica só na config local do conector MCP
(`claude mcp add`, arquivo `~/.claude.json`) — **não precisa ir pro
Supabase**. Nenhuma *edge function* fala com o servidor MCP
(`mcp.facebook.com/ads`); elas chamam a Graph API direto e usam o secret
`META_ADS_TOKEN` (token de Usuário de Sistema, permanente, sem
`ads_mcp_management` — e sem precisar dela).

## Garantia da própria Meta (não depende de mim lembrar)

"Qualquer ação realizada no seu nome requer sua autorização por meio do
agente de IA" — texto oficial da Central de Ajuda da Meta. Ou seja, mesmo
depois de conectado, a Meta também exige aprovação por fora, em cima da
regra já combinada com a Adriana de nunca gastar sem confirmar antes.
