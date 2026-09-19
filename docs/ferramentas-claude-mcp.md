# Ferramentas do Claude neste projeto (MCP, API, testes) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Este documento é sobre as ferramentas que o **Claude** (eu) tenho disponíveis
pra trabalhar neste projeto — não sobre as integrações que o **sistema**
consome (essas estão em `docs/webmotors-integracao.md`,
`docs/mercadolivre-integracao.md`, `docs/consultas-externas.md` etc.).

Última atualização: 2026-09-19.

## Dois conectores Supabase — read-only e write

Existem **dois** conectores MCP do Supabase disponíveis, e eles não são
equivalentes:

| Conector | Role do Postgres | Pode fazer |
|---|---|---|
| `mcp__supabase__*` | `supabase_read_only_user` | Só leitura. `UPDATE`/`INSERT` falham; `net.http_post` com segredo interno falha com `permission denied for function get_internal_service_secret` (a function é `SECURITY DEFINER`, só liberada pra `postgres`/`service_role`) |
| `mcp__claude_ai_Supabase__*` | `postgres` | Leitura e escrita real — `UPDATE`/`INSERT`/`DELETE`, `net.http_post` com segredo interno, tudo |

**Use `mcp__claude_ai_Supabase__*` sempre que precisar escrever no banco ou
chamar uma function via `net.http_post` com `x-internal-secret`.** Achado
originalmente em 18/09/2026 (sessão 23/24, investigação do WABA — ver
`MEMORY_WORK.MD`), confirmado de novo em 19/09/2026.

Project ref: `htpcqdbhktmvppfemnad`.

## Chamar Edge Function direto do SQL (sem passar pelo frontend)

Padrão pra testar/disparar uma function sem esperar a tela: `net.http_post`
dentro de `execute_sql` (conector com write, ver acima).

```sql
select net.http_post(
  url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/<nome-da-function>',
  headers := jsonb_build_object('x-internal-secret', public.get_internal_service_secret(), 'Content-Type', 'application/json'),
  body := jsonb_build_object('veiculo_id', '...')
) as request_id;

-- resultado chega assíncrono, ler depois:
select status_code, content::text, error_msg from net._http_response where id = <request_id>;
```

Isso só funciona pra functions que **não exigem JWT de usuário** — ver
`docs/edge-functions-rules.md` pra saber qual é qual (`verify_jwt` no
`config.toml`). Três variações reais, achadas testando ao vivo (19/09/2026):

1. **`verify_jwt = false` + valida `x-internal-secret`** (ex.:
   `napista-sync-catalogo`) — precisa do header `x-internal-secret` com
   `public.get_internal_service_secret()`, senão devolve 401.
2. **`verify_jwt = false` sem nenhuma validação interna** (ex.:
   `napista-mapear-veiculo`, `napista-confirmar-mapeamento`, `napista-sync`)
   — funciona só com `Content-Type`, nem precisa do secret. Mais simples,
   mas repare que **qualquer um com a URL consegue chamar** — não é o padrão
   ideal de segurança, só reporto o fato observado.
3. **`verify_jwt = true`** (ex.: `wm-sync`, `wm-mapear-veiculo`,
   `wm-confirmar-mapeamento`) — devolve `UNAUTHORIZED_NO_AUTH_HEADER` pra
   `net.http_post`, mesmo com o segredo interno certo. **Não dá pra chamar
   via SQL** — precisa passar pela sessão real de um usuário logado (ver
   seção do navegador, abaixo).

## Navegador (claude-in-chrome) — pra ações que exigem sessão de usuário

Quando a function exige `verify_jwt = true` (chamada só pelo browser
autenticado), a única forma de disparar de verdade é clicando na tela, com
uma sessão real logada — não dá pra simular com `net.http_post`.

- **Nunca digito login/senha** — é regra de segurança do Claude Code, não
  deste projeto especificamente. Se não houver sessão já aberta no Chrome
  controlado pelo `claude-in-chrome`, peço pra Adriana logar antes.
