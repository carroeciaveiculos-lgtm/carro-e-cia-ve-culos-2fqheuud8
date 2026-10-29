# AGENTS.md — leia o CLAUDE.md

Este arquivo foi consolidado no `CLAUDE.md` em 28/10/2026.

**Fonte única de regras deste projeto: `CLAUDE.md`** (raiz).

- Stack, padrões, Edge Functions, R2, migrations → `CLAUDE.md`
- Estado atual → `PROXIMA_SESSAO.md`
- Histórico e pendências → `MEMORY_WORK.MD` (use o índice no topo; nunca leia inteiro)
- Regras por assunto → seção "Regras do projeto por assunto" no `CLAUDE.md`

**Correções que este arquivo continha e estavam ERRADAS:**
- O deploy do front **não** é "Cloudflare Workers Builds" (check confirmado em 29/10; o que ele publica não foi verificado). É
  GitHub Actions desde 28/09/2026 — `.github/workflows/deploy.yml`. Conferir com `gh run list`.
- O deploy de functions também é automático — `.github/workflows/deploy-functions.yml`.

Se você é uma ferramenta que só lê `AGENTS.md`, leia o `CLAUDE.md` antes de qualquer ação.