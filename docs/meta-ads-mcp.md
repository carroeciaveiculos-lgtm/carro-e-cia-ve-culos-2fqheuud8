# Meta Ads MCP — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-14.

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

Passos pra Adriana gerar o token:
1. `developers.facebook.com/tools/explorer/`
2. Selecionar o app (ou o padrão da própria Meta, se não tiver um).
3. Marcar as permissões: `ads_mcp_management`, `ads_read`, `ads_management`,
   `catalog_management`, `business_management`, `pages_show_list`,
   `instagram_basic`.
4. Gerar o token e copiar.

Atenção: token do Explorador costuma expirar em 1-2h. Bom pra confirmar que
a conexão funciona; se funcionar, trocar depois por um token de longa
duração (mesmo padrão já usado pro `WHATSAPP_TOKEN`).

## Garantia da própria Meta (não depende de mim lembrar)

"Qualquer ação realizada no seu nome requer sua autorização por meio do
agente de IA" — texto oficial da Central de Ajuda da Meta. Ou seja, mesmo
depois de conectado, a Meta também exige aprovação por fora, em cima da
regra já combinada com a Adriana de nunca gastar sem confirmar antes.
