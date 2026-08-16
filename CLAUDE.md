# Carro e Cia Veículos — site + CRM

**Caminho local deste projeto:** `C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8`.
Sempre iniciar sessões de trabalho neste projeto a partir dessa pasta.

Revenda de veículos. Um único app React serve três coisas: o **site público**
(estoque, blog, landing pages), o **CRM/admin** (`/admin/*`) e o **hub interno**
(`src/hub/`). O backend é inteiramente Supabase — Postgres + Edge Functions.

## Stack

- React 19 + Vite 8 + TypeScript 6, SPA com React Router 7
- Tailwind 3 + shadcn/ui (Radix). Componentes base em `src/components/ui/` — **não editar à mão**
- Supabase (Postgres, Auth, Edge Functions em Deno) — project ref `htpcqdbhktmvppfemnad`
- Cloudflare: Workers para o site (`wrangler.jsonc`, serve `dist/`) e R2 para imagens
- Formulários: react-hook-form + zod 4

## Gerenciador de pacotes: bun

Use **bun**, não npm nem pnpm. O `pnpm-lock.yaml` é resíduo do template e será
removido; o lockfile válido é `bun.lock` (formato texto — o binário `bun.lockb`
corrompia no Windows, ver commit `7a16aab`).

```bash
bun install
bun run dev          # Vite em http://localhost:5173
bun run build        # gera dist/
bun run lint         # oxlint
bun run format       # oxfmt
```

Não existem testes automatizados — `bun run test` é um `echo` de placeholder.
Validação hoje é manual: `bun run lint` + `bun run build` + conferir no navegador.

## Estilo de código

O formatador é **oxfmt** (não prettier) e o linter é **oxlint** (não eslint).
Configuração em `.oxfmtrc.json`: **sem ponto e vírgula**, **aspas simples**.
Rode `bun run format` antes de commitar.

Imports usam o alias `@/` para `src/`.

## Organização

```
src/
  pages/          páginas públicas (Estoque, Veiculo, Consignacao, blog, lp/)
  pages/admin/    o CRM — 28 telas (Leads, Estoque, Portais, Conteudo, ...)
  hub/            área interna separada, com layout e rotas próprias
  services/       toda a conversa com o Supabase mora aqui
  lib/            regras puras e helpers (ml-*, wm-*, brand, r2-upload, ...)
  hooks/          hooks de UI e estado
  components/     admin/, home/, blog/, consignacao/, ui/ (shadcn)
supabase/
  functions/      56 Edge Functions em Deno
  functions/_shared/  código comum entre functions
  migrations/     146 migrations SQL
```

**Rotas ficam em `src/App.tsx`** — é o único lugar; o projeto foi gerado pelo
Skip e `.skip.config.json` aponta para lá.

### Padrão de acesso a dados

Nada de `supabase.from()` espalhado em componente. Toda query vive em
`src/services/<dominio>.ts`, exportada como função que devolve `{ data, error }`,
com tipos derivados de `Database['public']['Tables'][...]` (`src/lib/supabase/types.ts`).

```ts
export const getVeiculoById = async (id: string) => {
  const { data, error } = await supabase.from('veiculos').select('*').eq('id', id).single()
  return { data, error }
}
```

Quem chama trata o `error` — os services não lançam exceção.

## Edge Functions — a regra que mais quebra produção

Toda função **precisa** de uma entrada `[functions.<nome>]` em
`supabase/config.toml` com `verify_jwt` explícito. Sem entrada, o Supabase
assume `true` e a função retorna **401** para webhooks, crons e chamadas
server-to-server.

- Webhook externo, cron ou chamada de outra function → `verify_jwt = false`
- Chamada só pelo browser autenticado → `verify_jwt = true`

Com `verify_jwt = false`, valide o `Authorization` internamente
(`_shared/internal-auth.ts`) se a função fizer algo privilegiado.

A referência completa, com a tabela de classificação e o troubleshooting de 401,
está em `docs/edge-functions-rules.md`. **Atualize essa tabela ao criar função nova.**

### Pendência conhecida (verificado em 2026-08-06, reconferido em 2026-08-09)

Quatro funções existem em disco mas **não têm entrada no `config.toml`**, logo
estão com `verify_jwt = true` por omissão:

`populate-cache-test`, `send-lead-email`, `sync-drive-videos`, `sync-google-drive`

(A lista anterior citava oito. `avaliar-qualidade-anuncios`, `ml-diagnose-cambio`
e `publicar-social` já estavam declaradas; `wm-catalogue` foi declarada em
06/08/2026. As quatro acima seguiam sem entrada em 09/08/2026. Confira sempre
contra o `config.toml` seguindo o checklist do skill `nova-edge-function` — ele é
um checklist em texto, não há script executável — em vez de confiar nesta lista.)

