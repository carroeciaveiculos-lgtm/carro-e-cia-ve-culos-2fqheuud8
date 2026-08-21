# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (20/08/2026, sessão 10). Leia primeiro:
- MEMORY_WORK.MD deste projeto (seção "O que está no ar hoje" tem tudo
  de 20/08: Instagram Stories, unificação Marketing/Central de Redes
  Sociais, correções na Webmotors, fix do post de "Ideias com IA")
- docs/meta-integracao.md — seção "Fatos confirmados" tem o detalhe
  técnico completo das mudanças de hoje em redes sociais
- docs/webmotors-integracao.md — seção "Correções e regras novas —
  20/08/2026" tem o detalhe técnico das mudanças de hoje na Webmotors

## Precisa de decisão da Adriana
1. **LinkedIn e WhatsApp aparecem como opção de rede no formulário de
   post** (Central de Redes Sociais → Publicações), mas não têm
   nenhuma implementação real em `publicar-social` — se alguém marcar
   só essas duas (sem Facebook/Instagram), o post vira "Publicado"
   sem nada acontecer em lugar nenhum. Perguntado a ela em 20/08, sem
   resposta ainda: remover as opções (já que não existem de verdade)
   ou implementar de verdade? Não mexer sem decisão dela — ver
   `docs/meta-integracao.md`.
2. **Facebook Stories** — decisão dela em 20/08 foi tratar como etapa
   separada do Instagram Stories (já no ar). Usa endpoint diferente
   (`/photo_stories`/`/video_stories`) e a permissão do app pra isso
   ainda não foi confirmada. Só mexer se ela pedir explicitamente.
3. **Automações de e-mail de nutrição de lead** — único item do
   backlog de 17/08 que ainda não foi implementado. Precisa de decisão
   de escopo (o que dispara o e-mail, frequência) e da chave de API do
   Brevo (nada configurado ainda, sem conector oficial).
4. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.
5. Confirmar se ela já trocou o `client_secret` do app Meta ("APP
   CARRO E CIA") que foi colado em texto puro no chat em 16/08/2026 —
   ainda não confirmado (developers.facebook.com/apps/1369928368361968/
   settings/basic/).

## Conferir, sem precisar perguntar
- **Push em dia**: commit `d1dbf12` é o mais recente enviado pro
  GitHub (20/08/2026). Árvore de trabalho limpa, nada pendente.
- **Instagram Stories no ar e testado ao vivo de verdade** (20/08):
  primeira tentativa deu "sucesso falso" do próprio Meta (media_id
  retornado, mas Story não existia — corrigido fazendo Stories esperar
  o processamento terminar, igual vídeo já esperava). Segunda tentativa
  confirmou via `GET /{ig-id}/stories`, não só pelo status no banco.
  Não reabrir essa investigação — se aparecer relato de Story que não
  publicou, é caso novo, não regressão do que foi corrigido.
- **Tela "Redes Sociais" de dentro de Marketing.tsx removida** (20/08)
  — era duplicata da Central de Redes Sociais desde 14/08 (nunca tinha
  sido apagada quando a Central foi criada). Marketing.tsx agora só
  tem WhatsApp e Analytics. Se alguém perguntar "cadê o agendador de
  post que tinha em Marketing", a resposta é: virou a Central de Redes
  Sociais → Publicações, que já existia e fazia a mesma coisa melhor.
- **Webmotors — 4 veículos que falhavam por cota estourada desde
  13/08 foram limpos da fila** (20/08) — Toyota Hilux SW4 SRX
  (`SSF5A83`), Audi A3 (`PQE7D92`), Ford Mustang Mach 1 (`SFZ3G06`),
  Land Rover Freelander2 (`OPZ2408`). Continuam `disponivel`, só não
  têm mais tentativa pendente — publicar de novo é ação manual quando
  houver vaga. Regra nova em `wm-sync` limpa a fila sozinha da próxima
  vez que isso acontecer.
- **Toyota Hilux SW4 SRX (`PYT5J89`) e RAM Rampage (`GTN5D81`)
  excluídos permanentemente da Webmotors** (20/08, pedido direto da
  Adriana) — `status_sincronizacao = 'excluido_manualmente'`, não
  voltam pra fila de revisão nem se o veículo for salvo de novo no
  admin. Não reabrir essa decisão sem ela pedir.
- Meta Ads MCP **resolvido em 16/08/2026**: conector conectado com token
  pessoal de longa duração (Admin do app, `expires_at: 0`). Token de
  Usuário de Sistema NUNCA funciona pra essa permissão — testado duas
  vezes. Não reinvestigar, ver `docs/meta-ads-mcp.md`.
- **NaPista — produção liberada, 25/25 veículos publicados de verdade**
  desde 18/08/2026. Não reabrir a investigação de client_id.
- **Documentação de API — CONCLUÍDA** (18/08/2026): índice + 4 grupos
  (67 functions) + 4 artigos resumo na Central de Ajuda. Não é mais um
  item em aberto.
- Regra em vigor (pedido direto da Adriana): sempre que eu aplicar uma
  mudança autorizada, perguntar se ela quer que eu já commite e dê push
  em seguida — não deixar acumular. Seguida à risca hoje: todo commit
  de 20/08 foi pushado no mesmo bloco de autorização.
- Regra em vigor (17/08/2026): ao fechar qualquer tarefa que tocar o
  painel admin, checar `docs/manual-operacional-contexto.md` e já
  escrever o artigo que faltar relacionado à mudança, sem esperar
  pedido explícito.

## Deploy — como funciona
- **Frontend**: automático via Cloudflare Workers Builds a cada push
  pro `main`. Não rodar `wrangler deploy` manual por rotina.
- **Edge Functions**: **não é automático** — precisa `supabase
  functions deploy <nome>` manual depois do push (git push não deploya
  function nenhuma). Toda function tocada numa sessão precisa desse
  passo antes de considerar a mudança "no ar".

## Segurança — não esquecer
- Nunca usar `execute_sql` direto pra mudança de **schema/cron** —
  sempre via migration. Mudança de **dado** (update/delete/insert em
  linha existente) pode ser direto, com cautela — foi assim que as
  exclusões da Webmotors e a limpeza de rascunhos sociais foram feitas
  hoje, todas a pedido explícito da Adriana.
- Nunca escrever senha/segredo em texto plano numa migration.
- Antes de propor mudança em produção, autocrítica proativa própria
  ("o que um especialista atacaria nisso?") sem esperar ser
  perguntado — ver memória permanente `autocritica-antes-de-propor`.
- Antes de propor configuração/integração técnica pra um sistema real
  já conectado, checar o estado real com a ferramenta disponível
  (MCP/CLI) ANTES de descrever a solução.
- Senha do Roberto e da conta kmzero (Webmotors) continuam expostas
  numa migration antiga — decisão da Adriana foi não mexer. Não
  reabrir isso sem ela pedir.
- Ao criar function de diagnóstico temporária (ex.: checar permissão
  de token direto na API do Meta), sempre remover a function E a
  entrada em `config.toml` depois de usar — feito duas vezes hoje
  (`debug-meta-social-check`), sem sobra.

## Não repetir do zero
- A investigação de integridade de migrations (16/08) já está
  documentada — não reinvestigar.
- As 22 migrations sem arquivo local continuam pendentes (precisa
  Docker Desktop instalado) — sem urgência.
- A auditoria completa das 21 páginas do painel (17/08) já foi feita e
  gerou `docs/manual-operacional-contexto.md` — não reauditar do zero.
- A causa raiz do mapeamento incompleto da Webmotors (cor/câmbio/
  combustível nunca gravados por `wm-confirmar-mapeamento`) já foi
  corrigida e testada ao vivo em 20/08 — não reabrir a menos que
  apareça um caso novo depois dessa correção.
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
