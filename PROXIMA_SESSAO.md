# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (16/08/2026). Leia primeiro:
- MEMORY_WORK.MD deste projeto (pendências 1, 8, 9, 10 são de hoje)
- CLAUDE.md deste projeto, seções "Integridade de migrations e deploys"
  e "Git e deploy" (regras de segurança + deploy automático do Cloudflare)

## Precisa de ação/decisão da Adriana
1. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.
2. Testar o NaPista de ponta a ponta: toggle "Publicar no NaPista" num
   veículo de teste em /admin/portais, conferir se enfileira certo.
3. Perguntar se autorizo `git push` — 10 commits do projeto da revenda
   já prontos localmente, nada enviado ainda pro GitHub.
4. Se ela quiser o Brevo configurado, preciso da chave de API — nada
   foi feito ainda, só confirmado que não existe conector oficial.

## Conferir, sem precisar perguntar
- Meta Ads deve continuar quebrado (403, token expirado) até ela
  reconectar manualmente — não é bug meu de resolver.
- A conexão `chrome-devtools` (headless+isolada, criada hoje) deve
  estar saudável; a original do plugin foi desativada nesta pasta.
- Modo automático (`defaultMode: auto`) já é padrão — isso NÃO
  substitui a regra do CLAUDE.md global da Adriana de pedir
  autorização antes de qualquer mudança em produção.

## Deploy do site — não fazer manual por hábito
O deploy do front **já é automático**: Cloudflare Workers Builds está
conectado ao repositório, dispara build+deploy sozinho a cada push pro
`main` (confirmado direto na API do Cloudflare em 16/08/2026). Rodar
`npx wrangler deploy` manual só em emergência — fazer isso por rotina
já causou o site ficar no ar antes do commit correspondente (sessão 5).

## Segurança — não esquecer
- Nunca usar `execute_sql` direto pra mudança de schema/cron no
  projeto da revenda — sempre via migration.
- Nunca escrever senha/segredo em texto plano numa migration — ver
  regra em CLAUDE.md, seção Migrations.
- Antes de propor mudança em produção, autocrítica proativa própria
  ("o que um especialista atacaria nisso?") sem esperar ser
  perguntado — ver memória permanente `autocritica-antes-de-propor`.
- Antes de propor configuração/integração técnica pra um sistema real
  já conectado (Cloudflare, Supabase, GitHub), checar o estado real com
  a ferramenta disponível (MCP/CLI) ANTES de descrever a solução —
  mesma memória permanente, item mais recente.
- Cuidado com comandos que capturam texto solto de forma genérica
  (ex.: "primeira palavra" de um comando de shell) — hoje um token
  JWT vazou sem querer assim; sempre filtrar/redigir valores que
  pareçam segredo antes de imprimir.
- Senha do Roberto e da conta kmzero (Webmotors) continuam expostas
  numa migration antiga — decisão da Adriana foi não mexer. Não
  reabrir isso sem ela pedir.

## Não repetir do zero
- A investigação de integridade de migrations (47 descasadas, crons
  duplicados) já foi feita e está documentada — não reinvestigar.
- As 22 migrations sem arquivo local continuam pendentes (precisa
  Docker Desktop instalado) — sem urgência, não insistir à toa.
- A auditoria do CLAUDE.md contra os incidentes de hoje já foi feita
  (4 gargalos P0/P1 fechados, `docs/supabase-migrations.md` criado) —
  não reauditar sem motivo novo.
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