Cuidado com o caminho inverso, que também já mordeu: `wm-sync` estava declarada
`false` aqui enquanto produção rodava `true`. Como ela só é chamada pelo admin
autenticado, um `supabase functions deploy` teria aberto a publicação no portal
para qualquer requisição sem sessão. Divergência config↔produção é bidirecional.

Além disso, `docs/edge-functions-rules.md` classifica `ads-agent`, `ai-agents`,
`ai-assistant`, `content-workflow-notification`, `enviar-para-assinatura` e
`gerar-conteudo` como server-to-server (`false`), mas o `config.toml` está com
`true`. Doc e config divergem — decidir qual está certo antes de mexer nelas.

## Imagens: Cloudflare R2, não Supabase Storage

O storage foi migrado para o R2. URLs novas devem apontar para o R2 — usar
`src/lib/r2-upload.ts` e a function `get-r2-presigned-url`. Migrations recentes
(`20260726031500_migrate_all_storage_urls_to_r2.sql`) reescreveram as URLs antigas.
Ao adicionar imagem, não voltar a gravar em `supabase.storage`.

Configuração de CORS do bucket em `docs/R2_CORS_CONFIGURATION.md`.

## Integrações externas

| Plataforma | Onde |
|---|---|
| Mercado Livre | `functions/ml-*`, `_shared/ml-*`, `lib/ml-*` |
| Webmotors | `functions/wm-*`, `_shared/wm-soap.ts` (SOAP) — **leia `docs/webmotors-integracao.md` antes de mexer** |
| WhatsApp / Meta | `functions/whatsapp-webhook`, `send-whatsapp`, `_shared/whatsapp-*` |
| Autentique (assinatura) | `enviar-para-assinatura`, `webhook-autentique` |
| Google Drive (fotos/vídeos) | `sync-google-drive`, `sync-drive-videos` |
| IA (Gemini) | `_shared/gemini-client.ts`, `gerar-conteudo`, `ai-sdr` |

Existem agentes especializados em `.claude/agents/` para Mercado Livre e Webmotors —
use-os antes de mexer nessas integrações.

**Referências técnicas atualizáveis** — vá direto à seção do assunto em vez de
reinvestigar. Cada uma tem uma seção "becos sem saída" com o que já foi testado e
falhou; ao descobrir algo novo, acrescente lá com data e fonte.

- `docs/webmotors-integracao.md` — pipeline, fatos confirmados pelo suporte,
  de/para de vocabulário, pendências e consultas de diagnóstico
- `docs/edge-functions-rules.md` — classificação de `verify_jwt` por função
- `docs/R2_CORS_CONFIGURATION.md` — CORS do bucket de imagens

## Migrations

Nomeie `YYYYMMDDHHMMSS_descricao.sql`. Já houve colisão de timestamp no passado
(dois arquivos `20260624000000_*`) — confira que o seu é único.

RLS é levada a sério aqui: várias migrations existem só para corrigir policy.
Ao criar tabela, crie a policy na mesma migration.

## Integridade de migrations e deploys

Achado em 16/08/2026: 47 migrations com timestamp local diferente do
registrado no banco (aplicadas via MCP, que carimba a hora real em vez da
hora do nome do arquivo), e ao menos uma correção real em produção
(`corrige_laco_republicacao_webmotors`) sem **nenhum** registro no
histórico — aplicada direto via `execute_sql`, sem deixar rastro algum.
Também achados: dois pares de cron duplicados (criados ao tentar renomear
um job existente em vez de alterá-lo) rodando a mesma função sem que
ninguém notasse por semanas.

- **Nunca usar `execute_sql` para mudança de schema ou cron.** Sempre via
  migration (`apply_migration` ou `db push`) — é o que deixa rastro no
  histórico. Mudança de schema fora de migration é invisível e
  irrecuperável numa reconstrução do banco.
- **Depois de aplicar uma migration via MCP, sempre conferir**
  (`migration list`) e **renomear o arquivo local** pro timestamp real
  que o banco registrou. Nunca assumir que "aplicou" = "sincronizado".
- **Antes de criar um cron novo, checar se já existe um** (`select * from
  cron.job`) — renomear/reagendar é `cron.alter_job` ou
  unschedule-e-recriar-com-mesmo-nome, nunca criar um job novo com nome
  diferente e deixar o antigo pra trás.
- **Antes de propor qualquer mudança em produção (migration, deploy,
  config), rodar mentalmente "o que um especialista crítico atacaria
  nisso?" antes de apresentar** — sem esperar ser perguntado:
  - Informação reaproveitada de uma leitura/investigação anterior ainda
    vale pro objetivo atual, ou só valia pro objetivo original (releia
    antes de propor executar de novo)?
  - Uma busca que não achou nada — que escopo exatamente foi buscado?
    "Não achei evidência" não é o mesmo que "não existe".
  - A proposta nova é consistente com o que já foi afirmado antes na
    mesma conversa, ou contradiz um princípio já declarado?

## Git e deploy