- Servidor local (`bun run dev`, porta 8080 neste projeto) **usa o mesmo
  banco e as mesmas credenciais de produção** — não é um ambiente de teste
  isolado. Clicar em "Publicar" no NaPista/Webmotors localmente publica de
  verdade nas plataformas reais. Confirmar com a Adriana antes de clicar em
  qualquer ação real (achado 19/09/2026, caso Jaguar F-Pace/Chery Tiggo 8).

## Publicar (deploy) Edge Function via MCP

`mcp__claude_ai_Supabase__deploy_edge_function` funciona, mas o formato dos
`files` importa — **achado real, quebrou em produção por 1 versão em
19/09/2026** (`napista-sync-catalogo` v22 → `BOOT_ERROR`, corrigido na v23):

- Nomeie os arquivos com o prefixo `functions/`, espelhando a estrutura real
  do repo: `functions/<nome-da-function>/index.ts`,
  `functions/_shared/<arquivo>.ts`, `functions/<nome-da-function>/deno.json`.
- Passe `entrypoint_path` e `import_map_path` com esse mesmo prefixo
  (`functions/<nome-da-function>/index.ts` e
  `.../deno.json`) — sem isso, ou com só `index.ts`, o bundler não resolve
  os imports relativos (`../_shared/...`) e o deploy falha com "Module not
  found" ou erro de import map.
- Inclua **todos** os arquivos `_shared` que a function importa (direto ou
  indireto) — confira antes com `get_edge_function` no que já está publicado
  pra pegar a lista completa de arquivos.
- **Depois de publicar, teste com uma chamada real antes de seguir em
  frente.** Um deploy pode voltar "sucesso" da ferramenta e ainda assim a
  function não sobe (`BOOT_ERROR` só aparece na primeira invocação, não no
  deploy em si). Ver logs com `mcp__claude_ai_Supabase__query_logs`,
  `source = 'function_logs'`, filtrando por `worker boot error`.

## Timeout de 5s do `net.http_post` — não confie só na resposta

`net.http_post` (pg_net) tem timeout padrão de **5 segundos**. Chamadas reais
pra Webmotors/NaPista podem demorar mais que isso (achado real 19/09/2026,
Chery Tiggo 8: `napista-sync` estourou o timeout do lado do banco, mas a
function **continuou rodando e completou com sucesso do lado do servidor**).

Se `net._http_response` voltar `status_code: null` e `error_msg` com
"Timeout of 5000 ms reached", **não assuma que falhou** — confira o
resultado real direto na tabela que a function escreve (ex.:
`estoque_publicacoes`, `napista_mapeamento_veiculos`), não o retorno do
`net.http_post`.

## Logs

```sql
select distinct source from logs; -- descobre as fontes disponíveis
select timestamp, event_message from logs where source = 'function_logs' order by timestamp desc limit 30;
```

Fontes úteis: `function_logs` (`console.log`/erro de boot das Edge
Functions), `function_edge_logs` (nível HTTP), `postgres_logs`.
`mcp__claude_ai_Supabase__query_logs` também funciona pelo conector
read-only (`mcp__supabase__query_logs`) — leitura de log não exige write.

## Becos sem saída — não repetir

- Chamar `wm-sync` (ou qualquer function `verify_jwt = true`) via
  `net.http_post` sempre devolve `UNAUTHORIZED_NO_AUTH_HEADER`, mesmo com o
  `x-internal-secret` certo — o secret interno não substitui JWT de usuário.
  Não adianta insistir com header diferente; a saída é a sessão real do
  navegador.
- `mcp__supabase__execute_sql` (o conector read-only) nunca vai conseguir
  `net.http_post` com segredo, nem `UPDATE` — não é bug pra reportar, é o
  desenho da role `supabase_read_only_user`. Trocar de conector, não tentar
  contornar com sintaxe diferente.
- Publicar uma Edge Function com `files` usando nomes sem o prefixo
  `functions/` (ex.: só `index.ts`, `_shared/cors.ts`) engana a ferramenta —
  ela aceita o payload e devolve sucesso, mas o `entrypoint_path` real vira
  um caminho quebrado e a function não bunda. Sempre confira com uma chamada
  de teste depois, não só o retorno do `deploy_edge_function`.
