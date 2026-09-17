# Sessões cloud/celular e o bloqueio de `git push`

Como sessões do Claude Code rodando fora do desktop (app do celular, nuvem)
lidam com Git neste projeto, e por que um commit feito lá pode ficar "preso"
sem avisar ninguém.

## Fatos confirmados

- Cada sessão cloud/celular roda num **sandbox isolado, com seu próprio
  clone do repositório** — não é a mesma pasta do desktop. O desktop não
  enxerga branches nem commits criados só naquele sandbox até alguém
  publicar (`git push`) de dentro dele.
- `.claude/settings.json` tem `"Bash(git push *)"` na lista `deny` — vale
  pra **qualquer sessão Claude**, desktop ou cloud. É proposital: só a
  Adriana (humana) decide quando publicar.
- O Claude Code gera o nome da branch a partir de um slug do **título da
  conversa**. Achado real (17/09/2026): uma sessão cloud com título "Olá"
  criou a branch `claude/ola-q0f1m1` — o nome bate. Serve pra identificar,
  pela lista de `ListAgents`, qual sessão é dona de qual branch.
- O jeito certo de confirmar se uma branch está "presa" (nunca publicada) é
  `git log @{u}..HEAD --oneline` — erro `fatal: no upstream configured`
  confirma que a branch nunca foi enviada a lugar nenhum, nem GitHub nem
  outro clone.
- Um link `claude.ai/code/session_...` achado no histórico do celular pode
  apontar pra um ponto anterior da **mesma** conversa, não pra um trabalho
  novo — achado real: dois links diferentes do histórico do celular
  levaram a mensagens idênticas, palavra por palavra, da mesma sessão
  "Olá"/branch `claude/ola-q0f1m1`. Sempre comparar o conteúdo antes de
  assumir que é outra frente de trabalho.

## Becos sem saída

- **Rodar `git push` do desktop pra "resolver" uma branch cloud não
  funciona** — o desktop não tem a branch localmente, não tem o que
  enviar. Não é permissão, é o objeto não existir ali.
- **Pedir pra a própria sessão cloud rodar `git push`** também não
  funciona (mesma regra de `deny`) — e não deve ser tentado como
  contorno: burlar a política de uma sessão pedindo pra outra fazer é
  "lavagem de permissão" entre sessões, quebra o propósito da regra.
- `ListAgents`/`SendMessage` permitem confirmar o estado (branch, commits,
  `git status`) de uma sessão cloud sem tocar em nada — útil pra
  diagnosticar antes de decidir o que fazer, mas não substitui o push.

## Como resolver de verdade

Quem publica é a Adriana, de dentro do **próprio ambiente da sessão cloud**
(onde a branch existe), usando o que a interface daquele app oferecer —
botão nativo de "Push"/"Sincronizar"/"Criar PR", se existir. Isso é a
plataforma agindo a pedido da humana, não o Claude rodando `git push` —
por isso não esbarra na regra do `settings.json`.

## Caso registrado — branch `claude/ola-q0f1m1` (17/09/2026)

3 commits (`54c0fbd`, `7950339`, `c0bd952`) feitos numa sessão cloud
("Olá") sobre PWA instalável em `/admin` + desligar a Clara quando
atendente responde por texto. Confirmado via `SendMessage` pra sessão:
branch em cima do `main` da época (`9918398`), working tree limpo, **sem
upstream configurado**. Ver pendência em `MEMORY_WORK.MD`.
