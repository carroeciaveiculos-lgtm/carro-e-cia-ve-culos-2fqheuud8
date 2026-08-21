# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (21/08/2026, sessão 11). Leia primeiro:
- MEMORY_WORK.MD deste projeto (seção "O que está no ar hoje" tem tudo
  de 21/08: LinkedIn publicando como membro pessoal, testado ao vivo;
  página da empresa aguardando aprovação da LinkedIn)
- docs/linkedin-integracao.md — tudo sobre a conexão OAuth, o pivô de
  escopo (member vs organização) e o que muda no código quando a
  LinkedIn aprovar o Community Management API
- docs/meta-integracao.md — Instagram Stories, unificação Marketing/
  Central de Redes Sociais (20/08)

## Lembrete agendado — não precisa fazer nada até lá
Rotina cloud `trig_01TXYbwdUr6yMcRnMMrwBJxq` dispara em **26/08/2026 09h**
avisando a Adriana pra checar se a LinkedIn aprovou o "Request Access" do
"Community Management API" (feito em 21/08/2026). Se ela mencionar que já
foi aprovado antes disso, pular direto pro item 1 de "Precisa de decisão".

## Precisa de decisão/ação da Adriana
1. **Quando a LinkedIn aprovar o Community Management API**: mudar o
   escopo OAuth pra incluir `w_organization_social`, reescrever a busca de
   organização em `linkedin-oauth-callback` (usar `/rest/organizationAcls`,
   não `/v2/userinfo` — são permissões diferentes), e trocar o `author_urn`
   usado em `publicar-social` pela URN da organização quando publicar como
   página. Passo a passo completo em `docs/linkedin-integracao.md`, seção
   "Quando for aprovado". Não mexer nisso até ela confirmar a aprovação.
2. **LinkedIn e WhatsApp — WhatsApp ainda não implementado**: LinkedIn já
   funciona (membro pessoal). WhatsApp: ela decidiu que "publicar" significa
   mandar o post como mensagem de template (não Status, não Canal — ver
   `docs/meta-integracao.md` pro porquê). Falta: (a) ela aprovar pelo menos
   1 template no WhatsApp Manager da Meta, (b) eu criar uma function de
   sincronização de templates aprovados (não existe nenhuma hoje — a
   tabela `whatsapp_templates` está vazia), (c) conectar `publicar-social`
   ao `send-whatsapp` (que já sabe mandar template). Não implementado
   ainda, esperando ela aprovar o template primeiro.
3. **Facebook Stories** — decisão dela em 20/08 foi tratar como etapa
   separada do Instagram Stories (já no ar). Usa endpoint diferente
   (`/photo_stories`/`/video_stories`) e a permissão do app pra isso
   ainda não foi confirmada. Só mexer se ela pedir explicitamente.
4. **Automações de e-mail de nutrição de lead** — único item do
   backlog de 17/08 que ainda não foi implementado. Precisa de decisão
   de escopo (o que dispara o e-mail, frequência) e da chave de API do
   Brevo (nada configurado ainda, sem conector oficial).
5. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.
6. Confirmar se ela já trocou o `client_secret` do app Meta ("APP
   CARRO E CIA") que foi colado em texto puro no chat em 16/08/2026 —
   ainda não confirmado (developers.facebook.com/apps/1369928368361968/
   settings/basic/).

## Conferir, sem precisar perguntar
- **Push em dia**: confira `git log -1` — todo commit de 21/08 foi
  pushado no mesmo bloco de autorização, sem exceção.
- **LinkedIn publicando como membro pessoal, testado ao vivo** (21/08):
  post de teste real publicado e confirmado (`urn:li:share:...`), depois
  apagado via API (DELETE, 204) — não sobrou rastro. Não confunde com
  publicar na página da empresa, que ainda não existe (ver acima).
- **Instagram Stories no ar e testado ao vivo de verdade** (20/08):
  primeira tentativa deu "sucesso falso" do próprio Meta (media_id
  retornado, mas Story não existia — corrigido fazendo Stories esperar
  o processamento terminar, igual vídeo já esperava). Segunda tentativa
  confirmou via `GET /{ig-id}/stories`, não só pelo status no banco.
  Não reabrir essa investigação — se aparecer relato de Story que não
  publicou, é caso novo, não regressão do que foi corrigido.
- **Tela "Redes Sociais" de dentro de Marketing.tsx removida** (20/08)
  — era duplicata da Central de Redes Sociais desde 14/08. Marketing.tsx
  agora só tem WhatsApp e Analytics.
- **Webmotors — 4 veículos limpos da fila** (20/08, cota estourada desde
  13/08) e **2 veículos excluídos permanentemente** (Hilux `PYT5J89`,
  RAM Rampage `GTN5D81`, pedido direto da Adriana) — não reabrir sem
  ela pedir. Regra nova em `wm-sync` limpa a fila sozinha da próxima vez.
- Meta Ads MCP **resolvido em 16/08/2026** — não reinvestigar.
- **NaPista — produção liberada, 25/25 veículos publicados** desde
  18/08/2026. **Documentação de API — CONCLUÍDA** (18/08/2026). Nenhum
  dos dois é mais item em aberto.
- Regra em vigor (pedido direto da Adriana): sempre que eu aplicar uma
  mudança autorizada, perguntar se ela quer que eu já commite e dê push
  em seguida — não deixar acumular.
- Regra em vigor (17/08/2026): ao fechar qualquer tarefa que tocar o
  painel admin, checar `docs/manual-operacional-contexto.md` e já
  escrever o artigo que faltar relacionado à mudança.

## Deploy — como funciona
- **Frontend**: automático via Cloudflare Workers Builds a cada push
  pro `main`. Não rodar `wrangler deploy` manual por rotina.
- **Edge Functions**: **não é automático** — precisa `supabase
  functions deploy <nome>` manual depois do push. Toda function tocada
  numa sessão precisa desse passo antes de considerar a mudança "no ar".

## Segurança — não esquecer
- Nunca usar `execute_sql` direto pra mudança de **schema/cron** —
  sempre via migration. Mudança de **dado** (update/delete/insert em
  linha existente) pode ser direto, com cautela, a pedido explícito.
- Nunca escrever senha/segredo em texto plano numa migration.
- Antes de propor mudança em produção, autocrítica proativa própria
  ("o que um especialista atacaria nisso?") sem esperar ser perguntado.
- Ao criar function de diagnóstico temporária (ex.: checar permissão de
  token direto numa API externa), sempre remover a function E a entrada
  em `config.toml` depois de usar.
- Senha do Roberto e da conta kmzero (Webmotors) continuam expostas
  numa migration antiga — decisão da Adriana foi não mexer.

## Não repetir do zero
- A investigação de integridade de migrations (16/08) já está
  documentada — não reinvestigar.
- A causa raiz do mapeamento incompleto da Webmotors (cor/câmbio/
  combustível nunca gravados por `wm-confirmar-mapeamento`) já foi
  corrigida e testada ao vivo em 20/08.
- O pivô de escopo do LinkedIn (member vs organização) já foi
  investigado a fundo com a doc oficial — não repetir essa pesquisa,
  só consultar `docs/linkedin-integracao.md`.
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