- Remote: `carroeciaveiculos-lgtm/carro-e-cia-ve-culos-2fqheuud8`, branch `main`
- Mensagens de commit em português, prefixo `fix:` / `chore:` / `feat:`
- Deploy do front: build + Cloudflare Workers (`wrangler.jsonc`, SPA fallback)
- Deploy de function: `supabase functions deploy <nome>`

Existe uma worktree em `../carro-e-cia-ve-culos-2fqheuud8.worktrees/` usada por
agentes — não é branch de trabalho manual.

## Memória de trabalho — manter em dia

`MEMORY_WORK.MD` (raiz do projeto) responde "onde paramos?" sem reler o
histórico de conversas — status do que está no ar e pendências abertas.
`AUDIT_REPORT.md` é histórico antigo, não é mais atualizado; **não confundir
os dois**.

**Atualize `MEMORY_WORK.MD`** ao concluir um pedaço de trabalho relevante
(nova função, integração, bug corrigido em produção) e, principalmente,
**antes de a conversa terminar** — pra próxima sessão já começar sabendo o
estado real. Detalhe técnico continua indo pra `docs/<assunto>.md`, não pra
esse arquivo; ele é só o resumo + pendências.

**Sempre que for fechar uma sessão, atualize também `PROXIMA_SESSAO.md`**
(raiz do projeto) — um prompt pronto pra copiar e colar como primeira
mensagem da sessão seguinte, com o que precisa de ação da Adriana e o que
é só andamento meu, pra não ter que reconstruir esse contexto do zero.

## A PREENCHER pela Adriana

Estas são regras de negócio que não dá para deduzir do código. Quanto mais
específico aqui, menos eu erro:

- **Status de veículo**: existem `disponivel`, `devolvido`, `em_preparacao`,
  `rascunho`. Qual é o fluxo válido entre eles? Veículo vendido pode ser deletado
  ou só muda status?
- ~~**Preço**~~ **RESPONDIDO em 10/08/2026.** Decimal com 2 casas (`numeric`), não
  centavos. Dois campos, com donos bem diferentes:

  - `preco_venda` é o **"Por"** — o valor que o cliente paga. Definido por quem
    cadastra o veículo em `src/pages/admin/VehicleFormModal.tsx`, e usado em todo
    o resto (site, card, página do veículo, documentos, Mercado Livre).
  - `preco_revenda` é o **"De"** — o preço riscado de vitrine, só referência.
    **Campo órfão:** nenhuma tela, função ou migration escreve nele; só o
    `_shared/wm-soap.ts` o lê, para mandar como `<PrecoReal>` à Webmotors. Os
    valores que existem hoje foram postos direto no banco.

  A Webmotors exige `PrecoReal` **estritamente maior** que `PrecoVenda`; iguais
  dão `22|78` e **bloqueiam** a publicação (`CodigoAnuncio` volta 0). Ela também
  valida o "De" contra a FIPE (código `105`), então não dá para simplesmente
  inflar o valor. Ver `docs/webmotors-integracao.md`.
- **Números de WhatsApp/telefone — RESPONDIDO em 15/08/2026.** Quatro números,
  papéis fixos, não intercambiáveis:

  - `5534997384177` (Clara) — atendimento geral do site: chat, CTAs, botões de
    veículo, campanhas, landing pages, conteúdo gerado por IA. É o padrão em
    `src/lib/whatsapp.ts` (`getWhatsAppLink`) — não hardcode outro número num
    fluxo genérico, deixe cair no padrão.
  - `5534984080220` (celular pessoal da Adriana) — só em botões/fluxos de
    **consórcio** (`ConsorcioAuto.tsx`), e como destino dos alertas
    administrativos internos (novo agendamento, relatório diário, no-show,
    lead do Meta Ads, artigo pronto pra revisão). Vem de
    `social_configuracoes.whatsapp_number` — esse campo é só pra alerta
    interno, nunca pra link público de WhatsApp.
  - `5534992000300` (Gabriel) — só em botões/fluxos de **seguro auto**
    (`SeguroAuto.tsx`).
  - `553433159400` (fixo da loja) e `5534992893615` (celular da loja) — **só
    ligação direta** (`tel:`), nunca `wa.me`. Aparecem no `telephone` dos
    dados estruturados (schema.org, `SEO.tsx`/`Index.tsx`/`VenderMeuCarro.tsx`)
    e no rodapé/"Onde estamos" do site.

  Números individuais da equipe no rodapé (Luiz, Roberto etc.) são à parte,
  não seguem essa hierarquia. Briefing do agente `web-designer-senior.md`
  mantido em sincronia com o número da Clara.
- **Leads**: o que nunca pode faltar num lead? Qual o SLA/fluxo depois que entra?
- **Publicação em portais**: existe aprovação manual antes de subir anúncio?
- **O que eu nunca devo mexer sem te perguntar?** (ex.: migrations em produção,
  credenciais de portal, disparo de WhatsApp real)
