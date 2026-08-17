# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (16/08/2026, sessão 7). Leia primeiro:
- MEMORY_WORK.MD deste projeto
- CLAUDE.md deste projeto, seções "Integridade de migrations e deploys"
  e "Git e deploy" (regras de segurança + deploy automático do Cloudflare)
- docs/meta-ads-mcp.md, seção "Conexão por token" (achado novo de hoje
  sobre como gerar token que não expira)

## Precisa de ação/decisão da Adriana
1. Testar ao vivo a tela nova "Criar Usuário" em /admin/usuarios (feita
   hoje, ainda sem commit): logar como admin, clicar em "Criar Usuário",
   preencher e confirmar que a pessoa nova consegue logar com a senha
   definida. Avisar se der erro em algum passo.
2. Decidir se quer que eu construa troca de senha — hoje não existe
   nenhuma das duas: nem autosserviço (pessoa logada troca a própria
   senha) nem "esqueci minha senha" por e-mail no /admin/login.
3. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.
4. Testar o NaPista de ponta a ponta: toggle "Publicar no NaPista" num
   veículo de teste em /admin/portais, conferir se enfileira certo.
5. Se ela quiser o Brevo configurado, preciso da chave de API — nada
   foi feito ainda, só confirmado que não existe conector oficial.
6. Autorizar commit dos 3 arquivos pendentes da feature "Criar Usuário"
   (`src/pages/admin/Usuarios.tsx`, `src/components/admin/CriarUsuarioModal.tsx`,
   `supabase/functions/criar-usuario-admin/`) — só depois do teste do
   item 1, caso precise ajuste antes.

## Conferir, sem precisar perguntar
- Meta Ads MCP **resolvido em 16/08/2026**: conector conectado com token
  pessoal de longa duração (Admin do app, `expires_at: 0` — não é técnico
  "nunca expira" oficial, mas não tem prazo hoje). Token de Usuário de
  Sistema NUNCA funciona pra essa permissão (`ads_mcp_management`) —
  testado duas vezes, confirmado nos dois. Não reinvestigar, ver
  `docs/meta-ads-mcp.md`.
- `META_ADS_TOKEN`, `META_PAGE_ACCESS_TOKEN` e `WHATSAPP_TOKEN` no
  Supabase testados ao vivo em 16/08/2026 — todos ok, respondendo.
- Push feito em 16/08/2026: 14 commits enviados pro GitHub
  (`3b8d548..aa3d4dd`). Não tem mais nada pendente de push até a próxima
  sessão criar commit novo.
- Modo automático (`defaultMode: auto`) já é padrão — isso NÃO
  substitui a regra do CLAUDE.md global da Adriana de pedir
  autorização antes de qualquer mudança em produção.
- Hook novo criado em 16/08/2026 (`.claude/settings.local.json`, não vai
  pro Git): avisa no início de cada sessão se tem commit aguardando push
  neste projeto. Se não avisar, pode ser que a sessão não tenha
  recarregado o hook ainda — não é bug, só abrir `/hooks` uma vez.
- Regra nova (pedido direto da Adriana, 16/08/2026): sempre que eu
  aplicar uma mudança autorizada, perguntar se ela quer que eu já
  commite em seguida — não deixar acumular.

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
  (ex.: "primeira palavra" de um comando de shell) — já vazou token JWT
  sem querer assim uma vez; sempre filtrar/redigir valores que pareçam
  segredo antes de imprimir.
- A `client_secret` do app Meta (`APP CARRO E CIA`) foi colada em texto
  puro no chat em 16/08/2026, durante o processo de gerar token de longa
  duração — a Adriana disse que ia revogar/trocar depois. Confirmar se
  já trocou; se não, lembrar (developers.facebook.com/apps/1369928368361968/settings/basic/).
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
- Limpeza do Security/Performance Advisor do Supabase feita parcialmente
  em 16/08/2026 (segurança: 67 → 31 avisos, via migration
  `20260817014458_security_advisor_cleanup.sql`) — só o que era zero
  efeito colateral (search_path de 36 funções + 3 índices duplicados).
  O resto (RLS sem policy em 4 tabelas, 2 extensões no schema public, 24
  funções SECURITY DEFINER expostas, proteção de senha vazada, 132
  políticas RLS duplicadas, 42 FKs sem índice, 33 índices não usados)
  ficou de propósito pra decisão/revisão caso a caso — não é "esquecido",
  é escolha consciente. Não reaplicar a mesma análise do zero.
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
